import { describe, expect, it } from "vitest";
import { findAppsForFeature } from "@/lib/public-intelligence";
import { getAllTaskTypes } from "@/lib/catalog/capabilities";

describe("findAppsForFeature", () => {
  it("returns MISSING_REQUIRED_CONTEXT error for empty feature", () => {
    const result = findAppsForFeature("");
    expect(result.status).toBe("error");
    expect((result as { code: string }).code).toBe("MISSING_REQUIRED_CONTEXT");
  });

  it("returns UNKNOWN_FEATURE error with availableTaskTypes hint for unrecognized input", () => {
    const result = findAppsForFeature("make a sandwich");
    expect(result.status).toBe("error");
    const err = result as { code: string; availableTaskTypes: string[] };
    expect(err.code).toBe("UNKNOWN_FEATURE");
    expect(Array.isArray(err.availableTaskTypes)).toBe(true);
    expect(err.availableTaskTypes.length).toBeGreaterThan(0);
  });

  it("returns Firefly as rank-1 match with Express continuations for 'remove background'", () => {
    const result = findAppsForFeature("remove background");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const top = result.data.matches[0];
    expect(top.productId).toBe("firefly");
    expect(top.capabilityId).toBe("firefly-background-transformation");
    expect(top.continuations.length).toBe(2);
    expect(top.continuations.map((c) => c.productId)).toEqual(["express", "express"]);
  });

  it("returns Photoshop for 'edit photo' with a continuation to Express", () => {
    const result = findAppsForFeature("edit photo");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const top = result.data.matches[0];
    expect(top.productId).toBe("photoshop");
    expect(top.continuations.length).toBe(1);
    expect(top.continuations[0].productId).toBe("express");
  });

  it("returns Premiere Pro for 'edit video' with no continuations", () => {
    const result = findAppsForFeature("edit video");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const top = result.data.matches[0];
    expect(top.productId).toBe("premiere-pro");
    expect(top.continuations).toEqual([]);
  });

  it("returns After Effects for 'motion graphics' chaining to Premiere Pro", () => {
    const result = findAppsForFeature("motion graphics");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const top = result.data.matches[0];
    expect(top.productId).toBe("after-effects");
    expect(top.continuations[0].productId).toBe("premiere-pro");
  });

  it("returns InDesign for 'design brochure' chaining to Acrobat", () => {
    const result = findAppsForFeature("design brochure");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const top = result.data.matches[0];
    expect(top.productId).toBe("indesign");
    expect(top.continuations[0].productId).toBe("acrobat");
  });

  it("returns at most 3 matches", () => {
    const result = findAppsForFeature("generative fill");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.data.matches.length).toBeLessThanOrEqual(3);
  });

  it("deduplicates by productId across matches", () => {
    const result = findAppsForFeature("generative fill");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const productIds = result.data.matches.map((m) => m.productId);
    expect(productIds.length).toBe(new Set(productIds).size);
  });
});

describe("getAllTaskTypes", () => {
  it("returns a non-empty sorted array of unique task type strings", () => {
    const types = getAllTaskTypes();
    expect(types.length).toBeGreaterThan(0);
    expect(types).toEqual([...new Set(types)].sort());
  });
});
