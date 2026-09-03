import { describe, expect, it } from "vitest";
import { adobeDirectory } from "@/lib/public-intelligence";

describe("adobeDirectory", () => {
  it("returns ok status with a non-empty capabilities array", () => {
    const result = adobeDirectory();
    expect(result.status).toBe("ok");
    expect(result.data.capabilities.length).toBeGreaterThan(0);
  });

  it("each capability has required fields", () => {
    const result = adobeDirectory();
    for (const cap of result.data.capabilities) {
      expect(cap.capabilityId).toBeTruthy();
      expect(cap.capabilityName).toBeTruthy();
      expect(cap.productId).toBeTruthy();
      expect(cap.productName).toBeTruthy();
      expect(cap.description).toBeTruthy();
      expect(Array.isArray(cap.taskTypes)).toBe(true);
      expect(Array.isArray(cap.compatibleNextCapabilities)).toBe(true);
      expect(cap.destinationUrl).toBeTruthy();
    }
  });

  it("includes capabilities from all major Adobe products", () => {
    const result = adobeDirectory();
    const productIds = new Set(result.data.capabilities.map((c) => c.productId));
    expect(productIds.has("firefly")).toBe(true);
    expect(productIds.has("photoshop")).toBe(true);
    expect(productIds.has("express")).toBe(true);
    expect(productIds.has("premiere-pro")).toBe(true);
    expect(productIds.has("acrobat")).toBe(true);
    expect(productIds.has("indesign")).toBe(true);
  });

  it("firefly-background-transformation has Express continuations", () => {
    const result = adobeDirectory();
    const cap = result.data.capabilities.find((c) => c.capabilityId === "firefly-background-transformation");
    expect(cap).toBeDefined();
    expect(cap?.compatibleNextCapabilities.length).toBeGreaterThan(0);
  });

  it("acrobat-e-signature is present with e-signature task types", () => {
    const result = adobeDirectory();
    const cap = result.data.capabilities.find((c) => c.capabilityId === "acrobat-e-signature");
    expect(cap).toBeDefined();
    expect(cap?.taskTypes).toContain("sign document");
  });

  it("dataSource is public_reference_snapshot", () => {
    const result = adobeDirectory();
    expect(result.data.dataSource).toBe("public_reference_snapshot");
  });
});
