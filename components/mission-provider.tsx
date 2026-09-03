"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { creativeFilesFixture, seededIntentPassport, seededMission } from "@/lib/fixtures";
import { createHandoff } from "@/lib/handoff";
import { setMissionRuntime } from "@/lib/mission-runtime";
import { CreativeFile, DeletionApprovalRequest, HandoffContext, IntentPassport, Mission, Surface } from "@/lib/types";

const STORAGE_KEY = "kaftan.mission.state.v1";

interface MissionState {
  intentPassport: IntentPassport;
  mission: Mission;
  files: CreativeFile[];
  handoffs: Record<string, HandoffContext>;
  deletionApprovals: Record<string, DeletionApprovalRequest>;
}

interface MissionContextValue {
  intentPassport: IntentPassport;
  mission: Mission;
  files: CreativeFile[];
  handoffs: Record<string, HandoffContext>;
  currentAsset: CreativeFile | undefined;
  deletionApprovals: Record<string, DeletionApprovalRequest>;
  getHandoff: (handoffId: string) => HandoffContext | null;
  addDeletionApproval: (approval: DeletionApprovalRequest) => void;
  approveDeletionApproval: (confirmationId: string) => void;
  removeDeletionApproval: (confirmationId: string) => void;
  removeFile: (fileId: string) => void;
  createAndStoreHandoff: (input: {
    fromSurface: Surface;
    toSurface: Surface;
    toolName: string;
    projectId?: string;
    assetIds?: string[];
    task: string;
    expectedResult: string;
    selectedWorkflowId?: string;
    selectedWorkflowStep?: string;
    selectedDestination?: string;
    brandContext?: string;
    market?: string;
  }) => HandoffContext;
  completeStep: (step: string, currentAssetId?: string) => void;
  setCurrentStep: (step: string) => void;
  upsertFile: (file: CreativeFile) => void;
  setMission: (mission: Mission) => void;
  updateIntentPassport: (updater: (current: IntentPassport) => IntentPassport) => void;
  setIntentPassport: (next: IntentPassport) => void;
  resetDemo: () => void;
}

const MissionContext = createContext<MissionContextValue | null>(null);

function loadInitialState(): MissionState {
  if (typeof window === "undefined") {
    return {
      intentPassport: seededIntentPassport,
      mission: seededMission,
      files: creativeFilesFixture,
      handoffs: {},
      deletionApprovals: {},
    };
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      intentPassport: seededIntentPassport,
      mission: seededMission,
      files: creativeFilesFixture,
      handoffs: {},
      deletionApprovals: {},
    };
  }

  try {
    const parsed = JSON.parse(raw) as MissionState;
    if (!parsed.mission || !parsed.files || !parsed.handoffs) {
      return {
        intentPassport: seededIntentPassport,
        mission: seededMission,
        files: creativeFilesFixture,
        handoffs: {},
        deletionApprovals: {},
      };
    }
    if (!parsed.deletionApprovals) {
      return { ...parsed, deletionApprovals: {} };
    }
    const normalizedApprovals = Object.fromEntries(
      Object.entries(parsed.deletionApprovals).map(([confirmationId, approval]) => [
        confirmationId,
        {
          ...approval,
          approvedByHuman: approval.approvedByHuman ?? false,
        },
      ]),
    );
    const now = new Date().toISOString();
    const intentPassport: IntentPassport = {
      ...seededIntentPassport,
      ...(parsed.intentPassport ?? {
        userGoal: parsed.mission.goal,
        handoffTrail: parsed.mission.handoffHistory,
      }),
      updatedAt: now,
    };
    return { ...parsed, intentPassport, deletionApprovals: normalizedApprovals };
  } catch {
    return {
      intentPassport: seededIntentPassport,
      mission: seededMission,
      files: creativeFilesFixture,
      handoffs: {},
      deletionApprovals: {},
    };
  }
}

