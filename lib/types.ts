export type Surface =
  | "CC Home"
  | "Project"
  | "Firefly"
  | "Express"
  | "Adobe Plans"
  | "Adobe Agentic Front Door"
  | "Global";

export interface UserFixture {
  name: string;
  region: string;
  city: string;
  student: boolean;
}

export interface ProjectFixture {
  id: string;
  name: string;
}

export interface CreativeFile {
  id: string;
  name: string;
  type: string;
  size: number;
  hash: string;
  modifiedAt: string;
  approved: boolean;
  projectId: string;
}

export interface DeletionApprovalRequest {
  confirmationId: string;
  fileId: string;
  reason: string;
  candidateFileIds: string[];
  createdAt: string;
  approvedByHuman: boolean;
  approvedAt?: string;
}

export interface Plan {
  id: string;
  name: string;
  region: string;
  audience: string;
  price: number;
  currency: string;
  billingPeriod: string;
  includedApps: string[];
  capabilities: string[];
  generativeCredits: number;
  studentEligible: boolean;
}

export interface Mission {
  id: string;
  goal: string;
  projectId: string;
  originalPrompt: string;
  constraints: {
    noPurchaseWithoutApproval: boolean;
    noDestructiveActionWithoutApproval: boolean;
    noSubjectiveCreativeDecisionWithoutApproval: boolean;
  };
  completedSteps: string[];
  currentStep: string;
  currentAssetId: string;
  handoffHistory: string[];
}

export interface IntentPassport {
  id: string;
  userGoal: string;
  region?: string;
  audience?: string;
  requirements: string[];
  discoveredCapabilities: string[];
  selectedProducts: string[];
  selectedWorkflowId?: string;
  selectedWorkflowStep?: string;
  recommendedWorkflow?: string;
  selectedDestination?: string;
  handoffTrail: string[];
  userConstraints?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HandoffContext {
  handoffId: string;
  missionId?: string;
  intentPassportId?: string;
  fromSurface: Surface;
  toSurface: Surface;
  toolName: string;
  projectId?: string;
  assetIds?: string[];
  userGoal: string;
  task: string;
  requirements?: string[];
  discoveredCapabilities?: string[];
  selectedWorkflowId?: string;
  selectedWorkflowStep?: string;
  selectedDestination?: string;
  userConstraints?: string[];
  brandContext?: string;
  market?: string;
  constraints?: Mission["constraints"];
  previousSteps?: string[];
  expectedResult: string;
}

export interface ToolManifest {
  toolName: string;
  ownerSurface: Surface;
  description: string;
  inputSchema: Record<string, unknown>;
  requiredContext: string[];
  destinationRoute?: string;
  destinationUrl?: string;
  executionMode: "global-discovery" | "local-execution";
  readOnly: boolean;
  audience: "public" | "legacy-private";
}

export interface ToolError {
  status: "error";
  code: string;
  message: string;
}

export interface ToolSuccess<T> {
  status: "ok";
  data: T;
}

export type ToolResult<T> = ToolSuccess<T> | ToolError;
