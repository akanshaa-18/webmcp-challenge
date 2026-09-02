// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MissionProvider } from "@/components/mission-provider";
import { ExpressSurface } from "@/components/surfaces/express-surface";
import { FireflySurface } from "@/components/surfaces/firefly-surface";
import { getMissionRuntime } from "@/lib/mission-runtime";
import { WebMcpTool } from "@/lib/webmcp";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/project/kaftan",
}));

type Stage = "firefly" | "express";

function Harness({ stage, handoffId }: { stage: Stage; handoffId?: string | null }) {
  return (
    <MissionProvider>
      {stage === "firefly" ? <FireflySurface handoffIdFromRoute={handoffId ?? null} /> : null}
      {stage === "express" ? <ExpressSurface handoffIdFromRoute={handoffId ?? null} /> : null}
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
  return tools;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function invokeTool(tools: Map<string, WebMcpTool>, name: string, input?: unknown) {
  const tool = tools.get(name);
  if (!tool) {
    throw new Error(`Tool not registered: ${name}`);
  }
  let result: unknown;
  await act(async () => {
    result = await tool.execute(input);
  });
  return result as { status: string; data?: Record<string, unknown> };
}

describe("public destination surfaces", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("renders Firefly as handoff continuity destination with registry-owned link", async () => {
    const tools = registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness stage="firefly" />);
    });
    await flush();

    const handoffResult = await invokeTool(tools, "prepare_handoff", {
      toolName: "firefly.change_background",
      toSurface: "Firefly",
      task: "Create a dark premium textile background while preserving the approved Kaftan logo.",
      assetIds: ["kaftan-logo-final"],
      expectedResult: "background-updated-logo",
    });
    const handoffId = (handoffResult.data as { handoffId?: string } | undefined)?.handoffId;

    await act(async () => {
      root.render(<Harness stage="firefly" handoffId={handoffId} />);
    });
    await flush();

    const text = container.textContent ?? "";
    expect(text).toContain("Legacy developer/demo route");
    expect(text).toContain("Firefly handoff destination");
    expect(text).toContain("Context carried into Firefly");
    expect(text).toContain("Intent Passport");
    expect(text).toContain("does not claim local file transfer");
    expect(text).not.toContain("Ready to generate");
    expect(text).not.toContain("Kaftan-logo-final.psd");

    const openLink = Array.from(container.querySelectorAll("a")).find(
      (link) => link.textContent?.trim() === "Open Adobe Firefly",
    );
    expect(openLink?.getAttribute("href")).toBe("https://firefly.adobe.com/");

    await act(async () => {
      root.unmount();
    });
  });

  it("renders Express as handoff continuity destination with registry-owned link", async () => {
    const tools = registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness stage="firefly" />);
    });
    await flush();

    const fireflyHandoff = await invokeTool(tools, "prepare_handoff", {
      toolName: "firefly.change_background",
      toSurface: "Firefly",
      task: "Create a dark premium textile background while preserving the approved Kaftan logo.",
      assetIds: ["kaftan-logo-final"],
      expectedResult: "background-updated-logo",
    });
    const fireflyHandoffId = (fireflyHandoff.data as { handoffId?: string } | undefined)?.handoffId;

    await act(async () => {
      root.render(<Harness stage="firefly" handoffId={fireflyHandoffId} />);
    });
    await flush();

    await invokeTool(tools, "change_background", {
      handoffId: fireflyHandoffId,
      assetId: "kaftan-logo-final",
      creativeDirection: "Dark premium textile background",
    });

    const expressHandoff = await invokeTool(tools, "prepare_handoff", {
      toolName: "express.create_business_card",
      toSurface: "Express",
      task: "Create a business card from this asset.",
      assetIds: ["kaftan-logo-background-v1"],
      expectedResult: "business-card-output",
    });
    const expressHandoffId = (expressHandoff.data as { handoffId?: string } | undefined)?.handoffId;

    await act(async () => {
      root.render(<Harness stage="express" handoffId={expressHandoffId} />);
    });
    await flush();

    const text = container.textContent ?? "";
    expect(text).toContain("Legacy developer/demo route");
    expect(text).toContain("Express handoff destination");
    expect(text).toContain("Context carried into Express");
    expect(text).toContain("Intent Passport");
    expect(text).toContain("does not claim binary upload/transfer");
    expect(text).not.toContain("Selected design");
    expect(text).not.toContain("meera@example.com");

    const openLink = Array.from(container.querySelectorAll("a")).find(
      (link) => link.textContent?.trim() === "Open Adobe Express",
    );
    expect(openLink?.getAttribute("href")).toBe("https://express.adobe.com/");

    await act(async () => {
      root.unmount();
    });
  });

  it("keeps intent passport continuity with back-to-workflow link", async () => {
    const tools = registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness stage="firefly" />);
    });
    await flush();

    const handoffResult = await invokeTool(tools, "prepare_handoff", {
      toolName: "firefly.change_background",
      toSurface: "Firefly",
      task: "Change background for social card adaptation",
      assetIds: ["kaftan-logo-final"],
      expectedResult: "background-updated-logo",
    });
    const handoffId = (handoffResult.data as { handoffId?: string } | undefined)?.handoffId;

    await act(async () => {
      root.render(<Harness stage="firefly" handoffId={handoffId} />);
    });
    await flush();

    const runtime = getMissionRuntime();
    await act(async () => {
      runtime?.updateIntentPassport((passport) => ({
        ...passport,
        userGoal: "Public-safe workflow continuity goal",
      }));
    });

    await act(async () => {
      root.unmount();
    });

    const secondRoot = createRoot(container);
    await act(async () => {
      secondRoot.render(<Harness stage="firefly" handoffId={handoffId} />);
    });
    await flush();

    expect(container.textContent).toContain("Public-safe workflow continuity goal");
    const backLink = Array.from(container.querySelectorAll("a")).find(
      (link) => link.textContent?.trim() === "Back to workflow briefing",
    );
    expect(backLink?.getAttribute("href")).toBe("/cc-home");

    await act(async () => {
      secondRoot.unmount();
    });
  });
});
