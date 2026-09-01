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

  it("discovers public product intelligence tools for product-selection prompts", () => {
    expect(
      findToolsForTask("Which Adobe app should I use to remove a background?").recommendedTool?.toolName,
    ).toBe("public.find_product_for_task");
  });

  it("discovers compatibility tools for run-on-device prompts", () => {
    const result = findToolsForTask("Will Premiere run on macOS?");
    expect(result.recommendedTool?.toolName).toBe("public.check_device_compatibility");
    expect(result.alternatives.map((tool) => tool.toolName)).toContain(
      "public.get_product_system_requirements",
    );
  });

  it("discovers workflow composer for workflow-oriented tasks", () => {
    expect(findToolsForTask("what Adobe workflow should I use").recommendedTool?.toolName).toBe(
      "public.build_adobe_workflow",
    );
    expect(
      findToolsForTask("how do I remove a background and make an Instagram post").recommendedTool
        ?.toolName,
    ).toBe("public.build_adobe_workflow");
  });

  it("returns no default recommendation for unrelated tasks", () => {
    expect(findToolsForTask("organize my calendar").recommendedTool).toBeNull();
  });
});
