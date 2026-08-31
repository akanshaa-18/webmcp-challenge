import { Plan, UserFixture } from "@/lib/types";
import { toolError } from "@/lib/errors";

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

export function getPlanPrice(plans: Plan[], user: UserFixture, input: { planId: string; region?: string }) {
  const targetRegion = input.region ?? user.region;
  const plan = plans.find((item) => item.id === input.planId && item.region === targetRegion);
  if (!plan) {
    return toolError("UNKNOWN_PLAN", `No plan found for ${input.planId} in region ${targetRegion}.`);
  }
  return {
    status: "ok" as const,
    data: {
      planId: plan.id,
      region: plan.region,
      currency: plan.currency,
      amount: plan.price,
      billingPeriod: plan.billingPeriod,
      dataSource: "demo_snapshot",
    },
  };
}

export function comparePlanOptions(plans: Plan[], user: UserFixture, input: PlanCompareInput) {
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
      price: plan.price,
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      studentEligible: plan.studentEligible,
      matchedCapabilities,
      missingCapabilities,
      qualifies: eligible && missingCapabilities.length === 0,
    };
  });

  const candidates = assessed
    .filter((plan) => plan.qualifies)
    .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));

  return {
    status: "ok" as const,
    data: {
      region,
      student,
      requirements: input.requirements,
      candidates: assessed,
      recommendedPlan: candidates[0] ?? null,
      dataSource: "demo_snapshot",
    },
  };
}

