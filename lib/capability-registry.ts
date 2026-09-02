import { ToolManifest } from "@/lib/types";

export const toolManifests: ToolManifest[] = [
  {
    toolName: "public.build_adobe_workflow",
    ownerSurface: "Adobe Agentic Front Door",
    description:
      "Compose a multi-step creative workflow across supported public product capabilities.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string" },
      },
      required: ["task"],
    },
    requiredContext: ["task", "intent.userConstraints"],
    destinationRoute: "/cc-home",
    executionMode: "global-discovery",
    readOnly: true,
    audience: "public",
  },
  {
    toolName: "public.find_product_for_task",
    ownerSurface: "Global",
    description: "Recommend Adobe products for a task using the public reference snapshot catalog.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string" },
      },
      required: ["task"],
    },
    requiredContext: ["task"],
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
    toolName: "public.get_product_system_requirements",
    ownerSurface: "Global",
    description:
      "Return platform-specific product system requirements from the public reference snapshot catalog.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string" },
        platform: { type: "string", enum: ["macos", "windows", "web", "ios", "android"] },
      },
      required: ["productId", "platform"],
    },
    requiredContext: ["productId", "platform"],
    destinationUrl: "https://helpx.adobe.com/",
    executionMode: "global-discovery",
    readOnly: true,
    audience: "public",
  },
  {
    toolName: "public.check_device_compatibility",
    ownerSurface: "Global",
    description: "Check product compatibility against provided device context using snapshot requirements.",
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
    requiredContext: ["productId", "platform", "device"],
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
    destinationUrl: "https://firefly.adobe.com/",
    executionMode: "local-execution",
    readOnly: false,
    audience: "public",
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
    destinationUrl: "https://express.adobe.com/",
    executionMode: "local-execution",
    readOnly: false,
    audience: "public",
  },
];

export function describeCapability(toolName: string): ToolManifest | null {
  return toolManifests.find((tool) => tool.toolName === toolName) ?? null;
}

export function runtimeToolNameForManifest(toolName: string): string {
  const segments = toolName.split(".");
  return segments.length > 1 ? segments[segments.length - 1] : toolName;
}

export function findToolsForTask(task: string): {
  recommendedTool: ToolManifest | null;
  alternatives: ToolManifest[];
} {
  const normalizedTask = task.toLowerCase();

  if (
    normalizedTask.includes("workflow") ||
    normalizedTask.includes("which adobe apps should i use") ||
    (normalizedTask.includes("background") && normalizedTask.includes("instagram"))
  ) {
    const recommendedTool = describeCapability("public.build_adobe_workflow");
    return {
      recommendedTool,
      alternatives: toolManifests.filter((tool) => tool.toolName !== "public.build_adobe_workflow"),
    };
  }

  if (
    normalizedTask.includes("which adobe app") ||
    normalizedTask.includes("which product") ||
    normalizedTask.includes("what product should") ||
    normalizedTask.includes("right adobe product")
  ) {
    const recommendedTool = describeCapability("public.find_product_for_task");
    return {
      recommendedTool,
      alternatives: toolManifests.filter((tool) => tool.toolName !== "public.find_product_for_task"),
    };
  }

  if (
    normalizedTask.includes("what can firefly do") ||
    normalizedTask.includes("what can photoshop do") ||
    normalizedTask.includes("what can illustrator do") ||
    normalizedTask.includes("what can premiere pro do") ||
    normalizedTask.includes("what can premiere do")
  ) {
    const recommendedTool = describeCapability("public.get_product_capabilities");
    return {
      recommendedTool,
      alternatives: toolManifests.filter((tool) => tool.toolName !== "public.get_product_capabilities"),
    };
  }

  if (
    normalizedTask.includes("will ") &&
    normalizedTask.includes(" run") &&
    (normalizedTask.includes("macos") ||
      normalizedTask.includes("macbook") ||
      normalizedTask.includes("mac") ||
      normalizedTask.includes("windows"))
  ) {
    const recommendedTool = describeCapability("public.check_device_compatibility");
    return {
      recommendedTool,
      alternatives: [
        ...toolManifests.filter((tool) => tool.toolName === "public.get_product_system_requirements"),
        ...toolManifests.filter((tool) => tool.toolName !== "public.check_device_compatibility"),
      ],
    };
  }

  if (normalizedTask.includes("system requirement") || normalizedTask.includes("requirements")) {
    const recommendedTool = describeCapability("public.get_product_system_requirements");
    return {
      recommendedTool,
      alternatives: toolManifests.filter(
        (tool) => tool.toolName !== "public.get_product_system_requirements",
      ),
    };
  }

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

  return {
    recommendedTool: null,
    alternatives: toolManifests,
  };
}
