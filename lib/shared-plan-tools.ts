import { plansFixture } from "@/lib/fixtures";
import {
  comparePlanOptions,
  getPlanCapabilities,
  getPlanPrice,
  getRegionalPlans,
  SessionContext,
} from "@/lib/plans";
import { toolError } from "@/lib/errors";
import { getMissionRuntime } from "@/lib/mission-runtime";

function readSessionContext(): SessionContext {
  const runtime = getMissionRuntime();
  return {
    region: runtime?.intentPassport.region,
    audience: runtime?.intentPassport.audience,
  };
}

export function createPlanActionTools() {
  return [
    {
      name: "get_regional_plans",
      description:
        "Get structured Adobe plan metadata (apps, capabilities, credits, eligibility) filtered by region and/or catalog audience. Does not return numeric price or currency -- use get_plan_price or compare_plan_options for that.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: {
          region: {
            type: "string",
            description:
              "Optional. Country/region code (e.g. \"IN\") extracted from the user's request. If omitted, reuses a region the user already gave earlier in this session; if none is available, plans are returned unfiltered by region rather than assuming one.",
          },
          audience: {
            type: "string",
            description:
              "Optional. Filters by the PLAN's own catalog audience label (example values: student, individual, professional). This filters plan metadata -- it does not assert who the current user is.",
          },
        },
      },
      execute: (input: { region?: string; audience?: string }) => {
        const sessionContext = readSessionContext();
        const result = getRegionalPlans(plansFixture, input ?? {}, sessionContext);
        if (input?.region) {
          const runtime = getMissionRuntime();
          runtime?.updateIntentPassport((passport) => ({ ...passport, region: input.region }));
        }
        return result;
      },
    },
    {
      name: "get_plan_capabilities",
      description: "Get structured capabilities and included apps for one Adobe plan.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: {
          planId: { type: "string" },
        },
        required: ["planId"],
      },
      execute: (input: { planId?: string }) => {
        if (!input?.planId) {
          return toolError("MISSING_REQUIRED_CONTEXT", "The planId field is required.");
        }
        return getPlanCapabilities(plansFixture, input.planId);
      },
    },
    {
      name: "get_plan_price",
      description:
        "Get regional plan price from live regional pricing data (MAS fragment → offer selector → regional commerce response). Requires a region -- either passed explicitly or already given earlier in this session. If neither is available, returns a missing-context result instead of assuming a region.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: {
          planId: { type: "string" },
          region: {
            type: "string",
            description:
              "Country/region code (e.g. \"IN\") extracted from the user's request. Optional if the user already gave a region earlier in this session; otherwise required. If omitted and no session region exists, this tool returns a missing-context result so you can ask the user which country they're in.",
          },
        },
        required: ["planId"],
      },
      execute: async (input: { planId?: string; region?: string }) => {
        if (!input?.planId) {
          return toolError("MISSING_REQUIRED_CONTEXT", "The planId field is required.");
        }
        const sessionContext = readSessionContext();
        const result = await getPlanPrice(plansFixture, { planId: input.planId, region: input.region }, sessionContext);
        if (input?.region) {
          const runtime = getMissionRuntime();
          runtime?.updateIntentPassport((passport) => ({ ...passport, region: input.region }));
        }
        return result;
      },
    },
    {
      name: "compare_plan_options",
      description:
        "Compare Adobe plans against requirements and recommend the lowest-cost qualifying option using live regional pricing. Requires a region (explicit or from earlier in this session) to resolve a price -- returns a missing-context result otherwise. If both `audience` and `student` are supplied and disagree, returns a conflict error instead of guessing.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: {
          requirements: {
            type: "array",
            items: { type: "string" },
            description: "Creative tasks/capabilities the user needs, extracted from their request.",
          },
          region: {
            type: "string",
            description:
              "Country/region code (e.g. \"IN\", \"US\") extracted from the user's request. Optional if the user already gave a region earlier in this session; otherwise required for a priced recommendation.",
          },
          audience: {
            type: "string",
            enum: ["student", "individual"],
            description:
              "User audience extracted from the user's request. Prefer this over `student`. If omitted, reuses a session value if one was explicitly given earlier; otherwise no audience-based eligibility restriction is applied.",
          },
          student: {
            type: "boolean",
            description:
              "Legacy/compatibility field: true if the user said they are a student, false otherwise. Prefer `audience` when possible. Providing both `audience` and `student` with conflicting meanings returns an error.",
          },
        },
        required: ["requirements"],
      },
      execute: async (input: { requirements?: string[]; region?: string; student?: boolean; audience?: string }) => {
        const sessionContext = readSessionContext();
        const result = await comparePlanOptions(
          plansFixture,
          {
            requirements: input?.requirements ?? [],
            region: input?.region,
            student: input?.student,
            audience: input?.audience,
          },
          sessionContext,
        );
        if (result.status === "ok" && result.data.recommendedPlan) {
          const runtime = getMissionRuntime();
          runtime?.updateIntentPassport((passport) => ({
            ...passport,
            ...(input?.region ? { region: input.region } : {}),
            ...(result.data.audience && (input?.audience !== undefined || input?.student !== undefined)
              ? { audience: result.data.audience }
              : {}),
            // Store actual tool result for premium UI
            comparePlanResult: result.data.recommendedPlan,
          }));
        }
        return result;
      },
    },
  ];
}
