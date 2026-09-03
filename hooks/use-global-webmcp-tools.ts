"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  describeCapability,
  runtimeToolNameForManifest,
  toolManifests,
} from "@/lib/capability-registry";
import { toolError } from "@/lib/errors";
import { getMissionRuntime } from "@/lib/mission-runtime";
import { trackToolExecution } from "@/lib/execution-tracker";
import {
  adobeDirectory,
  getProductCapabilities,
} from "@/lib/public-intelligence";
import { fetchOsRanges, isCompatible, PRODUCT_TO_SAP } from "@/lib/ffc-os-compatibility";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { Surface, ToolManifest } from "@/lib/types";

function getResumeDestination(projectId: string): string {
  if (projectId === "kaftan-001") {
    return "/project/kaftan";
  }
  return "/project/kaftan";
}

const PLAN_CHECKOUT_OSIS: Record<string, { buy?: string; trial?: string }> = {
  "adobe-student-cc-in": {
    buy: "951DCCB08194F40B9C79951675547DF5",
    trial: "7FD7DFC9269A4AFB9BF24B8C53547DA7",
  },
  "adobe-all-apps-in": {
    buy: "632B3ADD940A7FBB7864AA5AD19B8D28",
    trial: "65BA7CA7573834AC4D043B0E7CBD2349",
  },
  "adobe-photography-in": {
    buy: "7D31EB7B815967837F7882380437117D",
    trial: "C898A1A80AEB0D353C556FE5FCC72021",
  },
};

