import { describe, expect, it } from "vitest";
import { plansFixture, userFixture } from "@/lib/fixtures";
import { comparePlanOptions, getPlanCapabilities, getPlanPrice, getRegionalPlans, getUserRegion } from "@/lib/plans";

describe("plans tools logic", () => {
  it("defaults region to IN for Meera", () => {
    const result = getUserRegion(userFixture);
    expect(result.data.region).toBe("IN");
    expect(result.data.city).toBe("Bangalore");
    expect(result.data.student).toBe(true);
  });

  it("filters regional plans and student eligibility", () => {
    const regional = getRegionalPlans(plansFixture, userFixture, {});
    expect(regional.data.region).toBe("IN");
    expect(regional.data.plans.length).toBeGreaterThan(0);

    const studentOnly = getRegionalPlans(plansFixture, userFixture, { audience: "student" });
    expect(studentOnly.data.plans.every((plan) => plan.studentEligible)).toBe(true);

    const wrongRegion = getRegionalPlans(plansFixture, userFixture, { region: "US" });
    expect(wrongRegion.data.plans).toHaveLength(0);
  });

  it("returns plan capabilities by id", () => {
    const capabilities = getPlanCapabilities(plansFixture, "adobe-student-cc-in");
    if ("status" in capabilities && capabilities.status === "error") {
      throw new Error("Expected known plan capabilities");
    }
    expect(capabilities.data.includedApps).toContain("Photoshop");
    expect(capabilities.data.capabilities).toContain("business card design");
  });

  it("returns demo snapshot pricing metadata", () => {
    const pricing = getPlanPrice(plansFixture, userFixture, { planId: "adobe-student-cc-in" });
    if ("status" in pricing && pricing.status === "error") {
      throw new Error("Expected known plan pricing");
    }
    expect(pricing.data.dataSource).toBe("demo_snapshot");
    expect(pricing.data.region).toBe("IN");
  });

  it("comparison avoids missing-capability plans and prefers lower-cost qualifying option", () => {
    const result = comparePlanOptions(plansFixture, userFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
    });
    if ("status" in result && result.status === "error") {
      throw new Error("Expected deterministic comparison result.");
    }

    const recommended = result.data.recommendedPlan;
    expect(recommended).not.toBeNull();
    expect(recommended?.missingCapabilities).toHaveLength(0);
    expect(recommended?.planId).toBe("adobe-student-cc-in");

    const rerun = comparePlanOptions(plansFixture, userFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
    });
    if ("status" in rerun && rerun.status === "error") {
      throw new Error("Expected deterministic comparison result.");
    }
    expect(rerun.data.recommendedPlan?.planId).toBe(recommended?.planId);
  });
});
