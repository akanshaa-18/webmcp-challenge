import { describe, expect, it, vi } from "vitest";
import { plansFixture, userFixture } from "@/lib/fixtures";
import { comparePlanOptions, getPlanCapabilities, getPlanPrice, getRegionalPlans, getUserRegion } from "@/lib/plans";
import { clearRegionalPricingCache } from "@/lib/regional-pricing";

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

  it("returns live regional pricing metadata", async () => {
    const pricing = await getPlanPrice(plansFixture, userFixture, { planId: "adobe-student-cc-in" });
    if ("status" in pricing && pricing.status === "error") {
      throw new Error("Expected known plan pricing");
    }
    expect(pricing.status).toBe("ok");
    if (pricing.status === "ok") {
      expect(pricing.data.dataSource).toBe("live_regional_pricing");
      expect(pricing.data.region).toBe("IN");
      expect(pricing.data.country).toBe("IN");
      expect(pricing.data.locale).toBe("en_IN");
      expect(pricing.data.currency).toBe("INR");
    }
  });

  it("comparison avoids missing-capability plans and prefers lower-cost qualifying option", async () => {
    const result = await comparePlanOptions(plansFixture, userFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
    });
    if ("status" in result && result.status === "error") {
      throw new Error("Expected deterministic comparison result.");
    }

    const recommended = result.data.recommendedPlan;
    expect(recommended).not.toBeNull();
    expect(recommended?.missingCapabilities).toHaveLength(0);
    expect(recommended?.planId).toBe("adobe-student-cc-in");

    const rerun = await comparePlanOptions(plansFixture, userFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
    });
    if ("status" in rerun && rerun.status === "error") {
      throw new Error("Expected deterministic comparison result.");
    }
    expect(rerun.data.recommendedPlan?.planId).toBe(recommended?.planId);
    expect(rerun.data.dataSource).toBe("live_regional_pricing");
  });

  it("compare_plan_options continues when one qualifying plan pricing fails", async () => {
    clearRegionalPricingCache();
    const fetchMock = vi.mocked(globalThis.fetch);
    const baseline = fetchMock.getMockImplementation() ?? (async () => new Response("", { status: 500 }));
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      if (url.pathname === "/mas/io/fragment" && url.searchParams.get("id") === "2c5cd672-1db8-409c-96ff-46b1a1dfb7dc") {
        return new Response("", { status: 404 });
      }
      return baseline(input, init);
    });

    const result = await comparePlanOptions(plansFixture, userFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
      region: "IN",
      student: true,
    });
    fetchMock.mockImplementation(baseline);

    if (result.status === "error") {
      throw new Error("Expected comparison output.");
    }
    expect(result.data.recommendedPlan?.planId).toBe("adobe-student-cc-in");
    expect(result.data.candidates.some(
      (candidate) =>
        candidate.planId === "adobe-all-apps-in"
        && "pricing" in candidate
        && Boolean((candidate as { pricing?: { reason?: string } }).pricing?.reason),
    )).toBe(true);
  });

  it("compare_plan_options returns no recommendation when all qualifying prices fail", async () => {
    clearRegionalPricingCache();
    const fetchMock = vi.mocked(globalThis.fetch);
    const baseline = fetchMock.getMockImplementation() ?? (async () => new Response("", { status: 500 }));
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      if (url.pathname === "/mas/io/fragment") {
        return new Response("", { status: 404 });
      }
      return baseline(input, init);
    });

    const result = await comparePlanOptions(plansFixture, userFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
      region: "IN",
      student: true,
    });
    fetchMock.mockImplementation(baseline);

    if (result.status === "error") {
      throw new Error("Expected comparison output.");
    }
    expect(result.data.recommendedPlan).toBeNull();
    expect(result.data.candidates.some(
      (candidate) =>
        candidate.qualifies
        && "pricing" in candidate
        && Boolean((candidate as { pricing?: { reason?: string } }).pricing?.reason),
    )).toBe(true);
  });
});
