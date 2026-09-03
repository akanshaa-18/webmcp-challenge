// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MissionProvider } from "@/components/mission-provider";
import { CCHomeSurface } from "@/components/surfaces/cc-home-surface";
import { ExpressSurface } from "@/components/surfaces/express-surface";
import { FireflySurface } from "@/components/surfaces/firefly-surface";
import { FrontDoorSurface } from "@/components/surfaces/front-door-surface";
import { PlansSurface } from "@/components/surfaces/plans-surface";
import { UniversalNav } from "@/components/universal-nav";
import { seededMission } from "@/lib/fixtures";
import { getMissionRuntime } from "@/lib/mission-runtime";
import { WebMcpTool } from "@/lib/webmcp";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const pushSpy = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
  usePathname: () => "/project/kaftan",
}));

type Stage = "home" | "project" | "plans" | "firefly" | "express";

function Harness({ stage, handoffId }: { stage: Stage; handoffId?: string | null }) {
  return (
    <MissionProvider>
      <UniversalNav />
      {stage === "home" ? <FrontDoorSurface /> : null}
      {stage === "project" ? <CCHomeSurface route="/project/kaftan" surface="Project" /> : null}
      {stage === "plans" ? <PlansSurface /> : null}
      {stage === "firefly" ? <FireflySurface handoffIdFromRoute={handoffId ?? null} /> : null}
      {stage === "express" ? <ExpressSurface handoffIdFromRoute={handoffId ?? null} /> : null}
    </MissionProvider>
  );
}

