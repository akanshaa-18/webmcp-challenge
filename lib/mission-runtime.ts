import { CreativeFile, DeletionApprovalRequest, HandoffContext, Mission, Surface } from "@/lib/types";

export interface MissionRuntime {
  mission: Mission;
  files: CreativeFile[];
  handoffs: Record<string, HandoffContext>;
  deletionApprovals: Record<string, DeletionApprovalRequest>;
  currentAsset: CreativeFile | undefined;
  getHandoff: (handoffId: string) => HandoffContext | null;
  addDeletionApproval: (approval: DeletionApprovalRequest) => void;
  approveDeletionApproval: (confirmationId: string) => void;
  removeDeletionApproval: (confirmationId: string) => void;
  removeFile: (fileId: string) => void;
  createAndStoreHandoff: (input: {
    fromSurface: Surface;
    toSurface: Surface;
    toolName: string;
    projectId: string;
    assetIds: string[];
    task: string;
    expectedResult: string;
    brandContext?: string;
    market?: string;
  }) => HandoffContext;
  completeStep: (step: string, currentAssetId?: string) => void;
  setCurrentStep: (step: string) => void;
  upsertFile: (file: CreativeFile) => void;
  setMission: (mission: Mission) => void;
  resetDemo: () => void;
}

let runtime: MissionRuntime | null = null;

export function setMissionRuntime(nextRuntime: MissionRuntime) {
  runtime = nextRuntime;
}

export function getMissionRuntime() {
  return runtime;
}
