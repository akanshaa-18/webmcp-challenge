import { describe, expect, it } from "vitest";
import { detectDuplicates, getSafeDeletionCandidates } from "@/lib/duplicate-detection";
import { resolveDuplicateDeletion } from "@/lib/delete-duplicates";
import { creativeFilesFixture, seededMission } from "@/lib/fixtures";

describe("duplicate detection", () => {
  it("classifies exact duplicates and keeps v2 as similar version", () => {
    const result = detectDuplicates(creativeFilesFixture);
    expect(result.exactDuplicates).toHaveLength(1);
    expect(result.exactDuplicates[0].fileIds).toEqual(
      expect.arrayContaining(["kaftan-logo-final", "kaftan-logo-copy"]),
    );
    expect(result.similarVersions[0].fileIds).toEqual(
      expect.arrayContaining(["kaftan-logo-final", "kaftan-logo-copy", "kaftan-logo-v2"]),
    );
  });

  it("protects approved files from safe deletion candidates", () => {
    const result = detectDuplicates(creativeFilesFixture);
    const safe = getSafeDeletionCandidates(result);
    expect(result.protectedFiles).toContain("kaftan-logo-final");
    expect(safe).toContain("kaftan-logo-copy");
    expect(safe).not.toContain("kaftan-logo-final");
    expect(safe).not.toContain("kaftan-logo-v2");
  });
});

describe("duplicate deletion approval flow", () => {
  it("requires confirmation before deletion", () => {
    const result = resolveDuplicateDeletion({
      mission: seededMission,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-copy",
      pendingApprovals: {},
    });

    expect(result.result.status).toBe("confirmation_required");
    expect(result.approvalRequest?.fileId).toBe("kaftan-logo-copy");
    expect(result.approvalRequest?.approvedByHuman).toBe(false);
  });

  it("fails before human UI approval even with confirmationId", () => {
    const firstCall = resolveDuplicateDeletion({
      mission: seededMission,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-copy",
      pendingApprovals: {},
    });
    const confirmationId = firstCall.approvalRequest?.confirmationId;
    if (!confirmationId || !firstCall.approvalRequest) {
      throw new Error("Expected pending approval.");
    }

    const retryWithoutUiApproval = resolveDuplicateDeletion({
      mission: seededMission,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-copy",
      confirmationId,
      pendingApprovals: {
        [confirmationId]: firstCall.approvalRequest,
      },
    });

    expect(retryWithoutUiApproval.result.status).toBe("confirmation_required");
  });

  it("does not allow tool input self-asserted approval bypass", () => {
    const firstCall = resolveDuplicateDeletion({
      mission: seededMission,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-copy",
      pendingApprovals: {},
    });
    const confirmationId = firstCall.approvalRequest?.confirmationId;
    if (!confirmationId || !firstCall.approvalRequest) {
      throw new Error("Expected pending approval.");
    }

    const bypassAttempt = resolveDuplicateDeletion({
      mission: seededMission,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-copy",
      confirmationId,
      pendingApprovals: {
        [confirmationId]: firstCall.approvalRequest,
      },
      // Simulates an agent trying to smuggle extra approval-like fields in tool input.
      approvedBy: "Meera",
    } as unknown as Parameters<typeof resolveDuplicateDeletion>[0]);

    expect(bypassAttempt.result.status).toBe("confirmation_required");
  });

  it("deletes only after persisted UI approval and marks mission complete", () => {
    const missionWithCreativeSteps = {
      ...seededMission,
      completedSteps: ["change_background", "create_business_card"],
      currentStep: "Resume workflow",
    };

    const firstCall = resolveDuplicateDeletion({
      mission: missionWithCreativeSteps,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-copy",
      pendingApprovals: {},
    });

    const confirmationId = firstCall.approvalRequest?.confirmationId;
    expect(confirmationId).toBeDefined();
    if (!confirmationId || !firstCall.approvalRequest) {
      throw new Error("Expected confirmation request for approved duplicate.");
    }

    const secondCallWithoutUiApproval = resolveDuplicateDeletion({
      mission: missionWithCreativeSteps,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-copy",
      pendingApprovals: {
        [confirmationId]: firstCall.approvalRequest,
      },
      confirmationId,
    });
    expect(secondCallWithoutUiApproval.result.status).toBe("confirmation_required");

    const secondCallWithUiApproval = resolveDuplicateDeletion({
      mission: missionWithCreativeSteps,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-copy",
      pendingApprovals: {
        [confirmationId]: {
          ...firstCall.approvalRequest,
          approvedByHuman: true,
          approvedAt: "2026-08-31T18:00:00.000Z",
        },
      },
      confirmationId,
    });

    expect(secondCallWithUiApproval.result.status).toBe("ok");
    expect(secondCallWithUiApproval.nextFiles?.some((file) => file.id === "kaftan-logo-copy")).toBe(
      false,
    );
    expect(secondCallWithUiApproval.nextMission?.completedSteps).toContain("mission_complete");
    expect(secondCallWithUiApproval.nextMission?.currentStep).toBe("mission_complete");
  });

  it("approval only applies to the intended file and cannot be reused", () => {
    const firstCall = resolveDuplicateDeletion({
      mission: seededMission,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-copy",
      pendingApprovals: {},
    });
    const confirmationId = firstCall.approvalRequest?.confirmationId;
    if (!confirmationId || !firstCall.approvalRequest) {
      throw new Error("Expected pending approval.");
    }

    const wrongFileAttempt = resolveDuplicateDeletion({
      mission: seededMission,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-v2",
      pendingApprovals: {
        [confirmationId]: {
          ...firstCall.approvalRequest,
          approvedByHuman: true,
          approvedAt: "2026-08-31T18:00:00.000Z",
        },
      },
      confirmationId,
    });
    expect(wrongFileAttempt.result.status).toBe("error");

    const wrongConfirmationAttempt = resolveDuplicateDeletion({
      mission: seededMission,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-copy",
      pendingApprovals: {
        [confirmationId]: {
          ...firstCall.approvalRequest,
          approvedByHuman: true,
          approvedAt: "2026-08-31T18:00:00.000Z",
        },
      },
      confirmationId: "approve-delete-kaftan-logo-copy-invalid",
    });
    expect(wrongConfirmationAttempt.result.status).toBe("error");

    const successfulDeletion = resolveDuplicateDeletion({
      mission: seededMission,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-copy",
      pendingApprovals: {
        [confirmationId]: {
          ...firstCall.approvalRequest,
          approvedByHuman: true,
          approvedAt: "2026-08-31T18:00:00.000Z",
        },
      },
      confirmationId,
    });
    expect(successfulDeletion.result.status).toBe("ok");

    const reuseAttempt = resolveDuplicateDeletion({
      mission: seededMission,
      files: successfulDeletion.nextFiles ?? creativeFilesFixture,
      fileId: "kaftan-logo-copy",
      pendingApprovals: {},
      confirmationId,
    });
    expect(reuseAttempt.result.status).toBe("error");
  });

  it("refuses deletion for protected or distinct files", () => {
    const protectedAttempt = resolveDuplicateDeletion({
      mission: seededMission,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-final",
      pendingApprovals: {},
    });
    expect(protectedAttempt.result.status).toBe("error");

    const distinctVersionAttempt = resolveDuplicateDeletion({
      mission: seededMission,
      files: creativeFilesFixture,
      fileId: "kaftan-logo-v2",
      pendingApprovals: {},
    });
    expect(distinctVersionAttempt.result.status).toBe("error");
  });
});