function getRegisteredTools() {
  const tools = new Map<string, WebMcpTool>();
  const registerTool = vi.fn(async (tool: WebMcpTool) => {
    tools.set(tool.name, tool);
  });
  const unregisterTool = vi.fn((name: string) => {
    tools.delete(name);
  });

  Object.defineProperty(document, "modelContext", {
    value: { registerTool, unregisterTool },
    configurable: true,
  });

  return { tools, registerTool, unregisterTool };
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

describe("integration journey checkpoint", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    pushSpy.mockClear();
  });

  it("composes workflow on front door and prepares direct external handoff", async () => {
    const { tools } = getRegisteredTools();
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Harness stage="home" />);
    });
    await flush();

    const featureDiscovery = await invokeTool(tools, "find_apps_for_feature", {
      feature: "remove background",
    });
    expect(featureDiscovery.status).toBe("ok");
    expect(
      (featureDiscovery.data as { matches?: Array<{ productId: string }> } | undefined)?.matches?.[0]?.productId,
    ).toBe("firefly");

    const composeButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Compose creative workflow",
    );
    expect(composeButton).toBeDefined();
    await act(async () => {
      composeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const continueLink = Array.from(container.querySelectorAll("a")).find(
      (link) => link.textContent?.trim() === "Open Adobe Firefly",
    );
    expect(continueLink).toBeDefined();
    expect(continueLink?.getAttribute("href")).toBe("https://firefly.adobe.com/");
    await act(async () => {
      continueLink?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(pushSpy).not.toHaveBeenCalled();
    const handoffId = getMissionRuntime()?.intentPassport.handoffTrail.at(-1) ?? "";
    const handoff = getMissionRuntime()?.getHandoff(handoffId ?? "");
    expect(handoff?.selectedWorkflowStep).toBe("firefly-background-transformation");
    expect(handoff?.selectedDestination).toBe("https://firefly.adobe.com/");

    await act(async () => {
      root.unmount();
    });
  });

  it("runs Plans and Kaftan end-to-end with WebMCP tool transitions", async () => {
    const { tools } = getRegisteredTools();
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness stage="project" />);
    });
    await flush();

    expect(container.textContent).toContain("Reset Demo");

    const region = await invokeTool(tools, "get_user_region");
    expect(region.status).toBe("ok");
    expect(region.data?.region).toBe("IN");
    expect(region.data?.city).toBe("Bangalore");
    expect(region.data?.student).toBe(true);

    const planHandoff = await invokeTool(tools, "prepare_handoff", {
      toolName: "adobe_plans.compare_plan_options",
      toSurface: "Adobe Plans",
      task: "Find the right plan",
      assetIds: [],
      expectedResult: "plan-recommendation",
    });
    expect(planHandoff.status).toBe("ok");
    expect(pushSpy).toHaveBeenCalledWith(expect.stringMatching(/^\/plans\?handoff=/));

    const missionBeforePlans = structuredClone(getMissionRuntime()?.mission);

    await act(async () => {
      root.render(<Harness stage="plans" />);
    });
    await flush();

    expect(tools.has("get_regional_plans")).toBe(true);
    expect(tools.has("search_files")).toBe(false);

    const regionalPlans = await invokeTool(tools, "get_regional_plans", {});
    expect(regionalPlans.status).toBe("ok");
    const regionalPlansData = regionalPlans.data as { region: string } | undefined;
    expect(regionalPlansData?.region).toBe("IN");

    const recommendation = await invokeTool(tools, "compare_plan_options", {
      requirements: ["photo editing", "business card design", "background replacement"],
    });
    expect(recommendation.status).toBe("ok");
    const recommendationData = recommendation.data as
      | { recommendedPlan: { planId: string } | null }
      | undefined;
    expect(recommendationData?.recommendedPlan?.planId).toBe("adobe-student-cc-in");

    const pricing = await invokeTool(tools, "get_plan_price", {
      planId: recommendationData?.recommendedPlan?.planId,
    });
    expect(pricing.status).toBe("ok");
    const pricingData = pricing.data as { dataSource: string } | undefined;
    expect(pricingData?.dataSource).toBe("live_regional_pricing");

    expect(getMissionRuntime()?.mission).toEqual(missionBeforePlans);

    await act(async () => {
      getMissionRuntime()?.resetDemo();
    });
    await flush();

    await act(async () => {
      root.render(<Harness stage="project" />);
    });
    await flush();

    const runtimeAtStart = getMissionRuntime();
    expect(runtimeAtStart?.mission.originalPrompt).toBe(seededMission.originalPrompt);
    expect(runtimeAtStart?.mission.constraints).toEqual(seededMission.constraints);

    const search = await invokeTool(tools, "search_files", { query: "Kaftan logo" });
    expect(search.status).toBe("ok");

    const fireflyDiscovery = await invokeTool(tools, "find_apps_for_feature", {
      feature: "change image background",
    });
    expect(fireflyDiscovery.status).toBe("ok");
    expect((fireflyDiscovery.data as { matches?: Array<{ productId: string }> } | undefined)?.matches?.[0]?.productId).toBe("firefly");

    const fireflyHandoff = await invokeTool(tools, "prepare_handoff", {
      toolName: "firefly.change_background",
      toSurface: "Firefly",
      task: "Create a dark premium textile background while preserving the approved Kaftan logo.",
      assetIds: ["kaftan-logo-final"],
      expectedResult: "background-updated-logo",
    });
    const fireflyHandoffId = (fireflyHandoff.data as { handoffId?: string } | undefined)?.handoffId;
    expect(fireflyHandoffId).toBeDefined();

    await act(async () => {
      root.render(<Harness stage="firefly" handoffId={fireflyHandoffId} />);
    });
    await flush();

    expect(tools.has("change_background")).toBe(true);
    expect(tools.has("search_files")).toBe(false);

    const fireflyResult = await invokeTool(tools, "change_background", {
      handoffId: fireflyHandoffId,
      assetId: "kaftan-logo-final",
    });
    expect(fireflyResult.status).toBe("ok");
    expect(getMissionRuntime()?.mission.currentAssetId).toBe("kaftan-logo-background-v1");
    expect(getMissionRuntime()?.mission.completedSteps).toContain("change_background");

    const expressDiscovery = await invokeTool(tools, "find_apps_for_feature", {
      feature: "create business card",
    });
    expect(expressDiscovery.status).toBe("ok");
    expect((expressDiscovery.data as { matches?: Array<{ productId: string }> } | undefined)?.matches?.[0]?.productId).toBe("express");

    const expressHandoff = await invokeTool(tools, "prepare_handoff", {
      toolName: "express.create_business_card",
      toSurface: "Express",
      task: "Create business card",
      assetIds: ["kaftan-logo-background-v1"],
      expectedResult: "business-card-output",
    });
    const expressHandoffId = (expressHandoff.data as { handoffId?: string } | undefined)?.handoffId;

    await act(async () => {
      root.render(<Harness stage="express" handoffId={expressHandoffId} />);
    });
    await flush();

    expect(tools.has("create_business_card")).toBe(true);
    expect(tools.has("change_background")).toBe(false);

    const expressResult = await invokeTool(tools, "create_business_card", {
      handoffId: expressHandoffId,
      sourceAssetId: "kaftan-logo-background-v1",
    });
    expect(expressResult.status).toBe("ok");
    expect(getMissionRuntime()?.mission.currentAssetId).toBe("kaftan-business-card-01");
    expect(getMissionRuntime()?.mission.completedSteps).toEqual(
      expect.arrayContaining(["change_background", "create_business_card"]),
    );

    const missionBeforeResume = structuredClone(getMissionRuntime()?.mission);
    pushSpy.mockClear();

    const resumed = await invokeTool(tools, "resume_workflow");
    expect(resumed.status).toBe("ok");
    const resumedData = resumed.data as { handoffTrail: string[]; destinationRoute: string } | undefined;
    expect(resumedData?.destinationRoute).toBe("/project/kaftan");
    expect(resumedData?.handoffTrail.length).toBeGreaterThanOrEqual(2);
    expect(pushSpy).toHaveBeenLastCalledWith("/project/kaftan");
    expect(getMissionRuntime()?.mission).toEqual(missionBeforeResume);

    await act(async () => {
      root.render(<Harness stage="project" />);
    });
    await flush();

    expect(tools.has("find_duplicates")).toBe(true);
    expect(tools.has("create_business_card")).toBe(false);
    expect(tools.has("get_user_region")).toBe(true);

    const duplicates = await invokeTool(tools, "find_duplicates", {});
    expect(duplicates.status).toBe("ok");
    const duplicatesData = duplicates.data as { exactDuplicates: Array<{ fileIds: string[] }> } | undefined;
    expect(duplicatesData?.exactDuplicates[0].fileIds).toEqual(
      expect.arrayContaining(["kaftan-logo-final", "kaftan-logo-copy"]),
    );

    const firstDelete = await invokeTool(tools, "delete_file", {
      fileId: "kaftan-logo-copy",
    });
    expect(firstDelete.status).toBe("confirmation_required");
    const confirmationId = (firstDelete.data as { confirmationId?: string } | undefined)?.confirmationId;
    expect(confirmationId).toBeDefined();

    const noUiApprovalDelete = await invokeTool(tools, "delete_file", {
      fileId: "kaftan-logo-copy",
      confirmationId,
    });
    expect(noUiApprovalDelete.status).toBe("confirmation_required");

    const approveButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Approve deletion",
    );
    expect(approveButton).toBeDefined();
    await act(async () => {
      approveButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const approvedDelete = await invokeTool(tools, "delete_file", {
      fileId: "kaftan-logo-copy",
      confirmationId,
    });
    expect(approvedDelete.status).toBe("ok");

    const runtimeEnd = getMissionRuntime();
    expect(runtimeEnd?.mission.originalPrompt).toBe(seededMission.originalPrompt);
    expect(runtimeEnd?.mission.constraints).toEqual(seededMission.constraints);
    expect(runtimeEnd?.mission.currentStep).toBe("mission_complete");
    expect(runtimeEnd?.mission.completedSteps).toEqual(
      expect.arrayContaining([
        "change_background",
        "create_business_card",
        "delete_duplicate_file",
        "mission_complete",
      ]),
    );
    expect(runtimeEnd?.mission.handoffHistory.length).toBeGreaterThanOrEqual(2);

    await act(async () => {
      root.unmount();
    });
  });

  it("rejects prepare_handoff when toSurface conflicts with capability owner", async () => {
    const { tools } = getRegisteredTools();
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Harness stage="project" />);
    });
    await flush();

    const result = (await invokeTool(tools, "prepare_handoff", {
      toolName: "firefly.change_background",
      toSurface: "Express",
      task: "Create a dark premium textile background while preserving the approved Kaftan logo.",
      assetIds: ["kaftan-logo-final"],
      expectedResult: "background-updated-logo",
    })) as { status: string; code?: string };

    expect(result.status).toBe("error");
    expect(result.code).toBe("HANDOFF_SURFACE_MISMATCH");
    expect(pushSpy).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("clickable Continue to Firefly creates a valid Firefly handoff", async () => {
    const { tools } = getRegisteredTools();
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Harness stage="project" />);
    });
    await flush();

    const continueButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Continue to Firefly",
    );
    expect(continueButton).toBeDefined();

    await act(async () => {
      continueButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const destination = pushSpy.mock.calls.at(-1)?.[0] as string | undefined;
    expect(destination).toMatch(/^\/firefly\?handoff=/);
    const handoffId = destination?.split("handoff=")[1];
    expect(handoffId).toBeDefined();

    const runtime = getMissionRuntime();
    const handoff = runtime?.getHandoff(handoffId ?? "");
    expect(handoff?.toolName).toBe("firefly.change_background");
    expect(handoff?.toSurface).toBe("Firefly");
    expect(tools.has("change_background")).toBe(false);

    await act(async () => {
      root.unmount();
    });
  });

  it("Firefly destination route exposes next-step destination link", async () => {
    const { tools } = getRegisteredTools();
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Harness stage="project" />);
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

    const changeResult = await invokeTool(tools, "change_background", {
      handoffId: fireflyHandoffId,
      assetId: "kaftan-logo-final",
    });
    expect(changeResult.status).toBe("ok");

    const nextDestinationLink = Array.from(container.querySelectorAll("a")).find(
      (link) => link.textContent?.trim() === "View next destination",
    );
    expect(nextDestinationLink).toBeDefined();
    expect(nextDestinationLink?.getAttribute("href")).toMatch(/^\/express\?handoff=/);

    await act(async () => {
      root.unmount();
    });
  });

  it("blocks change_background without creative direction and allows explicit or handoff direction", async () => {
    const { tools } = getRegisteredTools();
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Harness stage="project" />);
    });
    await flush();

    const genericHandoff = await invokeTool(tools, "prepare_handoff", {
      toolName: "firefly.change_background",
      toSurface: "Firefly",
      task: "Change background",
      assetIds: ["kaftan-logo-final"],
      expectedResult: "background-updated-logo",
    });
    const genericHandoffId = (genericHandoff.data as { handoffId?: string } | undefined)?.handoffId;

    await act(async () => {
      root.render(<Harness stage="firefly" handoffId={genericHandoffId} />);
    });
    await flush();

    const missingDirection = (await invokeTool(tools, "change_background", {
      handoffId: genericHandoffId,
      assetId: "kaftan-logo-final",
    })) as { status: string; data?: { code?: string } };
    expect(missingDirection.status).toBe("decision_required");
    expect(missingDirection.data?.code).toBe("MISSING_CREATIVE_DIRECTION");

    const explicitDirection = await invokeTool(tools, "change_background", {
      handoffId: genericHandoffId,
      assetId: "kaftan-logo-final",
      creativeDirection: "Create a dark premium textile background while preserving the approved Kaftan logo.",
    });
    expect(explicitDirection.status).toBe("ok");

    await act(async () => {
      getMissionRuntime()?.resetDemo();
    });
    await flush();

    await act(async () => {
      root.render(<Harness stage="project" />);
    });
    await flush();

    const directionalHandoff = await invokeTool(tools, "prepare_handoff", {
      toolName: "firefly.change_background",
      toSurface: "Firefly",
      task: "Create a dark premium textile background while preserving the approved Kaftan logo.",
      assetIds: ["kaftan-logo-final"],
      expectedResult: "background-updated-logo",
    });
    const directionalHandoffId = (directionalHandoff.data as { handoffId?: string } | undefined)?.handoffId;
    await act(async () => {
      root.render(<Harness stage="firefly" handoffId={directionalHandoffId} />);
    });
    await flush();

    const handoffDirection = await invokeTool(tools, "change_background", {
      handoffId: directionalHandoffId,
      assetId: "kaftan-logo-final",
    });
    expect(handoffDirection.status).toBe("ok");

    await act(async () => {
      root.unmount();
    });
  });

  it("rejects assets outside active handoff for Firefly and Express", async () => {
    const { tools } = getRegisteredTools();
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Harness stage="project" />);
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

    const invalidFireflyAsset = (await invokeTool(tools, "change_background", {
      handoffId: fireflyHandoffId,
      assetId: "kaftan-product-reference",
    })) as { status: string; code?: string };
    expect(invalidFireflyAsset.status).toBe("error");
    expect(invalidFireflyAsset.code).toBe("INVALID_HANDOFF_ASSET");

    const expressHandoff = await invokeTool(tools, "prepare_handoff", {
      toolName: "express.create_business_card",
      toSurface: "Express",
      task: "Create a business card from this asset.",
      assetIds: ["kaftan-logo-final"],
      expectedResult: "business-card-output",
    });
    const expressHandoffId = (expressHandoff.data as { handoffId?: string } | undefined)?.handoffId;
    await act(async () => {
      root.render(<Harness stage="express" handoffId={expressHandoffId} />);
    });
    await flush();

    const invalidExpressAsset = (await invokeTool(tools, "create_business_card", {
      handoffId: expressHandoffId,
      sourceAssetId: "kaftan-product-reference",
    })) as { status: string; code?: string };
    expect(invalidExpressAsset.status).toBe("error");
    expect(invalidExpressAsset.code).toBe("INVALID_HANDOFF_ASSET");

    await act(async () => {
      root.unmount();
    });
  });
});
