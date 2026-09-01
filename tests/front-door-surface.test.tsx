// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MissionProvider } from "@/components/mission-provider";
import { FrontDoorSurface } from "@/components/surfaces/front-door-surface";
import { UniversalNav } from "@/components/universal-nav";
import { getMissionRuntime } from "@/lib/mission-runtime";
import { WebMcpTool } from "@/lib/webmcp";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const pushSpy = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
  usePathname: () => "/cc-home",
}));

function Harness() {
  return (
    <MissionProvider>
      <UniversalNav />
      <FrontDoorSurface />
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

describe("front door surface", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    pushSpy.mockClear();
  });

  it("updates IntentPassport, renders workflow order/destination, and creates valid handoff", async () => {
    registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness />);
    });
    await flush();

    const goalInput = container.querySelector<HTMLTextAreaElement>("#frontdoor-goal");
    expect(goalInput).toBeDefined();
    const nextGoal = "Remove background and create instagram post";
    await act(async () => {
      if (goalInput) {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value",
        )?.set;
        setter?.call(goalInput, nextGoal);
        goalInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    const composeButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Compose Adobe workflow",
    );
    expect(composeButton).toBeDefined();
    await act(async () => {
      composeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(container.textContent).toContain("Your Adobe workflow");
    const text = container.textContent ?? "";
    expect(text.indexOf("Adobe Firefly")).toBeLessThan(text.indexOf("Adobe Express"));
    expect(container.textContent).toContain("https://firefly.adobe.com/");
    expect(getMissionRuntime()?.intentPassport.userGoal).toBe(nextGoal);

    const continueButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim().startsWith("Continue to Adobe Firefly"),
    );
    expect(continueButton).toBeDefined();
    await act(async () => {
      continueButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const destination = pushSpy.mock.calls.at(-1)?.[0] as string | undefined;
    expect(destination).toMatch(/^\/firefly\?handoff=/);
    const handoffId = destination?.split("handoff=")[1];
    const handoff = getMissionRuntime()?.getHandoff(handoffId ?? "");
    expect(handoff?.intentPassportId).toBeDefined();
    expect(handoff?.selectedWorkflowId).toBe("wf-firefly-express");
    expect(handoff?.selectedWorkflowStep).toBe("firefly-background-transformation");

    await act(async () => {
      root.unmount();
    });
  });

  it("persists intent passport and shows plans/compatibility summaries using existing logic", async () => {
    registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness />);
    });
    await flush();

    const composeButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Compose Adobe workflow",
    );
    await act(async () => {
      composeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(container.textContent).toContain("Adobe Plans");
    expect(container.textContent).toContain("Recommended plan:");
    expect(container.textContent).toContain("Regional price:");
    expect(container.textContent).toContain("demo_snapshot");
    expect(container.textContent).toContain("Device compatibility");
    expect(container.textContent).toContain("More device information needed.");
    expect(container.textContent).toContain("public_reference_snapshot");

    await act(async () => {
      root.unmount();
    });

    const secondRoot = createRoot(container);
    await act(async () => {
      secondRoot.render(<Harness />);
    });
    await flush();

    expect(getMissionRuntime()?.intentPassport.recommendedWorkflow).toContain("Adobe Firefly");

    await act(async () => {
      secondRoot.unmount();
    });
  });

  it("does not present legacy private files or duplicate cleanup as front-door primary UI", async () => {
    registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness />);
    });
    await flush();

    const text = container.textContent ?? "";
    expect(text).not.toContain("Kaftan-logo-final.psd");
    expect(text).not.toContain("Kaftan-logo-copy.psd");
    expect(text).not.toContain("Duplicate cleanup");
    expect(text).not.toContain("Recent files");
    expect(text).not.toContain("Mission Control");

    await act(async () => {
      root.unmount();
    });
  });
});
