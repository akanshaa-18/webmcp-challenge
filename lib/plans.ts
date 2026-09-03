import { Plan } from "@/lib/types";
import { toolError } from "@/lib/errors";
import { resolvePlanPrice } from "@/lib/regional-pricing";

/**
 * User-audience concept for plan recommendation. Intentionally excludes
 * "business" -- the current static catalog has no business/teams plan, so
 * accepting that value here would invite a silent, unsupported match. See
 * Phase 2 architecture audit.
 */
export type UserAudience = "student" | "individual";

/**
 * Same-session context a calling agent already supplied explicitly on an
 * earlier tool call (persisted via IntentPassport by the WebMCP tool layer).
 * This is never fixture-seeded -- it only ever reflects prior explicit input.
 */
export interface SessionContext {
  region?: string;
  audience?: string;
}

type ContextSourceValue = "explicit" | "session" | "none";

interface PlanCompareInput {
  requirements: string[];
  region?: string;
  student?: boolean;
  audience?: string;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function planFeatures(plan: Plan): string[] {
  return [...plan.capabilities, ...plan.includedApps].map((item) => normalize(item));
}

function isRequirementMatched(requirement: string, features: string[]): boolean {
  const token = normalize(requirement);
  return features.some((feature) => feature.includes(token) || token.includes(feature));
}

function isUserAudience(value: unknown): value is UserAudience {
  return value === "student" || value === "individual";
}

function resolveRegion(
  explicitRegion: string | undefined,
  sessionContext?: SessionContext,
): { region?: string; source: ContextSourceValue } {
  if (explicitRegion) {
    return { region: explicitRegion, source: "explicit" };
  }
  if (sessionContext?.region) {
    return { region: sessionContext.region, source: "session" };
  }
  return { region: undefined, source: "none" };
}

/**
 * Resolves the user-audience concept from, in order: explicit `audience`,
 * explicit legacy `student` boolean, then same-session context, then
 * unknown. If both `audience` and `student` are explicitly supplied and
 * disagree, this returns an explicit error rather than silently picking one.
 */
function resolveAudience(
  explicitAudience: string | undefined,
  explicitStudent: boolean | undefined,
  sessionContext?: SessionContext,
) {
  const hasExplicitAudience = explicitAudience !== undefined;
  const hasExplicitStudent = explicitStudent !== undefined;

  if (hasExplicitAudience && !isUserAudience(explicitAudience)) {
    return toolError(
      "UNSUPPORTED_AUDIENCE",
      `Unsupported audience "${explicitAudience}". Supported values: student, individual.`,
    );
  }

  if (hasExplicitAudience && hasExplicitStudent) {
    const studentImpliesAudience: UserAudience = explicitStudent ? "student" : "individual";
    if (studentImpliesAudience !== explicitAudience) {
      return toolError(
        "CONFLICTING_CONTEXT",
        `audience "${explicitAudience}" conflicts with student=${explicitStudent}. Provide one consistent value instead of both.`,
      );
    }
    return { status: "ok" as const, audience: explicitAudience as UserAudience, source: "explicit" as ContextSourceValue };
  }

  if (hasExplicitAudience) {
    return { status: "ok" as const, audience: explicitAudience as UserAudience, source: "explicit" as ContextSourceValue };
  }

  if (hasExplicitStudent) {
    return {
      status: "ok" as const,
      audience: explicitStudent ? ("student" as const) : ("individual" as const),
      source: "explicit" as ContextSourceValue,
    };
  }

  if (sessionContext?.audience && isUserAudience(sessionContext.audience)) {
    return { status: "ok" as const, audience: sessionContext.audience, source: "session" as ContextSourceValue };
  }

  return { status: "ok" as const, audience: undefined, source: "none" as ContextSourceValue };
}

/**
 * Deterministic eligibility matrix (documented in the Phase 2 audit before
 * implementation):
 *   audience="student"   -> eligible iff plan.studentEligible
 *   audience="individual"-> eligible iff plan.audience !== "student"
 *                           (excludes the dedicated student plan for a
 *                           declared non-student, without inventing any
 *                           commerce rule the metadata doesn't represent)
 *   audience unknown      -> no restriction applied (eligible)
 */
function isAudienceEligible(plan: Plan, audience: UserAudience | undefined): boolean {
  if (audience === "student") return plan.studentEligible;
  if (audience === "individual") return plan.audience !== "student";
  return true;
}

export function getRegionalPlans(
  plans: Plan[],
  input: { region?: string; audience?: string },
  sessionContext?: SessionContext,
) {
  const { region, source: regionSource } = resolveRegion(input.region, sessionContext);
  const audience = input.audience ? normalize(input.audience) : undefined;

  const filtered = plans.filter((plan) => {
    if (region && !plan.supportedRegions.includes(region)) return false;
    if (!audience) return true;
    if (audience === "student") return plan.studentEligible;
    return normalize(plan.audience) === audience;
  });

  return {
    status: "ok" as const,
    data: {
      region: region ?? null,
      audience: audience ?? null,
      plans: filtered.map((plan) => ({
        id: plan.id,
        name: plan.name,
        supportedRegions: plan.supportedRegions,
        audience: plan.audience,
        billingPeriod: plan.billingPeriod,
        includedApps: plan.includedApps,
        capabilities: plan.capabilities,
        generativeCredits: plan.generativeCredits,
        studentEligible: plan.studentEligible,
      })),
      dataSource: "demo_snapshot",
      contextSource: { region: regionSource },
    },
  };
}

export function getPlanCapabilities(plans: Plan[], planId: string) {
  const plan = plans.find((item) => item.id === planId);
  if (!plan) {
    return toolError("UNKNOWN_PLAN", `Unknown plan ID: ${planId}`);
  }
  return {
    status: "ok" as const,
    data: {
      planId: plan.id,
      includedApps: plan.includedApps,
      capabilities: plan.capabilities,
      generativeCredits: plan.generativeCredits,
      studentEligible: plan.studentEligible,
      supportedRegions: plan.supportedRegions,
      audience: plan.audience,
      dataSource: "demo_snapshot",
    },
  };
}

export async function getPlanPrice(
  plans: Plan[],
  input: { planId: string; region?: string },
  sessionContext?: SessionContext,
) {
  const { region: targetRegion, source: regionSource } = resolveRegion(input.region, sessionContext);

  if (!targetRegion) {
    return toolError(
      "MISSING_REQUIRED_CONTEXT",
      "A region/country is required to resolve live regional pricing. Ask the user which country they are in.",
    );
  }

  // Plan identity is region-neutral: existence is checked by id alone.
  // resolvePlanPrice (MAS -> OSI -> WCS) is the sole authority on whether
  // live pricing actually supports the requested region -- see Phase 2B audit.
  const plan = plans.find((item) => item.id === input.planId);
  if (!plan) {
    return toolError("UNKNOWN_PLAN", `Unknown plan ID: ${input.planId}`);
  }

  const livePrice = await resolvePlanPrice({
    planId: plan.id,
    country: targetRegion,
  });

  if (livePrice.status !== "ok") {
    return {
      status: "price_unavailable" as const,
      data: {
        planId: plan.id,
        region: targetRegion,
        country: livePrice.data.country,
        locale: livePrice.data.locale,
        reason: livePrice.data.reason,
        dataSource: livePrice.data.source,
        retrievedAt: livePrice.data.retrievedAt,
        contextSource: { region: regionSource },
      },
    };
  }

  return {
    status: "ok" as const,
    data: {
      planId: plan.id,
      region: targetRegion,
      country: livePrice.data.country,
      locale: livePrice.data.locale,
      currency: livePrice.data.currency,
      amount: livePrice.data.amount,
      formattedPrice: livePrice.data.formattedPrice,
      billingPeriod: livePrice.data.billingPeriod,
      dataSource: livePrice.data.source,
      retrievedAt: livePrice.data.retrievedAt,
      contextSource: { region: regionSource },
    },
  };
}

export async function comparePlanOptions(
  plans: Plan[],
  input: PlanCompareInput,
  sessionContext?: SessionContext,
) {
  if (!input.requirements?.length) {
    return toolError("MISSING_REQUIRED_CONTEXT", "requirements must include at least one item.");
  }

  const audienceResolution = resolveAudience(input.audience, input.student, sessionContext);
  if ("status" in audienceResolution && audienceResolution.status === "error") {
    return audienceResolution;
  }
  const { audience, source: audienceSource } = audienceResolution as {
    audience?: UserAudience;
    source: ContextSourceValue;
  };

  const { region, source: regionSource } = resolveRegion(input.region, sessionContext);
  if (!region) {
    return toolError(
      "MISSING_REQUIRED_CONTEXT",
      "A region/country is required to resolve live regional pricing for a recommendation. Ask the user which country they are in.",
    );
  }

  // Plan identity is region-neutral: qualification (capability match +
  // audience eligibility) never varies by country, so no plan is pre-filtered
  // by region here. Region only matters at the pricing step below, via
  // getPlanPrice/resolvePlanPrice.
  const assessed = plans.map((plan) => {
    const features = planFeatures(plan);
    const matchedCapabilities = input.requirements.filter((req) => isRequirementMatched(req, features));
    const missingCapabilities = input.requirements.filter(
      (req) => !matchedCapabilities.includes(req),
    );
    const eligible = isAudienceEligible(plan, audience);

    return {
      planId: plan.id,
      name: plan.name,
      billingPeriod: plan.billingPeriod,
      studentEligible: plan.studentEligible,
      matchedCapabilities,
      missingCapabilities,
      qualifies: eligible && missingCapabilities.length === 0,
    };
  });

  const qualified = assessed.filter((plan) => plan.qualifies);
  type AssessedPlan = (typeof assessed)[number];
  type PricedCandidate = {
    candidate: AssessedPlan;
    pricing: {
      planId: string;
      region: string;
      country: string;
      locale: string;
      currency: string;
      amount: number;
      formattedPrice: string;
      billingPeriod: "month" | "year" | "unknown";
      dataSource: "live_regional_pricing";
      retrievedAt: string;
    };
  };
  const priceResults = await Promise.all(
    qualified.map(async (candidate) => {
      const price = await getPlanPrice(plans, {
        planId: candidate.planId,
        region,
      });
      return { candidate, price };
    }),
  );

  const pricedQualified: PricedCandidate[] = [];
  for (const entry of priceResults) {
    if (entry.price.status === "ok") {
      pricedQualified.push({
        candidate: entry.candidate,
        pricing: entry.price.data,
      });
    }
  }
  pricedQualified.sort((a, b) => a.pricing.amount - b.pricing.amount || a.candidate.name.localeCompare(b.candidate.name));

  const candidates = assessed.map((candidate) => {
    const matched = priceResults.find((entry) => entry.candidate.planId === candidate.planId);
    if (!matched) {
      return candidate;
    }
    if (matched.price.status === "ok") {
      return {
        ...candidate,
        pricing: matched.price.data,
      };
    }
    if (matched.price.status === "price_unavailable") {
      return {
        ...candidate,
        pricing: matched.price.data,
      };
    }
    return {
      ...candidate,
      pricing: {
        planId: candidate.planId,
        region,
        reason: "contract_error",
      },
    };
  });

  return {
    status: "ok" as const,
    data: {
      region,
      audience: audience ?? null,
      student: audience === "student" ? true : audience === "individual" ? false : null,
      requirements: input.requirements,
      candidates,
      recommendedPlan: pricedQualified[0]
        ? {
            ...pricedQualified[0].candidate,
            pricing: pricedQualified[0].pricing,
          }
        : null,
      dataSource: "live_regional_pricing",
      contextSource: { region: regionSource, audience: audienceSource },
    },
  };
}
