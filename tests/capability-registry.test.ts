import { describe, expect, it } from "vitest";
import { findToolsForTask } from "@/lib/capability-registry";

describe("capability matching", () => {
  it("recommends firefly.change_background for background tasks", () => {
    const result = findToolsForTask("change image background");
    expect(result.recommendedTool?.toolName).toBe("firefly.change_background");
  });

  it("discovers plans capability for pricing/plan tasks", () => {
    expect(findToolsForTask("find the right Adobe plan").recommendedTool?.toolName).toBe(
      "adobe_plans.compare_plan_options",
    );
    expect(findToolsForTask("Adobe pricing in India").recommendedTool?.toolName).toBe(
      "adobe_plans.compare_plan_options",
    );
  });
});
