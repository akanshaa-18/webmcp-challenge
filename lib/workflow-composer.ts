import { getCapabilityById } from "@/lib/catalog/capabilities";
import { getPublicProductById } from "@/lib/catalog/products";
import { toolError } from "@/lib/errors";

type NormalizedIntent =
  | "background-transformation"
  | "social-content"
  | "photo-editing"
  | "video-editing"
  | "plan-selection";

interface WorkflowStep {
  order: number;
  productId: string;
  productName: string;
  capabilityId: string;
  capability: string;
  ownerSurface: string;
  why: string;
  requires: string[];
  produces: string;
  destinationUrl: string;
  audience: "public";
}

interface DecisionPoint {
  step: number;
  type: "creative_direction";
  question: string;
}

interface BuildWorkflowOutput {
  workflowId: string;
  goal: string;
  steps: WorkflowStep[];
  recommendedStart: {
    productId: string;
    destinationUrl: string;
  };
  requiredInputs: string[];
  requiredUserInputs: string[];
  decisionPoints: DecisionPoint[];
  userConstraints: string[];
  dataSource: "public_reference_snapshot";
}

const INTENT_KEYWORDS: Record<NormalizedIntent, string[]> = {
  "background-transformation": [
    "remove background",
    "replace background",
    "change background",
    "clean up product photo background",
    "background",
  ],
  "social-content": [
    "instagram post",
    "adapt for instagram",
    "social post",
    "social media graphic",
    "instagram",
  ],
  "photo-editing": ["edit a photo", "edit photo", "retouch photo", "photo editing"],
  "video-editing": ["edit video", "make a video", "trim video", "video editing"],
  "plan-selection": ["which plan", "plan should i get", "adobe plan", "pricing"],
};

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export function normalizeTaskIntents(task?: string): {
  normalizedGoal: string;
  intents: NormalizedIntent[];
} | {
  status: "error";
  code: string;
  message: string;
} {
  if (!task?.trim()) {
    return toolError("MISSING_TASK", "The task field is required.");
  }

  const normalizedTask = normalizeText(task);
  const intents = (Object.entries(INTENT_KEYWORDS) as Array<[NormalizedIntent, string[]]>)
    .filter(([, keywords]) => hasAnyKeyword(normalizedTask, keywords))
    .map(([intent]) => intent);

  if (intents.length === 0) {
    return toolError(
      "UNKNOWN_TASK",
      "Task could not be normalized to a known Adobe workflow intent.",
    );
  }

  return {
    normalizedGoal: intents.join(" + "),
    intents,
  };
}

function stepFromCapability(
  order: number,
  capabilityId: string,
  requires: string[],
  produces: string,
): WorkflowStep | null {
  const capability = getCapabilityById(capabilityId);
  if (!capability) {
    return null;
  }
  const product = getPublicProductById(capability.productId);
  if (!product) {
    return null;
  }

  return {
    order,
    productId: product.id,
    productName: product.name,
    capabilityId: capability.id,
    capability: capability.name,
    ownerSurface: capability.ownerSurface,
    why: capability.description,
    requires,
    produces,
    destinationUrl: capability.destinationUrl,
    audience: "public",
  };
}

function includesAny(values: NormalizedIntent[], match: NormalizedIntent[]): boolean {
  return match.some((value) => values.includes(value));
}

function composeWorkflowSteps(intents: NormalizedIntent[]): WorkflowStep[] | null {
  const hasVideo = includesAny(intents, ["video-editing"]);
  const hasImage = includesAny(intents, [
    "background-transformation",
    "social-content",
    "photo-editing",
  ]);
  if (hasVideo && hasImage) {
    return null;
  }

  if (
    includesAny(intents, ["background-transformation"]) &&
    includesAny(intents, ["social-content"])
  ) {
    const step1 = stepFromCapability(
      1,
      "firefly-background-transformation",
      ["source image"],
      "background-transformed-image",
    );
    const step2 = stepFromCapability(
      2,
      "express-social-post-design",
      ["background-transformed-image"],
      "instagram-ready-post",
    );
    if (!step1 || !step2) {
      return null;
    }
    return [step1, step2];
  }

  if (includesAny(intents, ["background-transformation"])) {
    const step = stepFromCapability(
      1,
      "firefly-background-transformation",
      ["source image"],
      "background-transformed-image",
    );
    return step ? [step] : null;
  }

  if (includesAny(intents, ["social-content"])) {
    const step = stepFromCapability(
      1,
      "express-social-post-design",
      ["source image"],
      "instagram-ready-post",
    );
    return step ? [step] : null;
  }

  if (includesAny(intents, ["photo-editing"])) {
    const step = stepFromCapability(1, "photoshop-image-editing", ["source image"], "edited-image");
    return step ? [step] : null;
  }

  if (includesAny(intents, ["video-editing"])) {
    const step = stepFromCapability(1, "premiere-video-editing", ["source footage"], "edited-video");
    return step ? [step] : null;
  }

  if (includesAny(intents, ["plan-selection"])) {
    return [];
  }

  return null;
}

export function buildAdobeWorkflow(task?: string, userConstraints: string[] = []) {
  const normalizedResult = normalizeTaskIntents(task);
  if ("status" in normalizedResult) {
    return normalizedResult;
  }
  const normalized = normalizedResult;

  const steps = composeWorkflowSteps(normalized.intents);
  if (steps === null) {
    return toolError(
      "NO_VALID_WORKFLOW",
      "No valid deterministic workflow could be composed for this task.",
    );
  }
  if (steps.length === 0) {
    return toolError(
      "INSUFFICIENT_CONTEXT",
      "This task is better handled by plans/pricing tools rather than a multi-step creative workflow.",
    );
  }

  const requiredInputs = Array.from(new Set(steps.flatMap((step) => step.requires)));
  const normalizedConstraints = userConstraints.map((constraint) => normalizeText(constraint));
  const requireCreativeDecision = normalizedConstraints.some(
    (constraint) =>
      constraint.includes("don't make creative choices") ||
      constraint.includes("creative direction"),
  );

  const decisionPoints: DecisionPoint[] = [];
  if (requireCreativeDecision && steps.some((step) => step.capabilityId === "firefly-background-transformation")) {
    decisionPoints.push({
      step: 1,
      type: "creative_direction",
      question: "What background style should be used for the transformed image?",
    });
  }

  const result: BuildWorkflowOutput = {
    workflowId: `wf-${steps.map((step) => step.productId).join("-")}`,
    goal: normalized.normalizedGoal,
    steps,
    recommendedStart: {
      productId: steps[0].productId,
      destinationUrl: steps[0].destinationUrl,
    },
    requiredInputs,
    requiredUserInputs: decisionPoints.map((point) => point.question),
    decisionPoints,
    userConstraints,
    dataSource: "public_reference_snapshot",
  };

  return {
    status: "ok" as const,
    data: result,
  };
}
