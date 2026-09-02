import { getMissionRuntime } from "@/lib/mission-runtime";
import { ExecutionEvent } from "@/lib/types";

export function trackToolExecution(toolName: string) {
  const runtime = getMissionRuntime();
  if (!runtime) return { recordSuccess: () => {}, recordError: () => {} };

  const order = runtime.intentPassport.executionHistory.length + 1;
  const startedAt = new Date().toISOString();

  // Create and immediately persist "running" event
  const runningEvent: ExecutionEvent = {
    toolName,
    order,
    status: "running",
    startedAt,
    summary: `${toolName} running…`,
  };

  runtime.updateIntentPassport((passport) => ({
    ...passport,
    executionHistory: [...passport.executionHistory, runningEvent],
  }));

  const recordSuccess = (summary?: string) => {
    const runtime = getMissionRuntime();
    if (!runtime) return;

    const completedAt = new Date().toISOString();
    const successEvent: ExecutionEvent = {
      toolName,
      order,
      status: "success",
      startedAt,
      completedAt,
      summary: summary || `${toolName} completed successfully`,
    };

    // Update the running event to success (replace, not append)
    runtime.updateIntentPassport((passport) => ({
      ...passport,
      executionHistory: passport.executionHistory.map((evt) =>
        evt.order === order ? successEvent : evt
      ),
    }));
  };

  const recordError = (errorCode: string, errorMessage: string) => {
    const runtime = getMissionRuntime();
    if (!runtime) return;

    const completedAt = new Date().toISOString();
    const errorEvent: ExecutionEvent = {
      toolName,
      order,
      status: "error",
      startedAt,
      completedAt,
      errorCode,
      errorMessage,
      summary: `${toolName} failed: ${errorMessage}`,
    };

    // Update the running event to error (replace, not append)
    runtime.updateIntentPassport((passport) => ({
      ...passport,
      executionHistory: passport.executionHistory.map((evt) =>
        evt.order === order ? errorEvent : evt
      ),
    }));
  };

  return { recordSuccess, recordError };
}
