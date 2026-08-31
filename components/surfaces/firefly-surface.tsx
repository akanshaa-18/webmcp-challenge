"use client";

import Link from "next/link";
import { useState } from "react";
import { useMission } from "@/components/mission-provider";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";
import { toolError } from "@/lib/errors";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { getMissionRuntime } from "@/lib/mission-runtime";

interface FireflySurfaceProps {
  handoffIdFromRoute: string | null;
}

export function FireflySurface({ handoffIdFromRoute }: FireflySurfaceProps) {
  const missionStore = useMission();
  const handoffId = handoffIdFromRoute;
  const handoff = handoffId ? missionStore.getHandoff(handoffId) : null;

  const globalStatus = useGlobalWebMcpTools("Firefly", "/firefly");

  const [localTools] = useState(() => [
      {
        name: "change_background",
        description:
          "Change the background of the handed-off creative asset. handoffId is optional when the active Firefly handoff is present in the route URL (?handoff=<id>), and assetId is optional when it can be derived from the handoff asset list.",
        annotations: { readOnlyHint: false },
        inputSchema: {
          type: "object",
          properties: {
            handoffId: {
              type: "string",
              description: "Optional. If omitted, the tool uses the active handoff ID from ?handoff in the URL.",
            },
            assetId: {
              type: "string",
              description:
                "Optional. If omitted, the tool uses the first asset ID from the active handoff context.",
            },
          },
        },
        execute: (input: { handoffId?: string; assetId?: string }) => {
          const runtime = getMissionRuntime();
          if (!runtime) {
            return toolError("MISSING_MISSION", "Mission context is not initialized.");
          }

          const handoffFromUrl =
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("handoff") ?? ""
              : "";

          const resolvedHandoffId = input?.handoffId ?? handoffFromUrl;
          const activeHandoff = runtime.getHandoff(resolvedHandoffId);
          if (!activeHandoff) {
            return toolError(
              "MISSING_HANDOFF_CONTEXT",
              "This tool requires an active Firefly creative handoff.",
            );
          }
          if (activeHandoff.toSurface !== "Firefly") {
            return toolError("WRONG_SURFACE", "This handoff is not targeting the Firefly surface.");
          }

          const sourceAssetId = input?.assetId ?? activeHandoff.assetIds[0];
          const sourceAsset = runtime.files.find((file) => file.id === sourceAssetId);
          if (!sourceAsset) {
            return toolError("INVALID_ASSET", `Unknown source asset: ${sourceAssetId}`);
          }

          const outputFile = {
            ...sourceAsset,
            id: "kaftan-logo-background-v1",
            name: "Kaftan-logo-background-v1.psd",
            modifiedAt: new Date().toISOString(),
            hash: "hash-kaftan-logo-background-v1",
            approved: false,
          };

          runtime.upsertFile(outputFile);
          runtime.completeStep("change_background", outputFile.id);

          return {
            status: "ok",
            data: {
              handoffId: resolvedHandoffId,
              beforeAssetId: sourceAsset.id,
              outputAssetId: outputFile.id,
              message: "Background updated for Kaftan creative asset.",
            },
          };
        },
      },
    ]);

  const localStatus = useWebMcpTools(localTools);

  return (
    <div className="surface">
      <header>
        <h1 className="section-title">Adobe Firefly</h1>
        <p className="muted">Local execution surface for deterministic background changes.</p>
      </header>

      <ToolRegistrationStatus
        available={globalStatus.available}
        registeredTools={globalStatus.registeredTools}
      />
      <ToolRegistrationStatus available={localStatus.available} registeredTools={localStatus.registeredTools} />

      {!handoff ? (
        <p className="status-error">
          Missing handoff context. Open this route through prepare_handoff or include ?handoff=&lt;id&gt;.
        </p>
      ) : (
        <section>
          <h2 className="section-title">Handoff context received</h2>
          <p>
            <strong>Project:</strong> Kaftan
          </p>
          <p>
            <strong>Source asset:</strong> {handoff.assetIds.join(", ")}
          </p>
          <p>
            <strong>Task:</strong> {handoff.task}
          </p>
          <p>
            <strong>User goal:</strong> {handoff.userGoal}
          </p>
          <p>
            <strong>Constraints received:</strong>{" "}
            {Object.entries(handoff.constraints)
              .filter(([, value]) => value)
              .map(([key]) => key)
              .join(", ")}
          </p>
          <p>
            <strong>Handoff ID:</strong> {handoff.handoffId}
          </p>
          <p>
            <strong>Completed previous steps:</strong>{" "}
            {handoff.previousSteps.length ? handoff.previousSteps.join(", ") : "None"}
          </p>
        </section>
      )}

      <section>
        <h2 className="section-title">Current mission output</h2>
        <p>
          <strong>Current asset:</strong> {missionStore.currentAsset?.id}
        </p>
        <p>
          <strong>Completed steps:</strong>{" "}
          {missionStore.mission.completedSteps.length
            ? missionStore.mission.completedSteps.join(", ")
            : "None yet"}
        </p>
      </section>

      <Link className="button-link" href="/express">
        Continue to Express
      </Link>
    </div>
  );
}
