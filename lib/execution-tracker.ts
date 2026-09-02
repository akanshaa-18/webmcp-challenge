import { getMissionRuntime } from "@/lib/mission-runtime";
import { ExecutionEvent } from "@/lib/types";

export function trackToolExecution(toolName: string) {
  const runtime = getMissionRuntime();
  if (!runtime) return { recordSuccess: () => {}, recordError: () => {} };

  const order = runtime.intentPassport.executionHistory.length + 1;
  const startedAt = new Date().toISOString();

  const recordSuccess = (summary?: string) => {
    const runtime = getMissionRuntime();
    if (!runtime) return;

    const event: ExecutionEvent = {
      toolName,
      order,
      status: "success",
      startedAt,
      completedAt: new Date().toISOString(),
      summary: summary || `${toolName} completed successfully`,
    };

    runtime.updateIntentPassport((passport) => ({
      ...passport,
      executionHistory: [...passport.executionHistory, event],
    }));
  };

  const recordError = (errorCode: string, errorMessage: string) => {
    const runtime = getMissionRuntime();
    if (!runtime) return;

    const event: ExecutionEvent = {
      toolName,
      order,
      status: "error",
      startedAt,
      completedAt: new Date().toISOString(),
      errorCode,
      errorMessage,
      summary: `${toolName} failed: ${errorMessage}`,
    };

    runtime.updateIntentPassport((passport) => ({
      ...passport,
      executionHistory: [...passport.executionHistory, event],
    }));
  };

  return { recordSuccess, recordError };
}
