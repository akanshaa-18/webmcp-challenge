import { HandoffContext, Mission, Surface } from "@/lib/types";

interface CreateHandoffInput {
  mission: Mission;
  fromSurface: Surface;
  toSurface: Surface;
  toolName: string;
  projectId: string;
  assetIds: string[];
  task: string;
  expectedResult: string;
  brandContext?: string;
  market?: string;
}

export function createHandoff(input: CreateHandoffInput): HandoffContext {
  return {
    handoffId: `h${Date.now().toString(36)}`,
    missionId: input.mission.id,
    fromSurface: input.fromSurface,
    toSurface: input.toSurface,
    toolName: input.toolName,
    projectId: input.projectId,
    assetIds: input.assetIds,
    userGoal: input.mission.goal,
    task: input.task,
    brandContext: input.brandContext,
    market: input.market,
    constraints: input.mission.constraints,
    previousSteps: input.mission.completedSteps,
    expectedResult: input.expectedResult,
  };
}

