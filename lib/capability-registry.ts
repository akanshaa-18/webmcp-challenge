import { ToolManifest } from "@/lib/types";

export const toolManifests: ToolManifest[] = [
  {
    toolName: "adobe_plans.get_regional_plans",
    ownerSurface: "Adobe Plans",
    description: "Return regional demo Adobe plans filtered by audience and location context.",
    inputSchema: {
      type: "object",
      properties: {
        region: { type: "string" },
        audience: { type: "string" },
      },
    },
    requiredContext: ["user.region", "user.student"],
    destinationRoute: "/plans",
    executionMode: "local-execution",
    readOnly: true,
  },
  {
    toolName: "adobe_plans.get_plan_capabilities",
    ownerSurface: "Adobe Plans",
    description: "Return structured apps, capabilities, and credits for one Adobe plan.",
    inputSchema: {
      type: "object",
      properties: {
        planId: { type: "string" },
      },
      required: ["planId"],
    },
    requiredContext: ["planId"],
    destinationRoute: "/plans",
    executionMode: "local-execution",
    readOnly: true,
  },
  {
    toolName: "adobe_plans.get_plan_price",
    ownerSurface: "Adobe Plans",
    description: "Return regional plan pricing from demo snapshot data.",
    inputSchema: {
      type: "object",
      properties: {
        planId: { type: "string" },
        region: { type: "string" },
      },
      required: ["planId"],
    },
    requiredContext: ["planId", "region"],
    destinationRoute: "/plans",
    executionMode: "local-execution",
    readOnly: true,
  },
  {
    toolName: "adobe_plans.compare_plan_options",
    ownerSurface: "Adobe Plans",
    description: "Compare plans against requirements and return the lowest-cost qualifying option.",
    inputSchema: {
      type: "object",
      properties: {
        requirements: { type: "array", items: { type: "string" } },
        region: { type: "string" },
        student: { type: "boolean" },
      },
      required: ["requirements"],
    },
    requiredContext: ["requirements", "user.region", "user.student"],
    destinationRoute: "/plans",
    executionMode: "local-execution",
    readOnly: true,
  },
  {
    toolName: "cc_home.get_project_context",
    ownerSurface: "CC Home",
    description: "Get structured context for the active Kaftan project and mission.",
    inputSchema: { type: "object", properties: {} },
    requiredContext: ["projectId", "missionId"],
    destinationRoute: "/project/kaftan",
    executionMode: "local-execution",
    readOnly: true,
  },
  {
    toolName: "cc_home.search_files",
    ownerSurface: "CC Home",
    description: "Find creative files in the current Adobe project matching a query.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
    requiredContext: ["projectId"],
    destinationRoute: "/project/kaftan",
    executionMode: "local-execution",
    readOnly: true,
  },
  {
    toolName: "cc_home.find_duplicates",
    ownerSurface: "CC Home",
    description:
      "Find deterministic duplicate groups by hash and classify protected files and similar versions.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
      },
    },
    requiredContext: ["projectId", "files.hash", "files.approved"],
    destinationRoute: "/project/kaftan",
    executionMode: "local-execution",
    readOnly: true,
  },
  {
    toolName: "cc_home.delete_file",
    ownerSurface: "CC Home",
    description:
      "Delete a safe duplicate file only after explicit human UI approval with confirmation context.",
    inputSchema: {
      type: "object",
      properties: {
        fileId: { type: "string" },
        confirmationId: { type: "string" },
      },
      required: ["fileId"],
    },
    requiredContext: ["mission.constraints", "duplicate-classification", "human-approval"],
    destinationRoute: "/project/kaftan",
    executionMode: "local-execution",
    readOnly: false,
  },
  {
    toolName: "firefly.change_background",
    ownerSurface: "Firefly",
    description: "Change the background of the handed-off creative asset.",
    inputSchema: {
      type: "object",
      properties: {
        handoffId: { type: "string" },
        assetId: { type: "string" },
      },
    },
    requiredContext: ["missionId", "projectId", "assetIds", "constraints"],
    destinationRoute: "/firefly",
    executionMode: "local-execution",
    readOnly: false,
  },
  {
    toolName: "express.create_business_card",
    ownerSurface: "Express",
    description: "Create a business card concept from a prepared project asset.",
    inputSchema: {
      type: "object",
      properties: {
        handoffId: { type: "string" },
        sourceAssetId: { type: "string" },
      },
    },
    requiredContext: ["missionId", "projectId", "assetIds", "constraints"],
    destinationRoute: "/express",
    executionMode: "local-execution",
    readOnly: false,
  },
];

export function describeCapability(toolName: string): ToolManifest | null {
  return toolManifests.find((tool) => tool.toolName === toolName) ?? null;
}

export function findToolsForTask(task: string): {
  recommendedTool: ToolManifest | null;
  alternatives: ToolManifest[];
} {
  const normalizedTask = task.toLowerCase();

  if (normalizedTask.includes("background")) {
    const recommendedTool = describeCapability("firefly.change_background");
    return {
      recommendedTool,
      alternatives: toolManifests.filter((tool) => tool.toolName !== "firefly.change_background"),
    };
  }

  if (normalizedTask.includes("business card")) {
    const recommendedTool = describeCapability("express.create_business_card");
    return {
      recommendedTool,
      alternatives: toolManifests.filter((tool) => tool.toolName !== "express.create_business_card"),
    };
  }

  if (normalizedTask.includes("duplicate") || normalizedTask.includes("cleanup")) {
    const recommendedTool = describeCapability("cc_home.find_duplicates");
    return {
      recommendedTool,
      alternatives: toolManifests.filter((tool) => tool.toolName !== "cc_home.find_duplicates"),
    };
  }

  if (
    normalizedTask.includes("plan") ||
    normalizedTask.includes("pricing") ||
    normalizedTask.includes("price") ||
    normalizedTask.includes("adobe plan") ||
    normalizedTask.includes("compare adobe plans")
  ) {
    const recommendedTool = describeCapability("adobe_plans.compare_plan_options");
    return {
      recommendedTool,
      alternatives: toolManifests.filter((tool) => tool.toolName !== "adobe_plans.compare_plan_options"),
    };
  }

  const recommendedTool = describeCapability("cc_home.search_files");
  return {
    recommendedTool,
    alternatives: toolManifests.filter((tool) => tool.toolName !== "cc_home.search_files"),
  };
}
