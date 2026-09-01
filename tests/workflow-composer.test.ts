import { describe, expect, it } from "vitest";
import { buildAdobeWorkflow } from "@/lib/workflow-composer";

describe("buildAdobeWorkflow", () => {
  it("builds a single-step Photoshop workflow for photo editing", () => {
    const result = buildAdobeWorkflow("edit a photo");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.data.steps).toHaveLength(1);
    expect(result.data.steps[0].productId).toBe("photoshop");
  });

  it("builds a multi-step Firefly -> Express workflow for background + Instagram", () => {
    const result = buildAdobeWorkflow("remove background and create instagram post");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.data.steps.map((step) => step.productId)).toEqual(["firefly", "express"]);
    expect(result.data.steps[0].destinationUrl).toBe("https://firefly.adobe.com/");
    expect(result.data.steps[1].destinationUrl).toBe("https://express.adobe.com/");
  });

  it("builds a single-step Premiere workflow for video editing", () => {
    const result = buildAdobeWorkflow("edit video");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.data.steps).toHaveLength(1);
    expect(result.data.steps[0].productId).toBe("premiere-pro");
  });

  it("returns UNKNOWN_TASK for unknown tasks", () => {
    const result = buildAdobeWorkflow("organize my inbox");
    expect(result.status).toBe("error");
    if (!("code" in result)) {
      return;
    }
    expect(result.code).toBe("UNKNOWN_TASK");
  });

  it("returns NO_VALID_WORKFLOW for unsupported mixed-media workflows", () => {
    const result = buildAdobeWorkflow("edit video and remove background");
    expect(result.status).toBe("error");
    if (!("code" in result)) {
      return;
    }
    expect(result.code).toBe("NO_VALID_WORKFLOW");
  });

  it("preserves workflow dependency ordering", () => {
    const result = buildAdobeWorkflow("replace background and adapt for instagram");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.data.steps[0].productId).toBe("firefly");
    expect(result.data.steps[1].productId).toBe("express");
    expect(result.data.steps[1].requires).toContain("background-transformed-image");
  });

  it("returns decision points when creative approval constraints are present", () => {
    const result = buildAdobeWorkflow("remove background", [
      "Don't make creative choices without asking me",
    ]);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.data.decisionPoints.length).toBeGreaterThan(0);
    expect(result.data.decisionPoints[0].type).toBe("creative_direction");
  });
});
