import { describe, expect, it } from "vitest";
import { describeCapability, runtimeToolNameForManifest, toolManifests } from "@/lib/capability-registry";

describe("describeCapability", () => {
  it("returns manifest for a known tool", () => {
    const manifest = describeCapability("public.find_apps_for_feature");
    expect(manifest).not.toBeNull();
    expect(manifest?.ownerSurface).toBe("Global");
    expect(manifest?.readOnly).toBe(true);
  });

  it("returns null for an unknown tool name", () => {
    expect(describeCapability("public.nonexistent_tool")).toBeNull();
  });
});

describe("runtimeToolNameForManifest", () => {
  it("strips namespace prefix from manifest tool names", () => {
    expect(runtimeToolNameForManifest("public.find_apps_for_feature")).toBe("find_apps_for_feature");
    expect(runtimeToolNameForManifest("public.get_product_capabilities")).toBe("get_product_capabilities");
    expect(runtimeToolNameForManifest("adobe_plans.compare_plan_options")).toBe("compare_plan_options");
  });

  it("returns unprefixed names unchanged", () => {
    expect(runtimeToolNameForManifest("find_apps_for_feature")).toBe("find_apps_for_feature");
  });
});

describe("toolManifests", () => {
  it("contains find_apps_for_feature as a global discovery tool", () => {
    const names = toolManifests.map((t) => t.toolName);
    expect(names).toContain("public.find_apps_for_feature");
  });

  it("does not contain removed tools", () => {
    const names = toolManifests.map((t) => t.toolName);
    expect(names).not.toContain("public.find_product_for_task");
    expect(names).not.toContain("public.build_adobe_workflow");
  });
});
