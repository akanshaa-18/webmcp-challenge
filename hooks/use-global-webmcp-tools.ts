"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { describeCapability, findToolsForTask, toolManifests } from "@/lib/capability-registry";
import { toolError } from "@/lib/errors";
import { projectFixture, userFixture } from "@/lib/fixtures";
import { getMissionRuntime } from "@/lib/mission-runtime";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { Surface, ToolManifest } from "@/lib/types";

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
            user: userFixture,
            project: projectFixture,
            mission: runtime.mission,
            currentRoute,
            currentSurface,
            currentAsset: runtime.currentAsset,
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
          manifests: toolManifests,
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
        const result = findToolsForTask(input.task);
        if (!result.recommendedTool) {
          return toolError("UNKNOWN_CAPABILITY", "No matching capability found for this task.");
        }
        return {
          status: "ok",
          data: {
            recommendedTool: result.recommendedTool.toolName,
            ownerSurface: result.recommendedTool.ownerSurface,
            destination: result.recommendedTool.destinationRoute,
            requiredContext: result.recommendedTool.requiredContext,
            alternatives: result.alternatives.map((tool) => tool.toolName),
          },
        };
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
        const capability = describeCapability(input.toolName);
        if (!capability) {
          return toolError("UNKNOWN_CAPABILITY", `Unknown capability: ${input.toolName}`);
        }
        return { status: "ok", data: capability };
      },
    },
    {
      name: "prepare_handoff",
      description:
        "Create a structured handoff from global discovery to a local execution surface and navigate.",
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
        required: ["toolName", "toSurface", "task", "assetIds", "expectedResult"],
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
          !input.assetIds ||
          !input.expectedResult
        ) {
          return toolError("MISSING_REQUIRED_CONTEXT", "Handoff input is missing required fields.");
        }

        const capability = describeCapability(input.toolName);
        if (!capability) {
          return toolError("UNKNOWN_CAPABILITY", `Cannot hand off unknown tool: ${input.toolName}`);
        }

        const handoff = runtime.createAndStoreHandoff({
          fromSurface: currentSurface,
          toSurface: input.toSurface,
          toolName: input.toolName,
          projectId: runtime.mission.projectId,
          assetIds: input.assetIds,
          task: input.task,
          expectedResult: input.expectedResult,
          brandContext: input.brandContext,
          market: input.market,
        });

        router.push(`${capability.destinationRoute}?handoff=${handoff.handoffId}`);

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

        return {
          status: "ok",
          data: {
            mission: runtime.mission,
            handoffHistory: runtime.mission.handoffHistory,
            handoffs: runtime.handoffs,
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
    surface: manifest.ownerSurface,
    description: manifest.description,
    destination: manifest.destinationRoute,
    readOnly: manifest.readOnly ? "read-only" : "mutating",
    requiredContext: manifest.requiredContext.join(", "),
  };
}
