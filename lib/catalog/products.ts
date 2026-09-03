export type CatalogDataSource = "public_reference_snapshot";

export interface PublicProduct {
  id: string;
  name: string;
  category: "desktop_app" | "web_app" | "suite";
  primaryUseCases: string[];
  capabilities: string[];
  platforms: string[];
  destinationUrl: string;
  sourceUrl: string;
  dataSource: CatalogDataSource;
  verifiedAt: string;
}

const VERIFIED_AT = "2026-09-01";
const DATA_SOURCE: CatalogDataSource = "public_reference_snapshot";

export const publicProducts: PublicProduct[] = [
  {
    id: "photoshop",
    name: "Adobe Photoshop",
    category: "desktop_app",
    primaryUseCases: ["photo editing", "image retouching", "compositing"],
    capabilities: ["image-editing", "layer-based-compositing"],
    platforms: ["macos", "windows", "web"],
    destinationUrl: "https://www.adobe.com/products/photoshop.html",
    sourceUrl: "https://www.adobe.com/products/photoshop.html",
    dataSource: DATA_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "illustrator",
    name: "Adobe Illustrator",
    category: "desktop_app",
    primaryUseCases: ["vector design", "logo design", "brand assets"],
    capabilities: ["vector-design", "logo-creation"],
    platforms: ["macos", "windows", "web"],
    destinationUrl: "https://www.adobe.com/products/illustrator.html",
    sourceUrl: "https://www.adobe.com/products/illustrator.html",
    dataSource: DATA_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "premiere-pro",
    name: "Adobe Premiere Pro",
    category: "desktop_app",
    primaryUseCases: ["video editing", "short-form video", "long-form production"],
    capabilities: ["timeline-video-editing", "video-export"],
    platforms: ["macos", "windows"],
    destinationUrl: "https://www.adobe.com/products/premiere.html",
    sourceUrl: "https://www.adobe.com/products/premiere.html",
    dataSource: DATA_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "firefly",
    name: "Adobe Firefly",
    category: "web_app",
    primaryUseCases: ["background replacement", "generative image edits", "concept generation"],
    capabilities: ["background-transformation", "prompted-image-variation"],
    platforms: ["web"],
    destinationUrl: "https://firefly.adobe.com/",
    sourceUrl: "https://firefly.adobe.com/",
    dataSource: DATA_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "express",
    name: "Adobe Express",
    category: "web_app",
    primaryUseCases: ["social graphics", "quick marketing collateral", "business cards"],
    capabilities: ["social-post-design", "business-card-design"],
    platforms: ["web", "ios", "android"],
    destinationUrl: "https://express.adobe.com/",
    sourceUrl: "https://www.adobe.com/express/",
    dataSource: DATA_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "creative-cloud",
    name: "Adobe Creative Cloud",
    category: "suite",
    primaryUseCases: ["cross-app workflows", "multi-format creative production"],
    capabilities: ["cross-product-workflows", "plan-selection"],
    platforms: ["web", "macos", "windows", "ios", "android"],
    destinationUrl: "https://www.adobe.com/creativecloud.html",
    sourceUrl: "https://www.adobe.com/creativecloud.html",
    dataSource: DATA_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "lightroom",
    name: "Adobe Lightroom",
    category: "desktop_app",
    primaryUseCases: ["photo organization", "RAW photo editing", "color grading"],
    capabilities: ["raw-editing", "photo-organization", "non-destructive-editing"],
    platforms: ["macos", "windows", "web", "ios", "android"],
    destinationUrl: "https://www.adobe.com/products/photoshop-lightroom.html",
    sourceUrl: "https://www.adobe.com/products/photoshop-lightroom.html",
    dataSource: DATA_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "after-effects",
    name: "Adobe After Effects",
    category: "desktop_app",
    primaryUseCases: ["motion graphics", "visual effects", "video compositing"],
    capabilities: ["motion-graphics", "vfx-compositing"],
    platforms: ["macos", "windows"],
    destinationUrl: "https://www.adobe.com/products/aftereffects.html",
    sourceUrl: "https://www.adobe.com/products/aftereffects.html",
    dataSource: DATA_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "acrobat",
    name: "Adobe Acrobat",
    category: "desktop_app",
    primaryUseCases: ["PDF creation", "document editing", "e-signatures"],
    capabilities: ["pdf-creation", "e-signature"],
    platforms: ["macos", "windows", "web"],
    destinationUrl: "https://www.adobe.com/acrobat.html",
    sourceUrl: "https://www.adobe.com/acrobat.html",
    dataSource: DATA_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "indesign",
    name: "Adobe InDesign",
    category: "desktop_app",
    primaryUseCases: ["print layout", "brochure design", "multi-page documents"],
    capabilities: ["print-layout", "multi-page-design"],
    platforms: ["macos", "windows"],
    destinationUrl: "https://www.adobe.com/products/indesign.html",
    sourceUrl: "https://www.adobe.com/products/indesign.html",
    dataSource: DATA_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
];

export function getPublicProductById(productId: string): PublicProduct | null {
  return publicProducts.find((product) => product.id === productId) ?? null;
}
