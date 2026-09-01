import { HandoffContext, Mission, Surface } from "@/lib/types";

interface CreateHandoffInput {
  mission?: Mission;
  intentPassportId?: string;
  fromSurface: Surface;
  toSurface: Surface;
  toolName: string;
  projectId?: string;
  assetIds?: string[];
  task: string;
  expectedResult: string;
  userGoal?: string;
  requirements?: string[];
  discoveredCapabilities?: string[];
  selectedWorkflowId?: string;
  selectedWorkflowStep?: string;
  selectedDestination?: string;
  userConstraints?: string[];
  brandContext?: string;
  market?: string;
}

export function createHandoff(input: CreateHandoffInput): HandoffContext {
  return {
    handoffId: `h${Date.now().toString(36)}`,
    missionId: input.mission?.id,
    intentPassportId: input.intentPassportId,
    fromSurface: input.fromSurface,
    toSurface: input.toSurface,
    toolName: input.toolName,
    projectId: input.projectId,
    assetIds: input.assetIds,
    userGoal: input.userGoal ?? input.mission?.goal ?? input.task,
    task: input.task,
    requirements: input.requirements,
    discoveredCapabilities: input.discoveredCapabilities,
    selectedWorkflowId: input.selectedWorkflowId,
    selectedWorkflowStep: input.selectedWorkflowStep,
    selectedDestination: input.selectedDestination,
    userConstraints: input.userConstraints,
    brandContext: input.brandContext,
    market: input.market,
    constraints: input.mission?.constraints,
    previousSteps: input.mission?.completedSteps,
    expectedResult: input.expectedResult,
  };
}
