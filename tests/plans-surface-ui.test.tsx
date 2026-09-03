// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { MissionProvider } from "@/components/mission-provider";
import { PlansSurface } from "@/components/surfaces/plans-surface";
import { WebMcpTool } from "@/lib/webmcp";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/plans",
}));

function Harness() {
  return (
    <MissionProvider>
      <PlansSurface />
    </MissionProvider>
  );
}

function registerTools() {
  const tools = new Map<string, WebMcpTool>();
  Object.defineProperty(document, "modelContext", {
    value: {
      registerTool: (tool: WebMcpTool) => {
        tools.set(tool.name, tool);
      },
      unregisterTool: (name: string) => {
        tools.delete(name);
      },
    },
    configurable: true,
  });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("plans surface ui cleanup", () => {
  it("removes persona/header chrome and keeps snapshot/live provenance disclosure", async () => {
    registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness />);
    });
    await flush();

    const text = container.textContent ?? "";
    expect(text).toContain("Plans and pricing");
    expect(text).toContain("Find the right plan");

    expect(text).not.toContain("Meera");
    expect(text).not.toContain("Bangalore");
    expect(text).not.toContain("Region: IN");
    expect(text).not.toContain("Demo plan data for WebMCP prototype");
    expect(text).not.toContain("Adobe | Creative Cloud");
    expect(text).not.toContain("Creativity & Design");
    expect(text).not.toContain("PDF & E-signatures");
    expect(text).not.toContain("Marketing & Commerce");

    expect(text).toContain(
      "Plan information uses a public reference snapshot. Pricing is resolved at request time from live regional pricing.",
    );

    // No business/teams plan exists in the catalog -- the tab must not claim
    // support that the current data cannot honestly fulfill (Phase 2A).
    expect(text).not.toContain("Business");

    await act(async () => {
      root.unmount();
    });
  });

  it("registers plan tool schemas with no fabricated persona language", async () => {
    const tools = new Map<string, WebMcpTool>();
    Object.defineProperty(document, "modelContext", {
      value: {
        registerTool: (tool: WebMcpTool) => {
          tools.set(tool.name, tool);
        },
        unregisterTool: (name: string) => {
          tools.delete(name);
        },
      },
      configurable: true,
    });

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Harness />);
    });
    await flush();

    for (const toolName of ["get_regional_plans", "get_plan_price", "compare_plan_options"]) {
      const tool = tools.get(toolName);
      expect(tool).toBeDefined();
      const serialized = JSON.stringify(tool?.inputSchema ?? {}) + (tool?.description ?? "");
      expect(serialized).not.toContain("Meera");
    }

    const compareTool = tools.get("compare_plan_options");
    const properties = (compareTool?.inputSchema as { properties?: Record<string, unknown> } | undefined)
      ?.properties;
    expect(properties).toHaveProperty("audience");
    expect(properties).toHaveProperty("student");

    await act(async () => {
      root.unmount();
    });
  });
});
