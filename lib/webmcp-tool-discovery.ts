"use client";

/**
 * WebMCP Tool Discovery
 * Discovers tools registered by Adobe surfaces and matches them to user problems
 */

export interface RegisteredTool {
  name: string;
  surface: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  tags?: string[];
}

export interface ToolMatch {
  toolName: string;
  surface: string;
  description: string;
  relevance: number;
  why: string;
}

export interface WorkflowStep {
  step: number;
  surface: string;
  suggestedTools: Array<{
    name: string;
    description: string;
    relevance: number;
  }>;
  reasoning: string;
  estimatedTime?: string;
}

// Mock registry of Adobe surface tools (in production, query from browser WebMCP API)
const SURFACE_TOOLS_REGISTRY: Record<string, RegisteredTool[]> = {
  Photoshop: [
    {
      name: "harmonize",
      surface: "Photoshop",
      description: "Blend lighting, color, and tone across layers in composites",
      tags: ["color_correction", "lighting", "blending", "composites"],
    },
    {
      name: "content_aware_fill",
      surface: "Photoshop",
      description: "Intelligently remove and fill unwanted areas in images",
      tags: ["retouching", "removal", "inpainting"],
    },
    {
      name: "remove_background",
      surface: "Photoshop",
      description: "Automatically detect and remove image backgrounds",
      tags: ["segmentation", "background_removal", "isolation"],
    },
    {
      name: "curves",
      surface: "Photoshop",
      description: "Adjust tones and colors with precision curves control",
      tags: ["color_adjustment", "tonal_range"],
    },
    {
      name: "generative_fill",
      surface: "Photoshop",
      description: "Generate or extend image content using AI",
      tags: ["generative", "inpainting", "extension"],
    },
  ],
  Firefly: [
    {
      name: "generate_background",
      surface: "Firefly",
      description: "Generate AI-powered backgrounds matching image style",
      tags: ["generative", "background", "composition"],
    },
    {
      name: "generate_images",
      surface: "Firefly",
      description: "Create entirely new images from text descriptions",
      tags: ["text_to_image", "generative", "creation"],
    },
    {
      name: "generative_expand",
      surface: "Firefly",
      description: "Expand image canvas and fill with generated content",
      tags: ["generative", "expansion", "composition"],
    },
    {
      name: "generative_fill",
      surface: "Firefly",
      description: "Fill specific areas with AI-generated content",
      tags: ["generative", "inpainting"],
    },
  ],
  Illustrator: [
    {
      name: "generative_fill",
      surface: "Illustrator",
      description: "Generate vector content using text descriptions",
      tags: ["generative", "vector", "creation"],
    },
    {
      name: "symbol_library",
      surface: "Illustrator",
      description: "Manage and apply consistent design symbols",
      tags: ["design_system", "consistency", "reusable_components"],
    },
  ],
  "Premiere Pro": [
    {
      name: "auto_reframe",
      surface: "Premiere Pro",
      description: "Automatically reframe videos for different aspect ratios",
      tags: ["video_editing", "formatting", "multi_platform"],
    },
    {
      name: "speech_to_text",
      surface: "Premiere Pro",
      description: "Automatically generate captions from video audio",
      tags: ["video_editing", "captions", "accessibility"],
    },
  ],
  Express: [
    {
      name: "resize_for_instagram",
      surface: "Express",
      description: "Resize and format designs for Instagram dimensions",
      tags: ["social_media", "formatting", "instagram"],
    },
    {
      name: "resize_for_facebook",
      surface: "Express",
      description: "Resize and format designs for Facebook",
      tags: ["social_media", "formatting", "facebook"],
    },
    {
      name: "instagram_template",
      surface: "Express",
      description: "Apply Instagram-optimized templates",
      tags: ["templates", "social_media", "instagram"],
    },
    {
      name: "brand_template",
      surface: "Express",
      description: "Apply templates matching brand guidelines",
      tags: ["templates", "branding"],
    },
  ],
};

/**
 * Discover tools available from a specific Adobe surface
 */
export function discoverSurfaceTools(surfaceName: string): RegisteredTool[] {
  if (surfaceName === "all") {
    return Object.values(SURFACE_TOOLS_REGISTRY).flat();
  }
  return SURFACE_TOOLS_REGISTRY[surfaceName] || [];
}

/**
 * Simple keyword-based matching of user problem to tool descriptions
 */
function calculateRelevance(problem: string, tool: RegisteredTool): number {
  const problemLower = problem.toLowerCase();
  const descriptionLower = tool.description.toLowerCase();
  const tagsLower = (tool.tags || []).map((t) => t.toLowerCase());

  let score = 0;

  // Exact phrase match in description (highest priority)
  if (descriptionLower.includes(problemLower)) {
    score += 0.95;
  }

  // Keyword matches in description
  const keywords = problemLower.split(/\s+/);
  const matchingKeywords = keywords.filter(
    (kw) => descriptionLower.includes(kw) || tagsLower.some((tag) => tag.includes(kw))
  );
  if (matchingKeywords.length > 0) {
    score = Math.max(score, (matchingKeywords.length / keywords.length) * 0.8);
  }

  // Tag-based matching
  const matchingTags = tagsLower.filter((tag) =>
    keywords.some((kw) => tag.includes(kw) || kw.includes(tag))
  );
  if (matchingTags.length > 0) {
    score = Math.max(score, (matchingTags.length / tagsLower.length) * 0.7);
  }

  return score;
}

