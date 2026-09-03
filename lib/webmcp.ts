type ExecuteFn = {
  bivarianceHack(input: unknown): unknown | Promise<unknown>;
}["bivarianceHack"];

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: ExecuteFn;
}

interface WebMcpContext {
  registerTool: (
    tool: WebMcpTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ) => Promise<void> | void;
  unregisterTool?: (name: string) => void;
}

declare global {
  interface Document {
    modelContext?: WebMcpContext;
  }

  interface Navigator {
    modelContext?: WebMcpContext;
  }
}

export function getModelContext(): WebMcpContext | null {
  if (typeof document === "undefined" || typeof navigator === "undefined") {
    return null;
  }

  return document.modelContext ?? navigator.modelContext ?? null;
}
