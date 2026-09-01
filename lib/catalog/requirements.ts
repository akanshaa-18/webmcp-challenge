import { getPublicProductById } from "@/lib/catalog/products";

export type SupportedPlatform = "macos" | "windows" | "web" | "ios" | "android";

export interface ProductSystemRequirements {
  productId: string;
  platform: SupportedPlatform;
  minimumSupportedOS: string | null;
  recommendedOS: string | null;
  minimumMemoryGB: number | null;
  recommendedMemoryGB: number | null;
  minimumStorageGB: number | null;
  recommendedStorageGB: number | null;
  minimumProcessor: string | null;
  minimumGpu: string | null;
  notes: string[];
  unavailableFields: string[];
  sourceUrl: string;
  dataSource: "public_reference_snapshot";
  verifiedAt: string;
}

const VERIFIED_AT = "2026-09-01";

export const productSystemRequirements: ProductSystemRequirements[] = [
  {
    productId: "premiere-pro",
    platform: "macos",
    minimumSupportedOS: null,
    recommendedOS: null,
    minimumMemoryGB: null,
    recommendedMemoryGB: null,
    minimumStorageGB: null,
    recommendedStorageGB: null,
    minimumProcessor: null,
    minimumGpu: null,
    notes: [
      "Current detailed hardware thresholds are intentionally unavailable in this demo snapshot.",
      "Use the official Premiere Pro requirements page before making purchase or deployment decisions.",
    ],
    unavailableFields: [
      "minimumSupportedOS",
      "recommendedOS",
      "minimumMemoryGB",
      "recommendedMemoryGB",
      "minimumStorageGB",
      "recommendedStorageGB",
      "minimumProcessor",
      "minimumGpu",
    ],
    sourceUrl: "https://helpx.adobe.com/premiere-pro/system-requirements.html",
    dataSource: "public_reference_snapshot",
    verifiedAt: VERIFIED_AT,
  },
];

export function getSystemRequirements(
  productId: string,
  platform: SupportedPlatform,
): ProductSystemRequirements | null {
  return (
    productSystemRequirements.find(
      (requirement) => requirement.productId === productId && requirement.platform === platform,
    ) ?? null
  );
}

export function getSupportedPlatformsForProduct(productId: string): SupportedPlatform[] {
  const platformsFromRequirements = productSystemRequirements
    .filter((requirement) => requirement.productId === productId)
    .map((requirement) => requirement.platform);

  if (platformsFromRequirements.length > 0) {
    return Array.from(new Set(platformsFromRequirements));
  }

  const product = getPublicProductById(productId);
  if (!product) {
    return [];
  }

  return product.platforms.filter((platform): platform is SupportedPlatform =>
    ["macos", "windows", "web", "ios", "android"].includes(platform),
  );
}
