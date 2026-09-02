import { Plan, UserFixture } from "@/lib/types";
import { toolError } from "@/lib/errors";
import { resolvePlanPrice } from "@/lib/regional-pricing";

interface PlanCompareInput {
  requirements: string[];
  region?: string;
  student?: boolean;
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

export function getUserRegion(user: UserFixture) {
  return {
    status: "ok" as const,
    data: {
      region: user.region,
      city: user.city,
      student: user.student,
    },
  };
}

export function getRegionalPlans(plans: Plan[], user: UserFixture, input: { region?: string; audience?: string }) {
  const region = input.region ?? user.region;
  const audience = input.audience ? normalize(input.audience) : undefined;

  const filtered = plans.filter((plan) => {
    if (plan.region !== region) return false;
    if (!audience) return true;
    if (audience === "student") return plan.studentEligible;
    return normalize(plan.audience) === audience;
  });

  return {
    status: "ok" as const,
    data: {
      region,
      audience: audience ?? (user.student ? "student" : "individual"),
      plans: filtered,
      dataSource: "demo_snapshot",
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
      region: plan.region,
      audience: plan.audience,
      dataSource: "demo_snapshot",
    },
  };
}

export async function getPlanPrice(plans: Plan[], user: UserFixture, input: { planId: string; region?: string }) {
  const targetRegion = input.region ?? user.region;
  const plan = plans.find((item) => item.id === input.planId && item.region === targetRegion);
  if (!plan) {
    return toolError("UNKNOWN_PLAN", `No plan found for ${input.planId} in region ${targetRegion}.`);
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
    },
  };
}

export async function comparePlanOptions(plans: Plan[], user: UserFixture, input: PlanCompareInput) {
  if (!input.requirements?.length) {
    return toolError("MISSING_REQUIRED_CONTEXT", "requirements must include at least one item.");
  }

  const region = input.region ?? user.region;
  const student = input.student ?? user.student;
  const regional = plans.filter((plan) => plan.region === region);
  const assessed = regional.map((plan) => {
    const features = planFeatures(plan);
    const matchedCapabilities = input.requirements.filter((req) => isRequirementMatched(req, features));
    const missingCapabilities = input.requirements.filter(
      (req) => !matchedCapabilities.includes(req),
    );
    const eligible = student ? plan.studentEligible : true;

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
      const price = await getPlanPrice(plans, user, {
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
      student,
      requirements: input.requirements,
      candidates,
      recommendedPlan: pricedQualified[0]
        ? {
            ...pricedQualified[0].candidate,
            pricing: pricedQualified[0].pricing,
          }
        : null,
      dataSource: "live_regional_pricing",
    },
  };
}
