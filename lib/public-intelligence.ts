import {
  getAllCapabilities,
  getCapabilitiesByProductId,
  hasKnownProduct,
  rankCapabilitiesForTask,
} from "@/lib/catalog/capabilities";
import { getPublicProductById } from "@/lib/catalog/products";
import {
  getSupportedPlatformsForProduct,
  getSystemRequirements,
  SupportedPlatform,
} from "@/lib/catalog/requirements";
import { toolError } from "@/lib/errors";

export interface CompatibilityDeviceContext {
  osVersion?: string;
  memoryGB?: number;
  freeStorageGB?: number;
  processor?: string;
  gpu?: string;
}

type CompatibilityCheckResult = {
  field: string;
  status: "pass" | "fail" | "unknown";
  message: string;
};

function isSupportedPlatform(platform: string): platform is SupportedPlatform {
  return ["macos", "windows", "web", "ios", "android"].includes(platform);
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function hasDeviceData(device?: CompatibilityDeviceContext): boolean {
  if (!device) {
    return false;
  }
  return Boolean(
    device.osVersion ||
      device.memoryGB !== undefined ||
      device.freeStorageGB !== undefined ||
      device.processor ||
      device.gpu,
  );
}

export function adobeDirectory() {
  const capabilities = getAllCapabilities()
    .map((capability) => {
      const product = getPublicProductById(capability.productId);
      if (!product) return null;
      return {
        capabilityId: capability.id,
        capabilityName: capability.name,
        productId: product.id,
        productName: product.name,
        description: capability.description,
        taskTypes: capability.taskTypes,
        inputs: capability.inputs,
        outputs: capability.outputs,
        compatibleNextCapabilities: capability.compatibleNextCapabilities,
        destinationUrl: capability.destinationUrl,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return {
    status: "ok" as const,
    data: {
      selectionHint: "Match the user's request against each capability's taskTypes and description. Pick the capability whose taskTypes most closely match the user's intent. Do not rely on general knowledge — use only the taskTypes and description fields below.",
      capabilities,
      dataSource: "public_reference_snapshot" as const,
    },
  };
}

export function findProductForTask(task?: string) {
  if (!task?.trim()) {
    return toolError("MISSING_REQUIRED_CONTEXT", "The task field is required.");
  }

  const rankedCapabilities = rankCapabilitiesForTask(task);
  if (rankedCapabilities.length === 0) {
    return toolError(
      "UNKNOWN_TASK",
      "No product recommendation is available for this task in the public reference catalog.",
    );
  }

  const recommendations = unique(rankedCapabilities.map((capability) => capability.productId))
    .slice(0, 3)
    .map((productId) => {
      const product = getPublicProductById(productId);
      const capability = rankedCapabilities.find((entry) => entry.productId === productId);
      if (!product || !capability) {
        return null;
      }
      return {
        productId: product.id,
        productName: product.name,
        capabilityId: capability.id,
        capabilityName: capability.name,
        why: capability.description,
        destinationUrl: product.destinationUrl,
        dataSource: product.dataSource,
      };
    })
    .filter((recommendation): recommendation is NonNullable<typeof recommendation> => recommendation !== null);

  if (recommendations.length === 0) {
    return toolError(
      "UNKNOWN_TASK",
      "No product recommendation is available for this task in the public reference catalog.",
    );
  }

  return {
    status: "ok",
    data: {
      task,
      recommendations,
      dataSource: "public_reference_snapshot" as const,
    },
  };
}

export function getProductCapabilities(productId?: string) {
  if (!productId?.trim()) {
    return toolError("MISSING_PRODUCT_ID", "The productId field is required.");
  }
  const product = getPublicProductById(productId);
  if (!product) {
    return toolError("UNKNOWN_PRODUCT", `Unknown productId: ${productId}`);
  }

  return {
    status: "ok",
    data: {
      productId: product.id,
      productName: product.name,
      destinationUrl: product.destinationUrl,
      capabilities: getCapabilitiesByProductId(product.id),
      dataSource: product.dataSource,
    },
  };
}

export function getProductSystemRequirements(productId?: string, platform?: string) {
  if (!productId?.trim()) {
    return toolError("MISSING_PRODUCT_ID", "The productId field is required.");
  }
  if (!platform?.trim()) {
    return toolError("MISSING_REQUIRED_CONTEXT", "The platform field is required.");
  }
  if (!hasKnownProduct(productId)) {
    return toolError("UNKNOWN_PRODUCT", `Unknown productId: ${productId}`);
  }
  if (!isSupportedPlatform(platform)) {
    return toolError(
      "UNSUPPORTED_PLATFORM",
      `Unsupported platform '${platform}'. Supported platforms: macos, windows, web, ios, android.`,
    );
  }

  const supportedPlatforms = getSupportedPlatformsForProduct(productId);
  if (!supportedPlatforms.includes(platform)) {
    return toolError(
      "UNSUPPORTED_PLATFORM",
      `No system requirements snapshot is available for ${productId} on ${platform}.`,
    );
  }

  const requirements = getSystemRequirements(productId, platform);
  if (!requirements) {
    return toolError(
      "UNSUPPORTED_PLATFORM",
      `No system requirements snapshot is available for ${productId} on ${platform}.`,
    );
  }

  return {
    status: "ok",
    data: requirements,
  };
}

export function checkDeviceCompatibility(
  productId?: string,
  platform?: string,
  device?: CompatibilityDeviceContext,
) {
  if (!productId?.trim()) {
    return toolError("MISSING_PRODUCT_ID", "The productId field is required.");
  }
  if (!platform?.trim()) {
    return toolError("MISSING_REQUIRED_CONTEXT", "The platform field is required.");
  }
  if (!hasKnownProduct(productId)) {
    return toolError("UNKNOWN_PRODUCT", `Unknown productId: ${productId}`);
  }
  if (!isSupportedPlatform(platform)) {
    return toolError(
      "UNSUPPORTED_PLATFORM",
      `Unsupported platform '${platform}'. Supported platforms: macos, windows, web, ios, android.`,
    );
  }

  if (!hasDeviceData(device)) {
    return toolError(
      "INSUFFICIENT_DEVICE_CONTEXT",
      "Device context is required to evaluate compatibility.",
    );
  }

  const requirements = getSystemRequirements(productId, platform);
  if (!requirements) {
    return toolError(
      "UNSUPPORTED_PLATFORM",
      `No system requirements snapshot is available for ${productId} on ${platform}.`,
    );
  }

  const checks: CompatibilityCheckResult[] = [];

  if (requirements.minimumMemoryGB === null) {
    checks.push({
      field: "memory",
      status: "unknown",
      message: "Memory requirement is unavailable in the current public reference snapshot.",
    });
  } else if (typeof device?.memoryGB === "number") {
    checks.push({
      field: "memory",
      status: device.memoryGB >= requirements.minimumMemoryGB ? "pass" : "fail",
      message: `Device memory: ${device.memoryGB}GB, minimum: ${requirements.minimumMemoryGB}GB.`,
    });
  } else {
    checks.push({
      field: "memory",
      status: "unknown",
      message: "Device memory is missing.",
    });
  }

  if (requirements.minimumStorageGB === null) {
    checks.push({
      field: "storage",
      status: "unknown",
      message: "Storage requirement is unavailable in the current public reference snapshot.",
    });
  } else if (typeof device?.freeStorageGB === "number") {
    checks.push({
      field: "storage",
      status: device.freeStorageGB >= requirements.minimumStorageGB ? "pass" : "fail",
      message: `Device free storage: ${device.freeStorageGB}GB, minimum: ${requirements.minimumStorageGB}GB.`,
    });
  } else {
    checks.push({
      field: "storage",
      status: "unknown",
      message: "Device free storage is missing.",
    });
  }

  const hasFailure = checks.some((check) => check.status === "fail");
  const hasUnknown = checks.some((check) => check.status === "unknown");
  const compatibility: boolean | "unknown" = hasFailure ? false : hasUnknown ? "unknown" : true;

  return {
    status: "ok",
    data: {
      productId,
      platform,
      compatibility,
      checks,
      sourceUrl: requirements.sourceUrl,
      dataSource: requirements.dataSource,
    },
  };
}
