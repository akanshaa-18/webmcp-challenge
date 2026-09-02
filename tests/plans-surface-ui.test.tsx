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
  it("removes persona/header chrome and keeps subtle snapshot disclosure", async () => {
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
      "Pricing and plan information shown in this prototype uses public reference snapshot data.",
    );

    await act(async () => {
      root.unmount();
    });
  });
});