/**
 * Find the best registered tools that solve a user's problem
 */
export function recommendToolsForProblem(
  problem: string,
  surfaceFilter?: string
): ToolMatch[] {
  const allTools = surfaceFilter ? discoverSurfaceTools(surfaceFilter) : discoverSurfaceTools("all");

  // Score all tools based on relevance to the problem
  const scored = allTools.map((tool) => ({
    tool,
    relevance: calculateRelevance(problem, tool),
  }));

  // Sort by relevance and filter out low-scoring results
  const matches = scored
    .filter((item) => item.relevance > 0.3)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5) // Top 5 matches
    .map((item) => {
      const { tool, relevance } = item;
      return {
        toolName: tool.name,
        surface: tool.surface,
        description: tool.description,
        relevance: Math.round(relevance * 100),
        why: `This tool ${tool.description.toLowerCase()}`,
      };
    });

  return matches;
}

/**
 * Suggest workflow steps based on creative goal and available tools
 */
export function suggestWorkflowFromGoal(goal: string): WorkflowStep[] {
  // Simple heuristic-based workflow suggestions
  const goalLower = goal.toLowerCase();

  const workflows: Record<string, WorkflowStep[]> = {
    product_photo: [
      {
        step: 1,
        surface: "Photoshop",
        suggestedTools: discoverSurfaceTools("Photoshop")
          .filter((t) => t.tags?.some((tag) => tag.includes("removal") || tag.includes("retouching")))
          .slice(0, 2)
          .map((t) => ({ name: t.name, description: t.description, relevance: 0.9 })),
        reasoning: "Enhance and clean up raw product photography",
        estimatedTime: "10-15 min",
      },
      {
        step: 2,
        surface: "Firefly",
        suggestedTools: discoverSurfaceTools("Firefly")
          .filter((t) => t.tags?.includes("generative"))
          .slice(0, 2)
          .map((t) => ({ name: t.name, description: t.description, relevance: 0.85 })),
        reasoning: "Generate matching campaign backgrounds or compositions",
        estimatedTime: "5-10 min",
      },
      {
        step: 3,
        surface: "Express",
        suggestedTools: discoverSurfaceTools("Express")
          .filter((t) => t.tags?.includes("social_media"))
          .slice(0, 2)
          .map((t) => ({ name: t.name, description: t.description, relevance: 0.9 })),
        reasoning: "Format for social media platforms",
        estimatedTime: "3-5 min",
      },
    ],
    campaign_imagery: [
      {
        step: 1,
        surface: "Firefly",
        suggestedTools: discoverSurfaceTools("Firefly")
          .filter((t) => t.tags?.includes("generative"))
          .slice(0, 2)
          .map((t) => ({ name: t.name, description: t.description, relevance: 0.95 })),
        reasoning: "Generate or expand campaign artwork",
        estimatedTime: "10-15 min",
      },
      {
        step: 2,
        surface: "Photoshop",
        suggestedTools: discoverSurfaceTools("Photoshop")
          .filter((t) => t.tags?.includes("color_correction"))
          .slice(0, 2)
          .map((t) => ({ name: t.name, description: t.description, relevance: 0.85 })),
        reasoning: "Refine colors and tones for consistency",
        estimatedTime: "5-10 min",
      },
    ],
    video_content: [
      {
        step: 1,
        surface: "Premiere Pro",
        suggestedTools: discoverSurfaceTools("Premiere Pro")
          .slice(0, 2)
          .map((t) => ({ name: t.name, description: t.description, relevance: 0.9 })),
        reasoning: "Edit and compose video content",
        estimatedTime: "20-30 min",
      },
      {
        step: 2,
        surface: "Express",
        suggestedTools: discoverSurfaceTools("Express")
          .filter((t) => t.tags?.includes("social_media"))
          .slice(0, 1)
          .map((t) => ({ name: t.name, description: t.description, relevance: 0.8 })),
        reasoning: "Prepare for social media sharing",
        estimatedTime: "5 min",
      },
    ],
  };

  // Detect workflow type from goal
  if (
    goalLower.includes("photo") ||
    goalLower.includes("product") ||
    goalLower.includes("enhance")
  ) {
    return workflows["product_photo"];
  }
  if (goalLower.includes("campaign") || goalLower.includes("composition")) {
    return workflows["campaign_imagery"];
  }
  if (goalLower.includes("video") || goalLower.includes("motion")) {
    return workflows["video_content"];
  }

  // Default: suggest all surfaces
  return Object.values(workflows).flat();
}

/**
 * Generate redirect URL to a tool in its surface
 */
export function getToolRedirectUrl(
  toolName: string,
  surface: string,
  context?: string
): string {
  const baseUrls: Record<string, string> = {
    Photoshop: "https://adobe.com/products/photoshop/webmcp",
    Firefly: "https://adobe.com/products/firefly/webmcp",
    Illustrator: "https://adobe.com/products/illustrator/webmcp",
    "Premiere Pro": "https://adobe.com/products/premiere-pro/webmcp",
    Express: "https://adobe.com/products/express/webmcp",
  };

  const baseUrl = baseUrls[surface] || "https://adobe.com";
  const params = new URLSearchParams();
  params.set("tool", toolName);
  if (context) {
    params.set("context", context);
  }

  return `${baseUrl}?${params.toString()}`;
}
