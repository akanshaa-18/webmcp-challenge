export type Surface = "CC Home" | "Project" | "Firefly" | "Express" | "Adobe Plans";

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

export interface HandoffContext {
  handoffId: string;
  missionId: string;
  fromSurface: Surface;
  toSurface: Surface;
  toolName: string;
  projectId: string;
  assetIds: string[];
  userGoal: string;
  task: string;
  brandContext?: string;
  market?: string;
  constraints: Mission["constraints"];
  previousSteps: string[];
  expectedResult: string;
}

export interface ToolManifest {
  toolName: string;
  ownerSurface: Surface;
  description: string;
  inputSchema: Record<string, unknown>;
  requiredContext: string[];
  destinationRoute: string;
  executionMode: "global-discovery" | "local-execution";
  readOnly: boolean;
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