export function MissionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MissionState>(() => loadInitialState());

  const persist = (updater: (previous: MissionState) => MissionState) => {
    setState((previous) => {
      const nextState = updater(previous);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      }
      return nextState;
    });
  };

  const value = useMemo<MissionContextValue>(() => {
    const currentAsset = state.files.find((file) => file.id === state.mission.currentAssetId);

    return {
      intentPassport: state.intentPassport,
      mission: state.mission,
      files: state.files,
      handoffs: state.handoffs,
      deletionApprovals: state.deletionApprovals,
      currentAsset,
      getHandoff: (handoffId) => state.handoffs[handoffId] ?? null,
      addDeletionApproval: (approval) => {
        persist((previous) => ({
          ...previous,
          deletionApprovals: {
            ...previous.deletionApprovals,
            [approval.confirmationId]:
              previous.deletionApprovals[approval.confirmationId] ?? approval,
          },
        }));
      },
      approveDeletionApproval: (confirmationId) => {
        persist((previous) => {
          const approval = previous.deletionApprovals[confirmationId];
          if (!approval) {
            return previous;
          }
          return {
            ...previous,
            deletionApprovals: {
              ...previous.deletionApprovals,
              [confirmationId]: {
                ...approval,
                approvedByHuman: true,
                approvedAt: new Date().toISOString(),
              },
            },
          };
        });
      },
      removeDeletionApproval: (confirmationId) => {
        persist((previous) => {
          const next = { ...previous.deletionApprovals };
          delete next[confirmationId];
          return {
            ...previous,
            deletionApprovals: next,
          };
        });
      },
      removeFile: (fileId) => {
        persist((previous) => ({
          ...previous,
          files: previous.files.filter((file) => file.id !== fileId),
        }));
      },
      createAndStoreHandoff: (input) => {
        const handoff = createHandoff({
          mission: state.mission,
          intentPassportId: state.intentPassport.id,
          userGoal: state.intentPassport.userGoal,
          requirements: state.intentPassport.requirements,
          discoveredCapabilities: state.intentPassport.discoveredCapabilities,
          selectedWorkflowId: state.intentPassport.selectedWorkflowId,
          selectedDestination: state.intentPassport.selectedDestination,
          userConstraints: state.intentPassport.userConstraints,
          ...input,
        });
        persist((previous) => ({
          ...previous,
          intentPassport: {
            ...previous.intentPassport,
            selectedDestination: handoff.selectedDestination ?? input.toSurface,
            handoffTrail: [...previous.intentPassport.handoffTrail, handoff.handoffId],
            updatedAt: new Date().toISOString(),
          },
          mission: {
            ...previous.mission,
            currentStep: `Handoff to ${input.toSurface}`,
            handoffHistory: [...previous.mission.handoffHistory, handoff.handoffId],
          },
          handoffs: {
            ...previous.handoffs,
            [handoff.handoffId]: handoff,
          },
        }));
        return handoff;
      },
      completeStep: (step, currentAssetId) => {
        persist((previous) => {
          const nextCompletedSteps = previous.mission.completedSteps.includes(step)
            ? previous.mission.completedSteps
            : [...previous.mission.completedSteps, step];
          return {
            ...previous,
            mission: {
              ...previous.mission,
              completedSteps: nextCompletedSteps,
              currentStep: step,
              currentAssetId: currentAssetId ?? previous.mission.currentAssetId,
            },
          };
        });
      },
      setCurrentStep: (step) => {
        persist((previous) => ({
          ...previous,
          mission: {
            ...previous.mission,
            currentStep: step,
          },
        }));
      },
      upsertFile: (file) => {
        persist((previous) => {
          const existingIndex = previous.files.findIndex((item) => item.id === file.id);
          const files = [...previous.files];
          if (existingIndex >= 0) {
            files[existingIndex] = file;
          } else {
            files.push(file);
          }
          return { ...previous, files };
        });
      },
      setMission: (mission) => {
        persist((previous) => ({ ...previous, mission }));
      },
      updateIntentPassport: (updater) => {
        persist((previous) => ({
          ...previous,
          intentPassport: {
            ...updater(previous.intentPassport),
            updatedAt: new Date().toISOString(),
          },
        }));
      },
      setIntentPassport: (next) => {
        persist((previous) => ({
          ...previous,
          intentPassport: {
            ...next,
            updatedAt: new Date().toISOString(),
          },
        }));
      },
      resetDemo: () => {
        persist(() => ({
          intentPassport: seededIntentPassport,
          mission: seededMission,
          files: creativeFilesFixture,
          handoffs: {},
          deletionApprovals: {},
        }));
      },
    };
  }, [state]);

  useEffect(() => {
    setMissionRuntime(value);
  }, [value]);

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission() {
  const context = useContext(MissionContext);
  if (!context) {
    throw new Error("useMission must be used within MissionProvider.");
  }
  return context;
}
