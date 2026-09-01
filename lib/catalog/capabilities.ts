import { getPublicProductById } from "@/lib/catalog/products";

export interface ProductCapability {
  id: string;
  productId: string;
  name: string;
  description: string;
  taskTypes: string[];
  inputs: string[];
  outputs: string[];
  destinationUrl: string;
  ownerSurface: string;
  sourceUrl: string;
  compatibleNextCapabilities: string[];
  dataSource: "public_reference_snapshot";
  verifiedAt: string;
}

const VERIFIED_AT = "2026-09-01";

export const productCapabilities: ProductCapability[] = [
  {
    id: "firefly-background-transformation",
    productId: "firefly",
    name: "Background transformation",
    description: "Remove or replace image backgrounds for creative adaptations.",
    taskTypes: ["remove background", "change image background", "background replacement"],
    inputs: ["image asset"],
    outputs: ["edited image asset"],
    destinationUrl: "https://firefly.adobe.com/",
    ownerSurface: "Adobe Firefly",
    sourceUrl: "https://firefly.adobe.com/",
    compatibleNextCapabilities: ["express-social-post-design", "express-business-card-layout"],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "express-social-post-design",
    productId: "express",
    name: "Social post design",
    description: "Turn assets into platform-ready social graphics.",
    taskTypes: ["make instagram post", "create social post", "social media graphic"],
    inputs: ["image asset", "branding direction"],
    outputs: ["social-ready graphic"],
    destinationUrl: "https://express.adobe.com/",
    ownerSurface: "Adobe Express",
    sourceUrl: "https://www.adobe.com/express/",
    compatibleNextCapabilities: [],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "express-business-card-layout",
    productId: "express",
    name: "Business card layout",
    description: "Create a business card design from a prepared asset.",
    taskTypes: ["create business card", "business card design"],
    inputs: ["logo or visual asset", "contact details"],
    outputs: ["business card design"],
    destinationUrl: "https://express.adobe.com/",
    ownerSurface: "Adobe Express",
    sourceUrl: "https://www.adobe.com/express/",
    compatibleNextCapabilities: [],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "premiere-video-editing",
    productId: "premiere-pro",
    name: "Video editing workflow",
    description: "Edit timeline-based video projects and export final cuts.",
    taskTypes: ["edit video", "video editing", "cut video", "assemble footage"],
    inputs: ["video clips", "audio clips"],
    outputs: ["edited video"],
    destinationUrl: "https://www.adobe.com/products/premiere.html",
    ownerSurface: "Adobe Premiere Pro",
    sourceUrl: "https://www.adobe.com/products/premiere.html",
    compatibleNextCapabilities: [],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "photoshop-image-editing",
    productId: "photoshop",
    name: "Image editing",
    description: "Perform layer-based image editing and retouching.",
    taskTypes: ["retouch photo", "edit photo", "photo compositing"],
    inputs: ["image asset"],
    outputs: ["edited image"],
    destinationUrl: "https://www.adobe.com/products/photoshop.html",
    ownerSurface: "Adobe Photoshop",
    sourceUrl: "https://www.adobe.com/products/photoshop.html",
    compatibleNextCapabilities: [],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
];

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function scoreTaskMatch(task: string, taskType: string): number {
  const normalizedTask = normalize(task);
  const normalizedTaskType = normalize(taskType);
  if (normalizedTask.includes(normalizedTaskType)) {
    return 100;
  }

  const tokens = normalizedTaskType.split(/\s+/).filter(Boolean);
  return tokens.reduce((score, token) => (normalizedTask.includes(token) ? score + 10 : score), 0);
}

export function rankCapabilitiesForTask(task: string): ProductCapability[] {
  return productCapabilities
    .map((capability) => ({
      capability,
      score: capability.taskTypes.reduce(
        (best, taskType) => Math.max(best, scoreTaskMatch(task, taskType)),
        0,
      ),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.capability);
}

export function getCapabilitiesByProductId(productId: string): ProductCapability[] {
  return productCapabilities.filter((capability) => capability.productId === productId);
}

export function getCapabilityById(capabilityId: string): ProductCapability | null {
  return productCapabilities.find((capability) => capability.id === capabilityId) ?? null;
}

export function hasKnownProduct(productId: string): boolean {
  return getPublicProductById(productId) !== null;
}
