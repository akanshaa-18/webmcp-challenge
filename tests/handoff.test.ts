import { describe, expect, it } from "vitest";
import { seededMission } from "@/lib/fixtures";
import { createHandoff } from "@/lib/handoff";

describe("handoff creation", () => {
  it("creates a Firefly handoff with required mission context", () => {
    const handoff = createHandoff({
      mission: seededMission,
      fromSurface: "CC Home",
      toSurface: "Firefly",
      toolName: "firefly.change_background",
      projectId: "kaftan-001",
      assetIds: ["kaftan-logo-final"],
      task: "Change the background",
      expectedResult: "background-updated-logo",
    });

    expect(handoff.toSurface).toBe("Firefly");
    expect(handoff.toolName).toBe("firefly.change_background");
    expect(handoff.constraints.noDestructiveActionWithoutApproval).toBe(true);
    expect(handoff.assetIds[0]).toBe("kaftan-logo-final");
  });
});

