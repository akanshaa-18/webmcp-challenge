import { describe, expect, it, vi } from "vitest";
import { plansFixture } from "@/lib/fixtures";
import { comparePlanOptions, getPlanCapabilities, getPlanPrice, getRegionalPlans } from "@/lib/plans";
import { clearRegionalPricingCache } from "@/lib/regional-pricing";

describe("plans tools logic", () => {
  it("get_regional_plans has no fabricated region/context on a fresh session", () => {
    const fresh = getRegionalPlans(plansFixture, {});
    expect(fresh.data.region).toBeNull();
    expect(fresh.data.contextSource.region).toBe("none");
    // With no region filter applied, every catalog plan is returned unfiltered
    // (not silently narrowed to a fabricated "IN").
    expect(fresh.data.plans.length).toBe(plansFixture.length);
  });

  it("filters regional plans by explicit region and catalog audience", () => {
    const regional = getRegionalPlans(plansFixture, { region: "IN" });
    expect(regional.data.region).toBe("IN");
    expect(regional.data.contextSource.region).toBe("explicit");
    expect(regional.data.plans.length).toBeGreaterThan(0);

    // get_regional_plans is metadata-only: no numeric price/currency field should
    // ever be present, since get_plan_price/resolvePlanPrice (live MAS -> OSI -> WCS)
    // is the sole authoritative source for numeric pricing.
    for (const plan of regional.data.plans) {
      expect(plan).not.toHaveProperty("price");
      expect(plan).not.toHaveProperty("currency");
    }

    const studentOnly = getRegionalPlans(plansFixture, { region: "IN", audience: "student" });
    expect(studentOnly.data.plans.every((plan) => plan.studentEligible)).toBe(true);

    // Plan identity is region-neutral: every current plan declares
    // supportedRegions: ["IN", "US"], so US is a real match, not a rejection.
    const usRegion = getRegionalPlans(plansFixture, { region: "US" });
    expect(usRegion.data.plans.length).toBe(plansFixture.length);

    const unsupportedRegion = getRegionalPlans(plansFixture, { region: "FR" });
    expect(unsupportedRegion.data.plans).toHaveLength(0);
  });

  it("exposes supportedRegions metadata (not a single region string) from get_regional_plans and get_plan_capabilities", () => {
    const regional = getRegionalPlans(plansFixture, { region: "US" });
    for (const plan of regional.data.plans) {
      expect(plan.supportedRegions).toEqual(["IN", "US"]);
      expect(plan).not.toHaveProperty("region");
    }

    const capabilities = getPlanCapabilities(plansFixture, "adobe-student-cc-in");
    if ("status" in capabilities && capabilities.status === "error") {
      throw new Error("Expected known plan capabilities");
    }
    expect(capabilities.data.supportedRegions).toEqual(["IN", "US"]);
    expect(capabilities.data).not.toHaveProperty("region");
  });

  it("get_regional_plans reuses session region when explicit region is omitted", () => {
    const result = getRegionalPlans(plansFixture, {}, { region: "IN" });
    expect(result.data.region).toBe("IN");
    expect(result.data.contextSource.region).toBe("session");
  });

  it("returns plan capabilities by id", () => {
    const capabilities = getPlanCapabilities(plansFixture, "adobe-student-cc-in");
    if ("status" in capabilities && capabilities.status === "error") {
      throw new Error("Expected known plan capabilities");
    }
    expect(capabilities.data.includedApps).toContain("Photoshop");
    expect(capabilities.data.capabilities).toContain("business card design");
  });

  it("get_plan_price returns missing-context (not India) when region is unavailable", async () => {
    const result = await getPlanPrice(plansFixture, { planId: "adobe-student-cc-in" });
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("MISSING_REQUIRED_CONTEXT");
    }
  });

  it("get_plan_price resolves live regional pricing for an explicit region", async () => {
    const pricing = await getPlanPrice(plansFixture, { planId: "adobe-student-cc-in", region: "IN" });
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
      expect(pricing.data.contextSource.region).toBe("explicit");
    }
  });

  it("get_plan_price resolves live regional pricing for US through the normal application path (no fixture-region gate)", async () => {
    const pricing = await getPlanPrice(plansFixture, { planId: "adobe-student-cc-in", region: "US" });
    if ("status" in pricing && pricing.status === "error") {
      throw new Error("Expected known plan pricing -- plan identity must not be region-gated.");
    }
    expect(pricing.status).toBe("ok");
    if (pricing.status === "ok") {
      expect(pricing.data.dataSource).toBe("live_regional_pricing");
      expect(pricing.data.region).toBe("US");
      expect(pricing.data.country).toBe("US");
      expect(pricing.data.locale).toBe("en_US");
      expect(pricing.data.currency).toBe("USD");
    }
  });

  it("get_plan_price reuses session region and lets explicit region override it", async () => {
    const fromSession = await getPlanPrice(plansFixture, { planId: "adobe-student-cc-in" }, { region: "IN" });
    expect(fromSession.status).toBe("ok");
    if (fromSession.status === "ok") {
      expect(fromSession.data.contextSource.region).toBe("session");
    }

    // Explicit input wins even when session context disagrees.
    const explicitOverride = await getPlanPrice(
      plansFixture,
      { planId: "adobe-student-cc-in", region: "IN" },
      { region: "US" },
    );
    expect(explicitOverride.status).toBe("ok");
    if (explicitOverride.status === "ok") {
      expect(explicitOverride.data.region).toBe("IN");
      expect(explicitOverride.data.contextSource.region).toBe("explicit");
    }
  });

  it("compare_plan_options returns missing-context (not India) when region is unavailable", async () => {
    const result = await comparePlanOptions(plansFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
    });
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("MISSING_REQUIRED_CONTEXT");
    }
  });

  it("comparison avoids missing-capability plans and prefers lower-cost qualifying option (explicit audience=student)", async () => {
    const result = await comparePlanOptions(plansFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
      region: "IN",
      audience: "student",
    });
    if ("status" in result && result.status === "error") {
      throw new Error("Expected deterministic comparison result.");
    }

    const recommended = result.data.recommendedPlan;
    expect(recommended).not.toBeNull();
    expect(recommended?.planId).toBe("adobe-student-cc-in");
    expect(result.data.contextSource).toEqual({ region: "explicit", audience: "explicit" });

    const rerun = await comparePlanOptions(plansFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
      region: "IN",
      audience: "student",
    });
    if ("status" in rerun && rerun.status === "error") {
      throw new Error("Expected deterministic comparison result.");
    }
    expect(rerun.data.recommendedPlan?.planId).toBe(recommended?.planId);
    expect(rerun.data.dataSource).toBe("live_regional_pricing");
  });

  it("compare_plan_options can produce a US-priced recommendation (plan identity is region-neutral)", async () => {
    const result = await comparePlanOptions(plansFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
      region: "US",
      audience: "student",
    });
    if (result.status === "error") {
      throw new Error("Expected a US recommendation -- plan qualification must not be region-gated.");
    }
    expect(result.data.region).toBe("US");
    expect(result.data.recommendedPlan?.planId).toBe("adobe-student-cc-in");
    expect(result.data.recommendedPlan?.pricing).toMatchObject({ country: "US", currency: "USD" });
    expect(result.data.dataSource).toBe("live_regional_pricing");
  });

  it("legacy student:true boolean still works (backward compatibility)", async () => {
    const result = await comparePlanOptions(plansFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
      region: "IN",
      student: true,
    });
    if (result.status === "error") {
      throw new Error("Expected deterministic comparison result.");
    }
    expect(result.data.audience).toBe("student");
    expect(result.data.recommendedPlan?.planId).toBe("adobe-student-cc-in");
  });

  it("conflicting audience and student inputs return an explicit error instead of silently choosing", async () => {
    const result = await comparePlanOptions(plansFixture, {
      requirements: ["photo editing"],
      region: "IN",
      audience: "student",
      student: false,
    });
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("CONFLICTING_CONTEXT");
    }
  });

  it("a declared non-student (audience=individual) is not recommended the dedicated student plan", async () => {
    const result = await comparePlanOptions(plansFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
      region: "IN",
      audience: "individual",
    });
    if (result.status === "error") {
      throw new Error("Expected deterministic comparison result.");
    }
    // Student plan is excluded by audience filtering, so it won't appear in candidates at all
    const studentPlanCandidate = result.data.candidates.find((c) => c.planId === "adobe-student-cc-in");
    expect(studentPlanCandidate).toBeUndefined();
    expect(result.data.recommendedPlan?.planId).not.toBe("adobe-student-cc-in");
  });

  it("legacy student:false boolean also excludes the dedicated student plan", async () => {
    const result = await comparePlanOptions(plansFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
      region: "IN",
      student: false,
    });
    if (result.status === "error") {
      throw new Error("Expected deterministic comparison result.");
    }
    expect(result.data.audience).toBe("individual");
    // Student plan is excluded by audience filtering, so it won't appear in candidates at all
    const studentPlanCandidate = result.data.candidates.find((c) => c.planId === "adobe-student-cc-in");
    expect(studentPlanCandidate).toBeUndefined();
  });

  it("unknown audience applies no audience-based eligibility restriction", async () => {
    const result = await comparePlanOptions(plansFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
      region: "IN",
    });
    if (result.status === "error") {
      throw new Error("Expected deterministic comparison result.");
    }
    expect(result.data.audience).toBeNull();
    expect(result.data.contextSource.audience).toBe("none");
    // With no audience filter, student plan is eligible and appears in candidates
    const studentPlanCandidate = result.data.candidates.find((c) => c.planId === "adobe-student-cc-in");
    expect(studentPlanCandidate).toBeDefined();
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

    const result = await comparePlanOptions(plansFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
      region: "IN",
      audience: "student",
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
      if (url.pathname === "/web_commerce_artifact") {
        return new Response("", { status: 404 });
      }
      return baseline(input, init);
    });

    const result = await comparePlanOptions(plansFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
      region: "IN",
      audience: "student",
    });
    fetchMock.mockImplementation(baseline);

    if (result.status === "error") {
      throw new Error("Expected comparison output.");
    }
    expect(result.data.recommendedPlan).toBeNull();
    expect(result.data.candidates.some(
      (candidate) =>
        "pricing" in candidate
        && Boolean((candidate as { pricing?: { reason?: string } }).pricing?.reason),
    )).toBe(true);
  });
});
