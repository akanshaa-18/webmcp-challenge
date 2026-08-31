// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { WebMcpTool } from "@/lib/webmcp";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function RegisterTools({ tools }: { tools: WebMcpTool[] }) {
  useWebMcpTools(tools);
  return null;
}

describe("route-local WebMCP lifecycle", () => {
  it("registers and unregisters change_background for Firefly lifecycle", async () => {
    const registerTool = vi.fn(async () => undefined);
    const unregisterTool = vi.fn();

    Object.defineProperty(document, "modelContext", {
      value: { registerTool, unregisterTool },
      configurable: true,
    });

    const container = document.createElement("div");
    const root = createRoot(container);
    const fireflyTools: WebMcpTool[] = [
      {
        name: "change_background",
        description: "Firefly local tool",
        annotations: { readOnlyHint: false },
        inputSchema: { type: "object", properties: { handoffId: { type: "string" } } },
        execute: () => ({ status: "ok" }),
      },
    ];

    await act(async () => {
      root.render(<RegisterTools tools={fireflyTools} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "change_background" }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    await act(async () => {
      root.unmount();
    });

    expect(unregisterTool).toHaveBeenCalledWith("change_background");
  });

  it("registers and unregisters create_business_card for Express lifecycle", async () => {
    const registerTool = vi.fn(async () => undefined);
    const unregisterTool = vi.fn();

    Object.defineProperty(document, "modelContext", {
      value: { registerTool, unregisterTool },
      configurable: true,
    });

    const container = document.createElement("div");
    const root = createRoot(container);
    const expressTools: WebMcpTool[] = [
      {
        name: "create_business_card",
        description: "Express local tool",
        annotations: { readOnlyHint: false },
        inputSchema: { type: "object", properties: { handoffId: { type: "string" } } },
        execute: () => ({ status: "ok" }),
      },
    ];

    await act(async () => {
      root.render(<RegisterTools tools={expressTools} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "create_business_card" }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    await act(async () => {
      root.unmount();
    });

    expect(unregisterTool).toHaveBeenCalledWith("create_business_card");
  });

  it("registers and unregisters plans local tools for Plans lifecycle", async () => {
    const registerTool = vi.fn(async () => undefined);
    const unregisterTool = vi.fn();

    Object.defineProperty(document, "modelContext", {
      value: { registerTool, unregisterTool },
      configurable: true,
    });

    const container = document.createElement("div");
    const root = createRoot(container);
    const plansTools: WebMcpTool[] = [
      { name: "get_regional_plans", description: "Plans tool", annotations: { readOnlyHint: true }, execute: () => ({ status: "ok" }) },
      { name: "get_plan_capabilities", description: "Plans tool", annotations: { readOnlyHint: true }, execute: () => ({ status: "ok" }) },
      { name: "get_plan_price", description: "Plans tool", annotations: { readOnlyHint: true }, execute: () => ({ status: "ok" }) },
      { name: "compare_plan_options", description: "Plans tool", annotations: { readOnlyHint: true }, execute: () => ({ status: "ok" }) },
    ];

    await act(async () => {
      root.render(<RegisterTools tools={plansTools} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "get_regional_plans" }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "get_plan_capabilities" }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "get_plan_price" }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "compare_plan_options" }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    await act(async () => {
      root.unmount();
    });

    expect(unregisterTool).toHaveBeenCalledWith("get_regional_plans");
    expect(unregisterTool).toHaveBeenCalledWith("get_plan_capabilities");
    expect(unregisterTool).toHaveBeenCalledWith("get_plan_price");
    expect(unregisterTool).toHaveBeenCalledWith("compare_plan_options");
  });
});
