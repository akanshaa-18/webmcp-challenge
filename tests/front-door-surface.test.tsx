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

  it("updates IntentPassport, prepares external handoff, and does not route through local Firefly", async () => {
    registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness />);
    });
    await flush();

    expect(container.textContent).toContain("✦ Creative Community");
    expect(container.textContent).toContain("Creative Community workspace");
    expect(container.textContent).not.toContain("Adobe Agentic");
    expect(container.textContent).not.toContain("Adobe Agentic workspace");
    expect(container.textContent).toContain("Will Premiere Pro run on my Mac?");
    const navLabels = Array.from(container.querySelectorAll(".mission-mini-links a")).map(
      (link) => link.textContent?.trim(),
    );
    expect(navLabels).toEqual(["Home", "Plans", "Capabilities"]);

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
      (button) => button.textContent?.trim() === "Compose creative workflow",
    );
    expect(composeButton).toBeDefined();
    await act(async () => {
      composeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(container.textContent).toContain("Your creative workflow");
    expect(container.textContent).toContain("Why this is recommended");
    expect(container.textContent).toContain("Plans");
    expect(container.textContent).toContain("Find the right product");
    expect(container.textContent).not.toContain("Compose Adobe workflow");
    expect(container.textContent).not.toContain("Your Adobe workflow");
    expect(container.textContent).not.toContain("Why Adobe recommends this");
    expect(container.textContent).not.toContain("Kaftan Adobe Creative Mission Control");
    expect(container.textContent).toContain("Open Adobe Firefly");
    expect(container.textContent).not.toContain("change_background");
    expect(container.textContent).not.toContain("create_business_card");
    const text = container.textContent ?? "";
    expect(text.indexOf("Adobe Firefly")).toBeLessThan(text.indexOf("Adobe Express"));
    expect(container.textContent).toContain("https://firefly.adobe.com/");
    expect(getMissionRuntime()?.intentPassport.userGoal).toBe(nextGoal);

    const continueLink = Array.from(container.querySelectorAll("a")).find(
      (link) => link.textContent?.trim() === "Open Adobe Firefly",
    );
    expect(continueLink).toBeDefined();
    expect(continueLink?.getAttribute("href")).toBe("https://firefly.adobe.com/");
    await act(async () => {
      continueLink?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(pushSpy).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Add your source image in Firefly to continue.");
    expect(container.textContent).toContain("Next workflow step: Adobe Express");
    const handoffId = getMissionRuntime()?.intentPassport.handoffTrail.at(-1) ?? "";
    const handoff = getMissionRuntime()?.getHandoff(handoffId ?? "");
    expect(handoff?.intentPassportId).toBeDefined();
    expect(handoff?.selectedWorkflowId).toBe("wf-firefly-express");
    expect(handoff?.selectedWorkflowStep).toBe("firefly-background-transformation");
    expect(handoff?.selectedDestination).toBe("https://firefly.adobe.com/");

    await act(async () => {
      root.unmount();
    });
  });

  it("persists intent passport and shows a neutral Plans prompt (no fabricated personalized recommendation)", async () => {
    registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness />);
    });
    await flush();

    const composeButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Compose creative workflow",
    );
    await act(async () => {
      composeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(container.textContent).toContain("Plans");
    // The front door must not silently run a personalized recommendation
    // pretending the visitor is India + student (Phase 2A).
    expect(container.textContent).not.toContain("Recommended plan:");
    expect(container.textContent).not.toContain("Student · India");
    expect(container.textContent).toContain(
      "Tell an agent your requirements, country, and whether you're a student",
    );
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