export function useGlobalWebMcpTools(currentSurface: Surface, currentRoute: string) {
  const router = useRouter();
  const [tools] = useState(() => [
    {
      name: "get_current_adobe_context",
      description:
        "Get active Adobe route, mission, project, and current asset context. region/audience reflect only what an agent has explicitly supplied earlier in this session -- they are null when no legitimate context has been provided yet, never a fabricated default.",
      annotations: { readOnlyHint: true },
      execute: () => {
        const runtime = getMissionRuntime();
        if (!runtime) {
          return toolError("MISSING_MISSION", "Mission context is not initialized.");
        }

        return {
          status: "ok",
          data: {
            intent: {
              id: runtime.intentPassport.id,
              userGoal: runtime.intentPassport.userGoal,
              region: runtime.intentPassport.region ?? null,
              audience: runtime.intentPassport.audience ?? null,
              requirements: runtime.intentPassport.requirements,
              discoveredCapabilities: runtime.intentPassport.discoveredCapabilities,
              selectedProducts: runtime.intentPassport.selectedProducts,
              recommendedWorkflow: runtime.intentPassport.recommendedWorkflow,
              selectedDestination: runtime.intentPassport.selectedDestination,
              handoffTrail: runtime.intentPassport.handoffTrail,
              userConstraints: runtime.intentPassport.userConstraints,
            },
            currentRoute,
            currentSurface,
          },
        };
      },
    },
    {
      name: "discover_adobe_capabilities",
      description: "List capabilities known by global discovery before local execution.",
      annotations: { readOnlyHint: true },
      execute: () => ({
        status: "ok",
        data: {
          manifests: toolManifests
            .filter((manifest) => manifest.audience === "public")
            .map((manifest) => ({
              ...manifest,
              runtimeToolName: runtimeToolNameForManifest(manifest.toolName),
            })),
          namingConvention:
            "Registry uses namespaced manifest IDs (for example public.adobe_directory); WebMCP runtime tools are registered by route as unprefixed names (for example adobe_directory).",
        },
      }),
    },
    {
      name: "adobe_directory",
      description:
        "Returns the full Adobe capability catalog. " +
        "Call this first when the user asks which Adobe app to use for a task. " +
        "After calling it, scan EVERY capability's taskTypes array and description to find the closest semantic match to the user's request. " +
        "Do NOT default to Firefly or any other product based on prior knowledge — always base your recommendation on the taskTypes and description fields in the response.",
      annotations: { readOnlyHint: true },
      execute: () => adobeDirectory(),
    },
    {
      name: "get_product_capabilities",
      description: "Return structured capabilities for a product from the public reference snapshot catalog.",
      inputSchema: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
      },
      annotations: { readOnlyHint: true },
      execute: (input: { productId?: string }) => {
        const result = getProductCapabilities(input?.productId);
        if (result.status !== "ok") {
          return result;
        }

        const runtime = getMissionRuntime();
        if (runtime) {
          runtime.updateIntentPassport((passport) => ({
            ...passport,
            discoveredCapabilities: passport.discoveredCapabilities.includes("public.get_product_capabilities")
              ? passport.discoveredCapabilities
              : [...passport.discoveredCapabilities, "public.get_product_capabilities"],
            selectedProducts: passport.selectedProducts.includes(result.data.productId)
              ? passport.selectedProducts
              : [...passport.selectedProducts, result.data.productId],
            selectedDestination: result.data.destinationUrl,
          }));
        }

        return result;
      },
    },
    {
      name: "describe_capability",
      description: "Describe one capability from the global Adobe registry by tool name.",
      inputSchema: {
        type: "object",
        properties: { toolName: { type: "string" } },
        required: ["toolName"],
      },
      annotations: { readOnlyHint: true },
      execute: (input: { toolName?: string }) => {
        if (!input?.toolName) {
          return toolError("MISSING_REQUIRED_CONTEXT", "The toolName field is required.");
        }
        const runtime = getMissionRuntime();
        const capability = describeCapability(input.toolName);
        if (!capability) {
          return toolError("UNKNOWN_CAPABILITY", `Unknown capability: ${input.toolName}`);
        }
        if (capability.audience !== "public") {
          return toolError("UNKNOWN_CAPABILITY", `Unknown capability: ${input.toolName}`);
        }
        if (runtime) {
          runtime.updateIntentPassport((passport) => ({
            ...passport,
            discoveredCapabilities: passport.discoveredCapabilities.includes(capability.toolName)
              ? passport.discoveredCapabilities
              : [...passport.discoveredCapabilities, capability.toolName],
          }));
        }
        return {
          status: "ok",
          data: {
            ...capability,
            runtimeToolName: runtimeToolNameForManifest(capability.toolName),
          },
        };
      },
    },
    {
      name: "prepare_handoff",
      description:
        "Create a structured handoff from global discovery and return destination context for route or external continuation.",
      inputSchema: {
        type: "object",
        properties: {
          toolName: { type: "string" },
          toSurface: { type: "string" },
          task: { type: "string" },
          assetIds: { type: "array", items: { type: "string" } },
          expectedResult: { type: "string" },
          brandContext: { type: "string" },
          market: { type: "string" },
        },
        required: ["toolName", "toSurface", "task", "expectedResult"],
      },
      execute: (input: {
        toolName?: string;
        toSurface?: Surface;
        task?: string;
        assetIds?: string[];
        expectedResult?: string;
        brandContext?: string;
        market?: string;
      }) => {
        const runtime = getMissionRuntime();
        if (!runtime) {
          return toolError("MISSING_MISSION", "Mission context is not initialized.");
        }

        if (
          !input?.toolName ||
          !input.toSurface ||
          !input.task ||
          !input.expectedResult
        ) {
          return toolError("MISSING_REQUIRED_CONTEXT", "Handoff input is missing required fields.");
        }

        const capability = describeCapability(input.toolName);
        if (!capability) {
          return toolError("UNKNOWN_CAPABILITY", `Cannot hand off unknown tool: ${input.toolName}`);
        }
        if (input.toSurface !== capability.ownerSurface) {
          return toolError(
            "HANDOFF_SURFACE_MISMATCH",
            `Tool ${input.toolName} belongs to ${capability.ownerSurface}, not ${input.toSurface}.`,
          );
        }
        const useExternalPublicDestination =
          currentSurface === "Adobe Agentic Front Door" && Boolean(capability.destinationUrl);
        if (useExternalPublicDestination && capability.audience !== "public") {
          return toolError(
            "UNKNOWN_CAPABILITY",
            `Cannot hand off private tool ${input.toolName} to external public destination.`,
          );
        }
        if (!capability.destinationRoute && !useExternalPublicDestination) {
          return toolError(
            "UNSUPPORTED_DESTINATION",
            `Tool ${input.toolName} is discovery-only and does not support local route handoff.`,
          );
        }

        const selectedDestination = useExternalPublicDestination
          ? capability.destinationUrl
          : capability.destinationRoute;

        const handoff = runtime.createAndStoreHandoff({
          fromSurface: currentSurface,
          toSurface: capability.ownerSurface,
          toolName: input.toolName,
          projectId: runtime.mission.projectId,
          assetIds: input.assetIds,
          task: input.task,
          expectedResult: input.expectedResult,
          selectedDestination,
          selectedWorkflowStep: capability.toolName,
          brandContext: input.brandContext,
          market: input.market,
        });

        if (!useExternalPublicDestination && capability.destinationRoute) {
          router.push(`${capability.destinationRoute}?handoff=${handoff.handoffId}`);
        }

        return {
          status: "ok",
          data: {
            handoffId: handoff.handoffId,
            destinationRoute: selectedDestination,
            handoff,
          },
        };
      },
    },
    {
      name: "check_os_compatibility",
      description:
        "Check whether a specific OS version meets Adobe's minimum requirements for a Creative Cloud desktop app. " +
        "Supports macos and windows only — mobile platforms (ios, android) are not supported because Adobe does not " +
        "publish minimum OS version ranges for mobile apps. If the user asks about mobile compatibility, " +
        "inform them this check is unavailable and suggest checking the Adobe app's App Store or Google Play listing. " +
        "Pass productId (e.g. \"photoshop\"), platform (\"macos\" or \"windows\"), " +
        "and the user's osVersion (e.g. \"14.5\"). Returns compatible: true/false and the supported OS ranges.",
      inputSchema: {
        type: "object",
        properties: {
          productId: { type: "string", description: "Catalog product ID, e.g. \"photoshop\", \"illustrator\", \"premiere-pro\"." },
          platform: { type: "string", enum: ["macos", "windows"] },
          osVersion: { type: "string", description: "User's OS version string, e.g. \"14.5\" or \"10.0.22621\"." },
        },
        required: ["productId", "platform", "osVersion"],
      },
      annotations: { readOnlyHint: true },
      execute: async (input: { productId?: string; platform?: string; osVersion?: string }) => {
        const { productId, platform, osVersion } = input ?? {};
        if (!productId || !platform || !osVersion) {
          return toolError("MISSING_REQUIRED_CONTEXT", "productId, platform, and osVersion are all required.");
        }
        if (platform !== "macos" && platform !== "windows") {
          return toolError("UNSUPPORTED_PLATFORM", "platform must be \"macos\" or \"windows\".");
        }
        const sapCode = PRODUCT_TO_SAP[productId];
        if (!sapCode) {
          return toolError(
            "UNKNOWN_PRODUCT",
            `Unknown productId: "${productId}". Known products: ${Object.keys(PRODUCT_TO_SAP).join(", ")}.`,
          );
        }
        try {
          const ranges = await fetchOsRanges(sapCode, platform);
          const compatible = isCompatible(osVersion, ranges);
          return {
            status: "ok",
            data: { productId, sapCode, platform, osVersion, compatible, supportedRanges: ranges },
          };
        } catch (e) {
          return toolError("FFC_ERROR", e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: "resume_workflow",
      description: "Resume the current mission by returning mission, current step, and handoff trail.",
      annotations: { readOnlyHint: false },
      execute: () => {
        const runtime = getMissionRuntime();
        if (!runtime) {
          return toolError("MISSING_MISSION", "Mission context is not initialized.");
        }

        const destinationRoute = getResumeDestination(runtime.mission.projectId);
        runtime.updateIntentPassport((passport) => ({
          ...passport,
          selectedDestination: destinationRoute,
        }));
        router.push(destinationRoute);

        return {
          status: "ok",
          data: {
            destinationRoute,
            intent: runtime.intentPassport,
            handoffTrail: runtime.intentPassport.handoffTrail,
          },
        };
      },
    },
    {
      name: "get_checkout_link",
      description: "Return Adobe checkout URL for a selected plan with the chosen action (buy/trial). Call after user selects a plan from compare_plan_options.",
      inputSchema: {
        type: "object",
        properties: {
          planId: { type: "string", description: "Plan ID from compare_plan_options result" },
          action: { type: "string", enum: ["buy", "trial"], description: '"buy" to purchase, "trial" for free trial' },
          region: { type: "string", description: "Optional: region/country code (e.g. IN, US). If omitted, uses session region from prior plan selection." },
        },
        required: ["planId", "action"],
      },
      annotations: { readOnlyHint: false },
      execute: async (input: { planId?: string; action?: string; region?: string }) => {
        const { recordSuccess, recordError } = trackToolExecution("get_checkout_link");

        if (!input?.planId || typeof input.planId !== "string") {
          recordError("MISSING_PLAN_ID", "A planId is required.");
          return toolError(
            "MISSING_PLAN_ID",
            "A planId is required. Use a plan ID from the plans array returned by compare_plan_options.",
          );
        }
        if (input.action !== "buy" && input.action !== "trial") {
          recordError("INVALID_ACTION", 'action must be "buy" or "trial".');
          return toolError("INVALID_ACTION", 'action must be "buy" or "trial".');
        }

        const runtime = getMissionRuntime();
        let resolvedRegion = input.region;

        if (!resolvedRegion) {
          if (!runtime) {
            recordError("MISSING_REGION", "A region is required.");
            return toolError(
              "MISSING_REGION",
              "A region is required. Either pass region explicitly, or call compare_plan_options first to establish session region.",
            );
          }
          resolvedRegion = runtime.intentPassport.region;
        }

        if (!resolvedRegion) {
          recordError("MISSING_REGION", "A region/country code is required.");
          return toolError(
            "MISSING_REGION",
            "A region/country code is required (e.g. IN, US). Pass explicitly or establish via prior compare_plan_options call.",
          );
        }

        const osiEntry = PLAN_CHECKOUT_OSIS[input.planId];
        if (!osiEntry) {
          recordError("UNKNOWN_PLAN", `No checkout link found for plan ${input.planId}.`);
          return toolError(
            "UNKNOWN_PLAN",
            `No checkout link found for plan ${input.planId}. Use a plan ID from compare_plan_options.`,
          );
        }

        const osi = osiEntry[input.action];
        if (!osi) {
          recordError("ACTION_NOT_AVAILABLE", `${input.action === "trial" ? "Trial" : "Purchase"} is not available for plan ${input.planId}.`);
          return toolError(
            "ACTION_NOT_AVAILABLE",
            `${input.action === "trial" ? "Trial" : "Purchase"} is not available for plan ${input.planId}.`,
          );
        }

        const countryParam = resolvedRegion.toUpperCase();
        const checkoutUrl = `https://commerce.adobe.com/store/commitment?items[0][id]=${osi}&cli=adobe_com&ctx=fp&co=${countryParam}&lang=en`;

        if (runtime) {
          runtime.updateIntentPassport((passport) => ({
            ...passport,
            selectedDestination: checkoutUrl,
            checkoutUrl: checkoutUrl,
            checkoutAction: input.action as "buy" | "trial",
            discoveredCapabilities: passport.discoveredCapabilities.includes("adobe_plans.checkout")
              ? passport.discoveredCapabilities
              : [...passport.discoveredCapabilities, "adobe_plans.checkout"],
          }));
        }

        recordSuccess(`Checkout ready: ${input.action} ${input.planId}`);

        return {
          status: "ok",
          data: {
            planId: input.planId,
            action: input.action,
            region: resolvedRegion,
            checkoutUrl,
            osi,
          },
        };
      },
    },
  ]);

  return useWebMcpTools(tools);
}

export function capabilityRow(manifest: ToolManifest) {
  return {
    tool: manifest.toolName,
    runtimeTool: runtimeToolNameForManifest(manifest.toolName),
    surface: manifest.ownerSurface,
    description: manifest.description,
    destination: manifest.destinationRoute ?? manifest.destinationUrl ?? "n/a",
    readOnly: manifest.readOnly ? "read-only" : "mutating",
    requiredContext: manifest.requiredContext.join(", "),
  };
}
