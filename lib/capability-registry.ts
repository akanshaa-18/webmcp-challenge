import { ToolManifest } from "@/lib/types";

export const toolManifests: ToolManifest[] = [
  {
    toolName: "public.find_apps_for_feature",
    ownerSurface: "Global",
    description: "Find which Adobe app handles a feature and what apps can follow it in a multi-step sequence. Returns ranked capability matches with continuations for cross-app workflows.",
    inputSchema: {
      type: "object",
      properties: {
        feature: { type: "string" },
      },
      required: ["feature"],
    },
    requiredContext: ["feature"],
    destinationUrl: "https://www.adobe.com/",
    executionMode: "global-discovery",
    readOnly: true,
    audience: "public",
  },
  {
    toolName: "public.get_product_capabilities",
    ownerSurface: "Global",
    description: "Return structured capabilities for a product from the public reference snapshot catalog.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string" },
      },
      required: ["productId"],
    },
    requiredContext: ["productId"],
    destinationUrl: "https://www.adobe.com/",
    executionMode: "global-discovery",
    readOnly: true,
    audience: "public",
  },
  {
    toolName: "public.check_os_compatibility",
    ownerSurface: "Global",
    description:
      "Check whether a specific OS version meets Adobe's minimum requirements for a Creative Cloud desktop app. Supports macos and windows only.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Catalog product ID, e.g. \"photoshop\", \"illustrator\", \"premiere-pro\"." },
        platform: { type: "string", enum: ["macos", "windows"] },
        osVersion: { type: "string", description: "User's OS version string, e.g. \"14.5\" or \"10.0.22621\"." },
      },
      required: ["productId", "platform", "osVersion"],
    },
    requiredContext: ["productId", "platform", "osVersion"],
    destinationUrl: "https://helpx.adobe.com/",
    executionMode: "global-discovery",
    readOnly: true,
    audience: "public",
  },
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
    audience: "public",
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
    audience: "public",
  },
  {
    toolName: "adobe_plans.get_plan_price",
    ownerSurface: "Adobe Plans",
    description: "Return regional plan pricing from live regional pricing data.",
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
    audience: "public",
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
    audience: "public",
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
    audience: "legacy-private",
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
    audience: "legacy-private",
  },
  {
    toolName: "cc_home.get_file_metadata",
    ownerSurface: "CC Home",
    description: "Get metadata for one creative file by ID from the legacy private project context.",
    inputSchema: {
      type: "object",
      properties: {
        fileId: { type: "string" },
      },
      required: ["fileId"],
    },
    requiredContext: ["projectId", "fileId"],
    destinationRoute: "/project/kaftan",
    executionMode: "local-execution",
    readOnly: true,
    audience: "legacy-private",
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
    audience: "legacy-private",
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
    audience: "legacy-private",
  },
  {
    toolName: "firefly.change_background",
    ownerSurface: "Firefly",
    description: "Legacy/demo local background-change simulation for routed handoff testing.",
    inputSchema: {
      type: "object",
      properties: {
        handoffId: { type: "string" },
        assetId: { type: "string" },
      },
    },
    requiredContext: ["missionId", "projectId", "assetIds", "constraints"],
    destinationRoute: "/firefly",
    destinationUrl: "https://firefly.adobe.com/",
    executionMode: "local-execution",
    readOnly: false,
    audience: "legacy-private",
  },
  {
    toolName: "express.create_business_card",
    ownerSurface: "Express",
    description: "Legacy/demo local business-card simulation for routed handoff testing.",
    inputSchema: {
      type: "object",
      properties: {
        handoffId: { type: "string" },
        sourceAssetId: { type: "string" },
      },
    },
    requiredContext: ["missionId", "projectId", "assetIds", "constraints"],
    destinationRoute: "/express",
    destinationUrl: "https://express.adobe.com/",
    executionMode: "local-execution",
    readOnly: false,
    audience: "legacy-private",
  },
];

export function describeCapability(toolName: string): ToolManifest | null {
  return toolManifests.find((tool) => tool.toolName === toolName) ?? null;
}

export function runtimeToolNameForManifest(toolName: string): string {
  const segments = toolName.split(".");
  return segments.length > 1 ? segments[segments.length - 1] : toolName;
}

