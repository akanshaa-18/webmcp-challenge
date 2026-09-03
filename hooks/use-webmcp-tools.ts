"use client";

import { useEffect, useMemo, useState } from "react";
import { getModelContext, WebMcpTool } from "@/lib/webmcp";

interface ToolRegistrationState {
  available: boolean;
  registeredTools: string[];
}

export function useWebMcpTools(tools: WebMcpTool[]): ToolRegistrationState {
  const modelContext = useMemo(() => getModelContext(), []);
  const [state, setState] = useState<ToolRegistrationState>({
    available: Boolean(modelContext),
    registeredTools: [],
  });

  useEffect(() => {
    if (!modelContext) {
      return;
    }
    const activeModelContext = modelContext;

    let cancelled = false;
    const controllers: AbortController[] = [];

    async function registerTools() {
      for (const tool of tools) {
        const controller = new AbortController();
        controllers.push(controller);
        await activeModelContext.registerTool(tool, { signal: controller.signal });
      }

      if (!cancelled) {
        setState({ available: true, registeredTools: tools.map((tool) => tool.name) });
      }
    }

    registerTools().catch(() => {
      if (!cancelled) {
        setState({ available: false, registeredTools: [] });
      }
    });

    return () => {
      cancelled = true;
      for (const controller of controllers) {
        controller.abort();
      }
      if (typeof activeModelContext.unregisterTool === "function") {
        for (const tool of tools) {
          activeModelContext.unregisterTool(tool.name);
        }
      }
    };
  }, [modelContext, tools]);

  return state;
}
