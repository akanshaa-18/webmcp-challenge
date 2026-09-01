// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { MissionProvider } from "@/components/mission-provider";
import { UniversalNav } from "@/components/universal-nav";
import { creativeFilesFixture, seededIntentPassport, seededMission } from "@/lib/fixtures";
import { getMissionRuntime } from "@/lib/mission-runtime";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

vi.mock("next/navigation", () => ({
  usePathname: () => "/project/kaftan",
}));

function Harness() {
  return (
    <MissionProvider>
      <UniversalNav />
    </MissionProvider>
  );
}

describe("reset demo behavior", () => {
  it("restores deterministic initial state from a fresh browser session", async () => {
    window.sessionStorage.clear();
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness />);
    });

    const runtime = getMissionRuntime();
    expect(runtime?.mission).toEqual(seededMission);
    expect(runtime?.intentPassport).toEqual(seededIntentPassport);
    expect(runtime?.files).toEqual(creativeFilesFixture);
    expect(Object.keys(runtime?.handoffs ?? {})).toHaveLength(0);
    expect(Object.keys(runtime?.deletionApprovals ?? {})).toHaveLength(0);

    await act(async () => {
      runtime?.completeStep("change_background", "kaftan-logo-background-v1");
    });
    await act(async () => {
      runtime?.addDeletionApproval({
        confirmationId: "approve-delete-kaftan-logo-copy-test",
        fileId: "kaftan-logo-copy",
        reason: "test",
        candidateFileIds: ["kaftan-logo-copy"],
        createdAt: "2026-09-01T00:00:00.000Z",
        approvedByHuman: false,
      });
    });
    await act(async () => {
      runtime?.createAndStoreHandoff({
        fromSurface: "Project",
        toSurface: "Firefly",
        toolName: "firefly.change_background",
        projectId: seededMission.projectId,
        assetIds: ["kaftan-logo-final"],
        task: "Change background",
        expectedResult: "background-updated-logo",
      });
    });

    const resetButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Reset Demo",
    );
    expect(resetButton).toBeDefined();

    await act(async () => {
      resetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const resetRuntime = getMissionRuntime();
    expect(resetRuntime?.mission).toEqual(seededMission);
    expect(resetRuntime?.intentPassport).toEqual(seededIntentPassport);
    expect(resetRuntime?.files).toEqual(creativeFilesFixture);
    expect(Object.keys(resetRuntime?.handoffs ?? {})).toHaveLength(0);
    expect(Object.keys(resetRuntime?.deletionApprovals ?? {})).toHaveLength(0);

    await act(async () => {
      root.unmount();
    });
  });
});
