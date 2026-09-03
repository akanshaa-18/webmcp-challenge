import { ToolError } from "@/lib/types";

export function toolError(code: string, message: string): ToolError {
  return { status: "error", code, message };
}

