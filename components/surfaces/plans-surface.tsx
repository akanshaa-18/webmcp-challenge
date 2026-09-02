"use client";

import { useEffect, useState } from "react";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { plansFixture } from "@/lib/fixtures";
import { getMissionRuntime } from "@/lib/mission-runtime";
import {
  comparePlanOptions,
  getPlanCapabilities,
  getPlanPrice,
  getRegionalPlans,
  SessionContext,
} from "@/lib/plans";
import { toolError } from "@/lib/errors";

interface PriceViewState {
  status: "loading" | "ok" | "price_unavailable";
  formattedPrice?: string;
  currency?: string;
  amount?: number;
  billingPeriod?: string;
  reason?: string;
}

function readSessionContext(): SessionContext {
  const runtime = getMissionRuntime();
  return {
    region: runtime?.intentPassport.region,
    audience: runtime?.intentPassport.audience,
  };
}

export function PlansSurface() {
  const [lastToolOutput, setLastToolOutput] = useState<string>("No tool output yet.");
  const [priceStateByPlan, setPriceStateByPlan] = useState<Record<string, PriceViewState>>(
    plansFixture.reduce<Record<string, PriceViewState>>((acc, plan) => {
      acc[plan.id] = { status: "loading" };
      return acc;
    }, {}),
  );
  const globalStatus = useGlobalWebMcpTools("Adobe Plans", "/plans");

  useEffect(() => {
    let cancelled = false;

    // Catalog browse view: each plan is priced using its OWN first declared
    // supported region (plan.supportedRegions[0]), not a guess about the
    // visitor. This is plan metadata, not user context, so it never
    // fabricates who/where the visitor is.
    const load = async () => {
      const resolved = await Promise.all(
        plansFixture.map(async (plan) => {
          const result = await getPlanPrice(plansFixture, { planId: plan.id, region: plan.supportedRegions[0] });
          return { planId: plan.id, result };
        }),
      );

      if (cancelled) return;

      setPriceStateByPlan((current) => {
        const next = { ...current };
        for (const entry of resolved) {
          if (entry.result.status === "ok") {
            next[entry.planId] = {
              status: "ok",
              formattedPrice: entry.result.data.formattedPrice,
              currency: entry.result.data.currency,
              amount: entry.result.data.amount,
              billingPeriod: entry.result.data.billingPeriod,
            };
            continue;
          }
          next[entry.planId] = {
            status: "price_unavailable",
            reason: "data" in entry.result ? entry.result.data.reason : undefined,
          };
        }
        return next;
      });
    };

    load().catch(() => {
      if (cancelled) return;
      setPriceStateByPlan((current) =>
        Object.fromEntries(
          Object.entries(current).map(([planId]) => [planId, { status: "price_unavailable", reason: "upstream_unavailable" }]),
        ),
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const [localTools] = useState(() => [
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
        setLastToolOutput(JSON.stringify(result.data, null, 2));
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
        const result = getPlanCapabilities(plansFixture, input.planId);
        if ("status" in result && result.status === "ok") {
          setLastToolOutput(JSON.stringify(result.data, null, 2));
        }
        return result;
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
        if ("status" in result && "data" in result) {
          setLastToolOutput(JSON.stringify(result.data, null, 2));
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
        if (result.status === "ok") {
          const runtime = getMissionRuntime();
          runtime?.updateIntentPassport((passport) => ({
            ...passport,
            ...(input?.region ? { region: input.region } : {}),
            ...(result.data.audience && (input?.audience !== undefined || input?.student !== undefined)
              ? { audience: result.data.audience }
              : {}),
          }));
          setLastToolOutput(JSON.stringify(result.data, null, 2));
        }
        return result;
      },
    },
  ]);

  const localStatus = useWebMcpTools(localTools);

  return (
    <div className="plans-surface">
      <section className="plans-hero">
        <p className="small-note">Plans and pricing</p>
        <h1 className="hero-title">Find the right plan</h1>
        <p className="hero-subtitle">Choose from Individuals and Students &amp; Teachers plans.</p>
        <div className="plans-audience-tabs">
          <button className="plans-tab plans-tab-active" type="button">Students &amp; Teachers</button>
          <button className="plans-tab" type="button">Individuals</button>
        </div>
      </section>

      <section className="plans-card-grid">
        {plansFixture.map((plan) => (
          <article key={plan.id} className="plans-card">
            <p className="small-note">{plan.audience === "student" ? "Students & Teachers" : "Individual"}</p>
            <h2>{plan.name}</h2>
            <p className="plans-price">
              {priceStateByPlan[plan.id]?.status === "loading" ? (
                <span>Loading live price…</span>
              ) : null}
              {priceStateByPlan[plan.id]?.status === "ok" ? (
                <>
                  <span>{priceStateByPlan[plan.id].formattedPrice}</span>
                  <small>/{priceStateByPlan[plan.id].billingPeriod}</small>
                </>
              ) : null}
              {priceStateByPlan[plan.id]?.status === "price_unavailable" ? (
                <span>Price unavailable</span>
              ) : null}
            </p>
            {priceStateByPlan[plan.id]?.status === "price_unavailable" ? (
              <p className="small-note">Reason: {priceStateByPlan[plan.id].reason ?? "pricing_unavailable"}</p>
            ) : null}
            <p className="small-note">{plan.studentEligible ? "Eligible with student verification" : "Standard eligibility"}</p>
            <ul className="plans-feature-list">
              {plan.includedApps.map((app) => (
                <li key={`${plan.id}-${app}`}>{app}</li>
              ))}
            </ul>
            <div className="badge-row">
              <span className="status-badge">Generative credits: {plan.generativeCredits}</span>
            </div>
            <button type="button" className="button-link">Choose this plan</button>
          </article>
        ))}
      </section>

      <section className="preview-card">
        <h2 className="section-title">Recommendation output</h2>
        <div className="code-block">{lastToolOutput}</div>
      </section>

      <p className="plans-disclosure small-note">
        Plan information uses a public reference snapshot. Pricing is resolved at request time from live regional pricing.
      </p>

      <details className="details-pane">
        <summary>Developer details</summary>
        <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
          <ToolRegistrationStatus
            available={globalStatus.available}
            registeredTools={globalStatus.registeredTools}
          />
          <ToolRegistrationStatus available={localStatus.available} registeredTools={localStatus.registeredTools} />
        </div>
      </details>
    </div>
  );
}
