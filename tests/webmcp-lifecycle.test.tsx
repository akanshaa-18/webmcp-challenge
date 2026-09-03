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
  it("registers tools with AbortSignal and aborts on unmount", async () => {
    const registerTool = vi.fn(async (...args: unknown[]) => {
      void args;
      return undefined;
    });
    const capturedSignals: AbortSignal[] = [];

    Object.defineProperty(document, "modelContext", {
      value: {
        registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => {
          if (options?.signal) {
            capturedSignals.push(options.signal);
          }
          return registerTool(tool, options);
        },
      },
      configurable: true,
    });

    const container = document.createElement("div");
    const root = createRoot(container);
    const tools: WebMcpTool[] = [
      {
        name: "change_background",
        description: "Tool one",
        annotations: { readOnlyHint: false },
        inputSchema: { type: "object", properties: { handoffId: { type: "string" } } },
        execute: () => ({ status: "ok" }),
      },
      {
        name: "create_business_card",
        description: "Tool two",
        annotations: { readOnlyHint: false },
        inputSchema: { type: "object", properties: { handoffId: { type: "string" } } },
        execute: () => ({ status: "ok" }),
      },
    ];

    await act(async () => {
      root.render(<RegisterTools tools={tools} />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "change_background" }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "create_business_card" }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(capturedSignals.length).toBe(2);
    expect(capturedSignals.every((signal) => !signal.aborted)).toBe(true);

    await act(async () => {
      root.unmount();
    });

    expect(capturedSignals.every((signal) => signal.aborted)).toBe(true);
  });

  it("optionally calls unregisterTool when supported by host", async () => {
    const registerTool = vi.fn(async (...args: unknown[]) => {
      void args;
      return undefined;
    });
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

    expect(unregisterTool).toHaveBeenCalledTimes(4);
  });
});
