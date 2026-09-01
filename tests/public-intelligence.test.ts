import { describe, expect, it } from "vitest";
import {
  checkDeviceCompatibility,
  findProductForTask,
  getProductCapabilities,
  getProductSystemRequirements,
} from "@/lib/public-intelligence";

describe("public intelligence tools", () => {
  it("finds Firefly for background tasks", () => {
    const result = findProductForTask("Which Adobe app should I use to remove a background?");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.data.recommendations[0]?.productId).toBe("firefly");
  });

  it("finds Express for Instagram post tasks", () => {
    const result = findProductForTask("I need to make an Instagram post");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.data.recommendations[0]?.productId).toBe("express");
  });

  it("finds Premiere Pro for video editing tasks", () => {
    const result = findProductForTask("What should I use to edit video?");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.data.recommendations[0]?.productId).toBe("premiere-pro");
  });

  it("returns product capabilities from structured catalog data", () => {
    const result = getProductCapabilities("firefly");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.data.capabilities.length).toBeGreaterThan(0);
    expect(result.data.destinationUrl).toContain("firefly.adobe.com");
  });

  it("returns structured errors for unknown products", () => {
    const capabilities = getProductCapabilities("unknown-product");
    expect(capabilities.status).toBe("error");
    if (!("code" in capabilities)) {
      return;
    }
    expect(capabilities.code).toBe("UNKNOWN_PRODUCT");

    const requirements = getProductSystemRequirements("unknown-product", "macos");
    expect(requirements.status).toBe("error");
    if (!("code" in requirements)) {
      return;
    }
    expect(requirements.code).toBe("UNKNOWN_PRODUCT");
  });

  it("returns structured errors for unsupported platform", () => {
    const result = getProductSystemRequirements("premiere-pro", "linux");
    expect(result.status).toBe("error");
    if (!("code" in result)) {
      return;
    }
    expect(result.code).toBe("UNSUPPORTED_PLATFORM");
  });

  it("returns unknown compatibility when requirements are unavailable", () => {
    const result = checkDeviceCompatibility("premiere-pro", "macos", {
      osVersion: "14.0",
      memoryGB: 32,
      freeStorageGB: 200,
    });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.data.compatibility).toBe("unknown");
    expect(result.data.checks.some((check) => check.status === "unknown")).toBe(true);
    expect(result.data.dataSource).toBe("public_reference_snapshot");
  });

  it("returns structured error when device context is missing", () => {
    const result = checkDeviceCompatibility("premiere-pro", "macos");
    expect(result.status).toBe("error");
    if (!("code" in result)) {
      return;
    }
    expect(result.code).toBe("INSUFFICIENT_DEVICE_CONTEXT");
  });
});
