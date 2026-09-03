"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  describeCapability,
  runtimeToolNameForManifest,
  toolManifests,
} from "@/lib/capability-registry";
import { toolError } from "@/lib/errors";
import { userFixture } from "@/lib/fixtures";
import { getMissionRuntime } from "@/lib/mission-runtime";
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

export function useGlobalWebMcpTools(currentSurface: Surface, currentRoute: string) {
  const router = useRouter();
  const [tools] = useState(() => [
    {
      name: "get_user_region",
      description: "Get the user's persisted Adobe region context for localized decisions.",
      annotations: { readOnlyHint: true },
      execute: () => ({
        status: "ok",
        data: {
          region: userFixture.region,
          city: userFixture.city,
          student: userFixture.student,
        },
      }),
    },
    {
      name: "get_current_adobe_context",
      description: "Get active Adobe route, mission, project, and current asset context.",
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
              region: runtime.intentPassport.region ?? userFixture.region,
              audience: runtime.intentPassport.audience ?? (userFixture.student ? "student" : "individual"),
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
          manifests: toolManifests.map((manifest) => ({
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
            destinationRoute: capability.destinationRoute,
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
      annotations: { readOnlyHint: true },
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
