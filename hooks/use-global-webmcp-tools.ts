"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  describeCapability,
  findToolsForTask,
  runtimeToolNameForManifest,
  toolManifests,
} from "@/lib/capability-registry";
import { toolError } from "@/lib/errors";
import { userFixture } from "@/lib/fixtures";
import { getMissionRuntime } from "@/lib/mission-runtime";
import {
  checkDeviceCompatibility,
  findProductForTask,
  getProductCapabilities,
  getProductSystemRequirements,
} from "@/lib/public-intelligence";
import { buildAdobeWorkflow } from "@/lib/workflow-composer";
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
            "Registry uses namespaced manifest IDs (for example public.build_adobe_workflow); WebMCP runtime tools are registered by route as unprefixed names (for example build_adobe_workflow).",
        },
      }),
    },
    {
      name: "find_tools_for_task",
      description: "Find the best capability for a user task before creating a surface handoff.",
      inputSchema: {
        type: "object",
        properties: { task: { type: "string" } },
        required: ["task"],
      },
      annotations: { readOnlyHint: true },
      execute: (input: { task?: string }) => {
        if (!input?.task) {
          return toolError("MISSING_REQUIRED_CONTEXT", "The task field is required.");
        }
        const runtime = getMissionRuntime();
        const result = findToolsForTask(input.task);
        if (!result.recommendedTool) {
          return toolError("UNKNOWN_CAPABILITY", "No matching capability found for this task.");
        }
        if (runtime) {
          runtime.updateIntentPassport((passport) => {
            const recommended = result.recommendedTool?.toolName;
            const nextDiscovered = recommended && !passport.discoveredCapabilities.includes(recommended)
              ? [...passport.discoveredCapabilities, recommended]
              : passport.discoveredCapabilities;
            return {
              ...passport,
              requirements: input.task ? [input.task] : passport.requirements,
              discoveredCapabilities: nextDiscovered,
              selectedDestination:
                result.recommendedTool?.destinationRoute ?? result.recommendedTool?.destinationUrl,
            };
          });
        }
        return {
          status: "ok",
          data: {
            recommendedTool: result.recommendedTool.toolName,
            ownerSurface: result.recommendedTool.ownerSurface,
            destination:
              result.recommendedTool.destinationRoute ?? result.recommendedTool.destinationUrl ?? null,
            requiredContext: result.recommendedTool.requiredContext,
            alternatives: result.alternatives.map((tool) => tool.toolName),
          },
        };
      },
    },
    {
      name: "build_adobe_workflow",
      description:
        "Compose a multi-step Adobe workflow for a user's creative goal using publicly described Adobe capabilities and their dependencies.",
      inputSchema: {
        type: "object",
        properties: { task: { type: "string" } },
        required: ["task"],
      },
      annotations: { readOnlyHint: true },
      execute: (input: { task?: string }) => {
        const runtime = getMissionRuntime();
        const result = buildAdobeWorkflow(input?.task, runtime?.intentPassport.userConstraints ?? []);
        if (result.status !== "ok") {
          return result;
        }

        if (runtime) {
          runtime.updateIntentPassport((passport) => ({
            ...passport,
            userGoal: input?.task ?? passport.userGoal,
            requirements: result.data.steps.map((step) => step.capability),
            discoveredCapabilities: Array.from(
              new Set([
                ...passport.discoveredCapabilities,
                "public.build_adobe_workflow",
                ...result.data.steps.map((step) => step.capabilityId),
              ]),
            ),
            selectedProducts: result.data.steps.map((step) => step.productId),
            selectedWorkflowId: result.data.workflowId,
            selectedWorkflowStep: result.data.steps[0]?.capabilityId,
            recommendedWorkflow: result.data.steps.map((step) => step.productName).join(" → "),
            selectedDestination: result.data.recommendedStart.destinationUrl,
          }));
        }

        return result;
      },
    },
    {
      name: "find_product_for_task",
      description: "Recommend Adobe products for a task using the public reference snapshot catalog.",
      inputSchema: {
        type: "object",
        properties: { task: { type: "string" } },
        required: ["task"],
      },
      annotations: { readOnlyHint: true },
      execute: (input: { task?: string }) => {
        const result = findProductForTask(input?.task);
        if (result.status !== "ok") {
          return result;
        }

        const runtime = getMissionRuntime();
        if (runtime) {
          runtime.updateIntentPassport((passport) => ({
            ...passport,
            requirements: input?.task ? [input.task] : passport.requirements,
            discoveredCapabilities: passport.discoveredCapabilities.includes("public.find_product_for_task")
              ? passport.discoveredCapabilities
              : [...passport.discoveredCapabilities, "public.find_product_for_task"],
            selectedProducts: result.data.recommendations.map((recommendation) => recommendation.productId),
            selectedDestination: result.data.recommendations[0]?.destinationUrl ?? passport.selectedDestination,
          }));
        }

        return result;
      },
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
      name: "get_product_system_requirements",
      description:
        "Return platform-specific product requirements from the public reference snapshot catalog.",
      inputSchema: {
        type: "object",
        properties: {
          productId: { type: "string" },
          platform: { type: "string", enum: ["macos", "windows", "web", "ios", "android"] },
        },
        required: ["productId", "platform"],
      },
      annotations: { readOnlyHint: true },
      execute: (input: { productId?: string; platform?: string }) => {
        const result = getProductSystemRequirements(input?.productId, input?.platform);
        if (result.status !== "ok") {
          return result;
        }

        const runtime = getMissionRuntime();
        if (runtime) {
          runtime.updateIntentPassport((passport) => ({
            ...passport,
            discoveredCapabilities: passport.discoveredCapabilities.includes(
              "public.get_product_system_requirements",
            )
              ? passport.discoveredCapabilities
              : [...passport.discoveredCapabilities, "public.get_product_system_requirements"],
            selectedProducts: input?.productId && !passport.selectedProducts.includes(input.productId)
              ? [...passport.selectedProducts, input.productId]
              : passport.selectedProducts,
          }));
        }

        return result;
      },
    },
    {
      name: "check_device_compatibility",
      description: "Check device compatibility against snapshot requirements for one Adobe product.",
      inputSchema: {
        type: "object",
        properties: {
          productId: { type: "string" },
          platform: { type: "string", enum: ["macos", "windows", "web", "ios", "android"] },
          device: {
            type: "object",
            properties: {
              osVersion: { type: "string" },
              memoryGB: { type: "number" },
              freeStorageGB: { type: "number" },
              processor: { type: "string" },
              gpu: { type: "string" },
            },
          },
        },
        required: ["productId", "platform", "device"],
      },
      annotations: { readOnlyHint: true },
      execute: (input: {
        productId?: string;
        platform?: string;
        device?: {
          osVersion?: string;
          memoryGB?: number;
          freeStorageGB?: number;
          processor?: string;
          gpu?: string;
        };
      }) => {
        const result = checkDeviceCompatibility(input?.productId, input?.platform, input?.device);
        if (result.status !== "ok") {
          return result;
        }

        const runtime = getMissionRuntime();
        if (runtime) {
          runtime.updateIntentPassport((passport) => ({
            ...passport,
            discoveredCapabilities: passport.discoveredCapabilities.includes(
              "public.check_device_compatibility",
            )
              ? passport.discoveredCapabilities
              : [...passport.discoveredCapabilities, "public.check_device_compatibility"],
            selectedProducts: input?.productId && !passport.selectedProducts.includes(input.productId)
              ? [...passport.selectedProducts, input.productId]
              : passport.selectedProducts,
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
