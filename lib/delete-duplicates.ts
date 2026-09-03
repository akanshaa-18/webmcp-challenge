import { detectDuplicates, getSafeDeletionCandidates } from "@/lib/duplicate-detection";
import { CreativeFile, DeletionApprovalRequest, Mission } from "@/lib/types";
import { toolError } from "@/lib/errors";

function buildReason(file: CreativeFile): string {
  return `File ${file.name} is an exact duplicate by hash and is unapproved while a protected/approved equivalent exists.`;
}

function addStep(mission: Mission, step: string): Mission {
  if (mission.completedSteps.includes(step)) {
    return mission;
  }
  return {
    ...mission,
    completedSteps: [...mission.completedSteps, step],
  };
}

export function resolveDuplicateDeletion(input: {
  mission: Mission;
  files: CreativeFile[];
  fileId: string;
  confirmationId?: string;
  pendingApprovals: Record<string, DeletionApprovalRequest>;
}) {
  const file = input.files.find((item) => item.id === input.fileId);
  if (!file) {
    return { result: toolError("INVALID_ASSET", `Unknown file ID: ${input.fileId}`) };
  }

  const duplicateResult = detectDuplicates(input.files);
  const safeDeletionCandidates = getSafeDeletionCandidates(duplicateResult);
  if (!safeDeletionCandidates.includes(input.fileId)) {
    return {
      result: toolError(
        "NOT_SAFE_DUPLICATE",
        "This file is not a safe duplicate candidate for automatic deletion.",
      ),
    };
  }

  const existingApproval = Object.values(input.pendingApprovals).find(
    (approval) => approval.fileId === input.fileId,
  );
  const confirmationId =
    existingApproval?.confirmationId ??
    `approve-delete-${input.fileId}-${Date.now().toString(36)}`;
  const approvalRequest =
    existingApproval ??
    ({
      confirmationId,
      fileId: input.fileId,
      reason: buildReason(file),
      candidateFileIds: safeDeletionCandidates,
      createdAt: new Date().toISOString(),
      approvedByHuman: false,
    } satisfies DeletionApprovalRequest);

  if (input.confirmationId && input.confirmationId !== approvalRequest.confirmationId) {
    return {
      result: toolError(
        "INVALID_CONFIRMATION",
        "Provided confirmationId does not match the pending approval for this file.",
      ),
    };
  }

  if (!input.confirmationId || !approvalRequest.approvedByHuman) {
    return {
      approvalRequest,
      result: {
        status: "confirmation_required" as const,
        data: {
          confirmationId: approvalRequest.confirmationId,
          fileId: approvalRequest.fileId,
          candidateFileIds: approvalRequest.candidateFileIds,
          protectedFileIds: duplicateResult.protectedFiles,
          reason: approvalRequest.reason,
          requiredApproval: {
            approvedViaUi: true,
            confirmationId: approvalRequest.confirmationId,
          },
        },
      },
    };
  }

  const nextFiles = input.files.filter((item) => item.id !== input.fileId);
  let nextMission = addStep(input.mission, "delete_duplicate_file");
  nextMission = {
    ...nextMission,
    currentAssetId:
      input.mission.currentAssetId === input.fileId
        ? nextFiles[0]?.id ?? input.mission.currentAssetId
        : input.mission.currentAssetId,
  };

  const hasCreativeSteps =
    nextMission.completedSteps.includes("change_background") &&
    nextMission.completedSteps.includes("create_business_card");
  if (hasCreativeSteps) {
    nextMission = addStep(nextMission, "mission_complete");
    nextMission = { ...nextMission, currentStep: "mission_complete" };
  } else {
    nextMission = { ...nextMission, currentStep: "delete_duplicate_file" };
  }

  return {
    consumedConfirmationId: approvalRequest.confirmationId,
    nextFiles,
    nextMission,
    result: {
      status: "ok" as const,
      data: {
        deletedFileId: input.fileId,
        deletedFileName: file.name,
        confirmationId: approvalRequest.confirmationId,
        missionStep: nextMission.currentStep,
      },
    },
  };
}
