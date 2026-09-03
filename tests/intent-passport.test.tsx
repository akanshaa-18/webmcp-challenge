// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MissionProvider } from "@/components/mission-provider";
import { CCHomeSurface } from "@/components/surfaces/cc-home-surface";
import { getMissionRuntime } from "@/lib/mission-runtime";
import { WebMcpTool } from "@/lib/webmcp";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const pushSpy = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
  usePathname: () => "/project/kaftan",
}));

function Harness() {
  return (
    <MissionProvider>
      <CCHomeSurface route="/project/kaftan" surface="Project" />
    </MissionProvider>
  );
}

function registerTools() {
  const tools = new Map<string, WebMcpTool>();
  Object.defineProperty(document, "modelContext", {
    value: {
      registerTool: (tool: WebMcpTool) => {
        tools.set(tool.name, tool);
      },
      unregisterTool: (name: string) => {
        tools.delete(name);
      },
    },
    configurable: true,
  });
  return tools;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function invokeTool(tools: Map<string, WebMcpTool>, name: string, input?: unknown) {
  const tool = tools.get(name);
  if (!tool) {
    throw new Error(`Tool not registered: ${name}`);
  }
  let result: unknown;
  await act(async () => {
    result = await tool.execute(input);
  });
  return result as { status: string; data?: Record<string, unknown> };
}

describe("intent passport transition", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    pushSpy.mockClear();
  });

  it("initializes and persists intent passport in sessionStorage", async () => {
    const tools = registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness />);
    });
    await flush();

    const runtime = getMissionRuntime();
    expect(runtime?.intentPassport.id).toBeDefined();
    expect(runtime?.intentPassport.userGoal.length).toBeGreaterThan(0);

    await act(async () => {
      runtime?.updateIntentPassport((passport) => ({
        ...passport,
        userGoal: "Need an Adobe workflow for plan selection and social post creation",
        requirements: ["plan recommendation", "social adaptation"],
      }));
    });

    await act(async () => {
      root.unmount();
    });

    const nextRoot = createRoot(container);
    await act(async () => {
      nextRoot.render(<Harness />);
    });
    await flush();

    const resumedRuntime = getMissionRuntime();
    expect(resumedRuntime?.intentPassport.userGoal).toContain("Adobe workflow");
    expect(resumedRuntime?.intentPassport.requirements).toEqual(
      expect.arrayContaining(["plan recommendation", "social adaptation"]),
    );
    expect(tools.has("get_current_adobe_context")).toBe(true);

    await act(async () => {
      nextRoot.unmount();
    });
  });

  it("get_current_adobe_context returns public intent context", async () => {
    const tools = registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Harness />);
    });
    await flush();

    const result = await invokeTool(tools, "get_current_adobe_context");
    expect(result.status).toBe("ok");
    expect(result.data?.intent).toBeDefined();
    expect(result.data?.mission).toBeUndefined();
    expect(result.data?.files).toBeUndefined();
    expect(result.data?.project).toBeUndefined();

    await act(async () => {
      root.unmount();
    });
  });

  it("resume_workflow works even when private file state is absent", async () => {
    const tools = registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Harness />);
    });
    await flush();

    const runtime = getMissionRuntime();
    const ids = runtime?.files.map((file) => file.id) ?? [];
    await act(async () => {
      ids.forEach((id) => runtime?.removeFile(id));
    });
    expect(getMissionRuntime()?.files).toHaveLength(0);

    const resumed = await invokeTool(tools, "resume_workflow");
    expect(resumed.status).toBe("ok");
    expect(resumed.data?.destinationRoute).toBe("/project/kaftan");
    expect(pushSpy).toHaveBeenCalledWith("/project/kaftan");

    await act(async () => {
      root.unmount();
    });
  });

  it("updates intent passport from public intelligence tools", async () => {
    const tools = registerTools();
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Harness />);
    });
    await flush();

    const directory = await invokeTool(tools, "adobe_directory");
    expect(directory.status).toBe("ok");

    const capabilities = await invokeTool(tools, "get_product_capabilities", {
      productId: "firefly",
    });
    expect(capabilities.status).toBe("ok");

    const runtime = getMissionRuntime();
    expect(runtime?.intentPassport.discoveredCapabilities).toContain("public.get_product_capabilities");
    expect(runtime?.intentPassport.selectedProducts).toContain("firefly");
    expect(runtime?.intentPassport.selectedDestination).toBe("https://firefly.adobe.com/");

    await act(async () => {
      root.unmount();
    });
  });
});
