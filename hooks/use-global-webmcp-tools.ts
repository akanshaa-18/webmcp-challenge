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
        if (runtime && result.recommendedTool) {
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
            recommendedTool: result.recommendedTool?.toolName ?? null,
            ownerSurface: result.recommendedTool?.ownerSurface ?? null,
            destination:
              result.recommendedTool?.destinationRoute ?? result.recommendedTool?.destinationUrl ?? null,
            requiredContext: result.recommendedTool?.requiredContext ?? [],
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
          const workflowSteps = result.data.steps.map((step: any) => ({
            productName: step.productName,
            initials: step.productInitials || step.productName.substring(0, 2).toUpperCase(),
            color: step.productColor || "#001AFF",
            task: step.capability,
            produces: step.produces || "Output",
            destinationUrl: step.destinationUrl,
          }));

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
            actualWorkflowSteps: workflowSteps,
            workflowFromTool: true,
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
        if (!input?.planId || typeof input.planId !== "string") {
          return toolError(
            "MISSING_PLAN_ID",
            "A planId is required. Use a plan ID from the plans array returned by compare_plan_options.",
          );
        }
        if (input.action !== "buy" && input.action !== "trial") {
          return toolError("INVALID_ACTION", 'action must be "buy" or "trial".');
        }

        const runtime = getMissionRuntime();
        let resolvedRegion = input.region;

        if (!resolvedRegion) {
          if (!runtime) {
            return toolError(
              "MISSING_REGION",
              "A region is required. Either pass region explicitly, or call compare_plan_options first to establish session region.",
            );
          }
          resolvedRegion = runtime.intentPassport.region;
        }

        if (!resolvedRegion) {
          return toolError(
            "MISSING_REGION",
            "A region/country code is required (e.g. IN, US). Pass explicitly or establish via prior compare_plan_options call.",
          );
        }

        const osiEntry = PLAN_CHECKOUT_OSIS[input.planId];
        if (!osiEntry) {
          return toolError(
            "UNKNOWN_PLAN",
            `No checkout link found for plan ${input.planId}. Use a plan ID from compare_plan_options.`,
          );
        }

        const osi = osiEntry[input.action];
        if (!osi) {
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
