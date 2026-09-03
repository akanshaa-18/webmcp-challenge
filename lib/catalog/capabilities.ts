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
    compatibleNextCapabilities: ["express-social-post-design"],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "photoshop-generative-fill",
    productId: "photoshop",
    name: "Generative fill",
    description: "Add, remove, or replace objects in a photo using AI-powered generative fill.",
    taskTypes: ["add object to photo", "remove object from photo", "generative fill", "ai object removal"],
    inputs: ["image asset", "selection area"],
    outputs: ["edited image asset"],
    destinationUrl: "https://www.adobe.com/products/photoshop.html",
    ownerSurface: "Adobe Photoshop",
    sourceUrl: "https://www.adobe.com/products/photoshop.html",
    compatibleNextCapabilities: ["express-social-post-design"],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "firefly-text-to-image",
    productId: "firefly",
    name: "Text to image",
    description: "Generate original images from a text prompt for concept exploration or marketing assets.",
    taskTypes: ["generate image", "create image from text", "ai image generation", "text to image", "concept image"],
    inputs: ["text prompt"],
    outputs: ["generated image asset"],
    destinationUrl: "https://firefly.adobe.com/",
    ownerSurface: "Adobe Firefly",
    sourceUrl: "https://firefly.adobe.com/",
    compatibleNextCapabilities: ["photoshop-image-editing", "express-social-post-design"],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "firefly-generative-fill",
    productId: "firefly",
    name: "Generative fill",
    description: "Fill or extend image areas using AI — add objects, extend canvas, or remove distractions.",
    taskTypes: ["generative fill", "extend image", "outpainting", "fill selection", "expand canvas"],
    inputs: ["image asset", "selection or prompt"],
    outputs: ["edited image asset"],
    destinationUrl: "https://firefly.adobe.com/",
    ownerSurface: "Adobe Firefly",
    sourceUrl: "https://firefly.adobe.com/",
    compatibleNextCapabilities: ["photoshop-image-editing"],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "illustrator-vector-logo",
    productId: "illustrator",
    name: "Vector logo creation",
    description: "Design scalable vector logos and brand identity assets.",
    taskTypes: ["create logo", "logo design", "brand identity", "vector logo", "brand logo"],
    inputs: ["brand brief", "reference images"],
    outputs: ["vector logo asset"],
    destinationUrl: "https://www.adobe.com/products/illustrator.html",
    ownerSurface: "Adobe Illustrator",
    sourceUrl: "https://www.adobe.com/products/illustrator.html",
    compatibleNextCapabilities: ["express-social-post-design", "express-business-card-layout"],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "illustrator-icon-design",
    productId: "illustrator",
    name: "Icon design",
    description: "Create icon sets and UI icons as scalable vector graphics.",
    taskTypes: ["icon design", "create icons", "ui icons", "icon set", "app icons"],
    inputs: ["design brief"],
    outputs: ["icon set SVG assets"],
    destinationUrl: "https://www.adobe.com/products/illustrator.html",
    ownerSurface: "Adobe Illustrator",
    sourceUrl: "https://www.adobe.com/products/illustrator.html",
    compatibleNextCapabilities: [],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "lightroom-raw-editing",
    productId: "lightroom",
    name: "RAW photo editing",
    description: "Non-destructive color grading, exposure correction, and RAW file processing.",
    taskTypes: ["edit raw photo", "color grade photos", "adjust exposure", "lightroom edit", "photo color grading"],
    inputs: ["RAW or JPEG image"],
    outputs: ["color-graded image"],
    destinationUrl: "https://www.adobe.com/products/photoshop-lightroom.html",
    ownerSurface: "Adobe Lightroom",
    sourceUrl: "https://www.adobe.com/products/photoshop-lightroom.html",
    compatibleNextCapabilities: ["photoshop-image-editing"],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "lightroom-photo-organization",
    productId: "lightroom",
    name: "Photo organization",
    description: "Import, rate, cull, and organize large photo libraries with metadata and albums.",
    taskTypes: ["organize photos", "cull photos", "rate photos", "photo library", "sort photos"],
    inputs: ["photo collection"],
    outputs: ["organized photo library"],
    destinationUrl: "https://www.adobe.com/products/photoshop-lightroom.html",
    ownerSurface: "Adobe Lightroom",
    sourceUrl: "https://www.adobe.com/products/photoshop-lightroom.html",
    compatibleNextCapabilities: ["lightroom-raw-editing"],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "after-effects-motion-graphics",
    productId: "after-effects",
    name: "Motion graphics",
    description: "Create animated titles, lower thirds, and motion graphics for video.",
    taskTypes: ["motion graphics", "animate text", "animated logo", "lower thirds", "create intro animation", "animated title"],
    inputs: ["design assets", "video project"],
    outputs: ["motion graphics clip"],
    destinationUrl: "https://www.adobe.com/products/aftereffects.html",
    ownerSurface: "Adobe After Effects",
    sourceUrl: "https://www.adobe.com/products/aftereffects.html",
    compatibleNextCapabilities: ["premiere-video-editing"],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "after-effects-vfx",
    productId: "after-effects",
    name: "Visual effects compositing",
    description: "Composite visual effects, key out green screen footage, and create VFX shots.",
    taskTypes: ["visual effects", "vfx", "green screen", "chroma key", "compositing", "rotoscoping"],
    inputs: ["video footage", "background plate"],
    outputs: ["composited VFX shot"],
    destinationUrl: "https://www.adobe.com/products/aftereffects.html",
    ownerSurface: "Adobe After Effects",
    sourceUrl: "https://www.adobe.com/products/aftereffects.html",
    compatibleNextCapabilities: ["premiere-video-editing"],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "acrobat-pdf-creation",
    productId: "acrobat",
    name: "PDF creation and editing",
    description: "Create, edit, and export PDF documents from any file type.",
    taskTypes: ["create pdf", "edit pdf", "convert to pdf", "pdf document", "export as pdf"],
    inputs: ["source document or file"],
    outputs: ["PDF document"],
    destinationUrl: "https://www.adobe.com/acrobat.html",
    ownerSurface: "Adobe Acrobat",
    sourceUrl: "https://www.adobe.com/acrobat.html",
    compatibleNextCapabilities: [],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "acrobat-e-signature",
    productId: "acrobat",
    name: "E-signature",
    description: "Request and collect legally binding electronic signatures on documents.",
    taskTypes: ["sign document", "e-sign", "electronic signature", "request signature", "digital signature"],
    inputs: ["PDF or document"],
    outputs: ["signed document"],
    destinationUrl: "https://www.adobe.com/acrobat/sign.html",
    ownerSurface: "Adobe Acrobat",
    sourceUrl: "https://www.adobe.com/acrobat/sign.html",
    compatibleNextCapabilities: [],
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "indesign-print-layout",
    productId: "indesign",
    name: "Print layout design",
    description: "Design multi-page print documents — brochures, magazines, books, and reports.",
    taskTypes: ["design brochure", "book layout", "multi-page document", "magazine layout", "print layout", "newsletter design"],
    inputs: ["text content", "image assets"],
    outputs: ["print-ready layout"],
    destinationUrl: "https://www.adobe.com/products/indesign.html",
    ownerSurface: "Adobe InDesign",
    sourceUrl: "https://www.adobe.com/products/indesign.html",
    compatibleNextCapabilities: ["acrobat-pdf-creation"],
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

export function getAllTaskTypes(): string[] {
  return [...new Set(productCapabilities.flatMap((c) => c.taskTypes))].sort();
}

export interface CapabilityContinuation {
  capabilityId: string;
  capabilityName: string;
  productId: string;
  productName: string;
  destinationUrl: string;
}

export function getCapabilityContinuations(capabilityId: string): CapabilityContinuation[] {
  const capability = getCapabilityById(capabilityId);
  if (!capability) return [];

  return capability.compatibleNextCapabilities.flatMap((nextId) => {
    const next = getCapabilityById(nextId);
    if (!next) return [];
    const product = getPublicProductById(next.productId);
    if (!product) return [];
    return [{
      capabilityId: next.id,
      capabilityName: next.name,
      productId: product.id,
      productName: product.name,
      destinationUrl: next.destinationUrl,
    }];
  });
}
