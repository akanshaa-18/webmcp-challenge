import { describe, expect, it } from "vitest";
import { describeCapability, runtimeToolNameForManifest, toolManifests } from "@/lib/capability-registry";

describe("describeCapability", () => {
  it("returns manifest for a known tool", () => {
    const manifest = describeCapability("public.adobe_directory");
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
    expect(runtimeToolNameForManifest("public.adobe_directory")).toBe("adobe_directory");
    expect(runtimeToolNameForManifest("public.get_product_capabilities")).toBe("get_product_capabilities");
    expect(runtimeToolNameForManifest("adobe_plans.compare_plan_options")).toBe("compare_plan_options");
  });

  it("returns unprefixed names unchanged", () => {
    expect(runtimeToolNameForManifest("adobe_directory")).toBe("adobe_directory");
  });
});

describe("toolManifests", () => {
  it("contains adobe_directory as a global discovery tool", () => {
    const names = toolManifests.map((t) => t.toolName);
    expect(names).toContain("public.adobe_directory");
  });

  it("does not contain removed tools", () => {
    const names = toolManifests.map((t) => t.toolName);
    expect(names).not.toContain("public.find_apps_for_feature");
    expect(names).not.toContain("public.find_product_for_task");
    expect(names).not.toContain("public.build_adobe_workflow");
  });
});
