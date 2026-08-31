"use client";

import { useState } from "react";
import { useMission } from "@/components/mission-provider";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";
import { toolError } from "@/lib/errors";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { getMissionRuntime } from "@/lib/mission-runtime";

interface ExpressSurfaceProps {
  handoffIdFromRoute: string | null;
}

export function ExpressSurface({ handoffIdFromRoute }: ExpressSurfaceProps) {
  const missionStore = useMission();
  const handoffId = handoffIdFromRoute;
  const globalStatus = useGlobalWebMcpTools("Express", "/express");

  const [localTools] = useState(() => [
      {
        name: "create_business_card",
        description:
          "Create a business card concept from a prepared project asset. handoffId is optional when the active Express handoff is present in the route URL (?handoff=<id>), and sourceAssetId is optional when it can be derived from the handoff asset list.",
        annotations: { readOnlyHint: false },
        inputSchema: {
          type: "object",
          properties: {
            handoffId: {
              type: "string",
              description: "Optional. If omitted, the tool uses the active handoff ID from ?handoff in the URL.",
            },
            sourceAssetId: {
              type: "string",
              description:
                "Optional. If omitted, the tool uses the first asset ID from the active handoff context.",
            },
          },
        },
        execute: (input: { handoffId?: string; sourceAssetId?: string }) => {
          const runtime = getMissionRuntime();
          if (!runtime) {
            return toolError("MISSING_MISSION", "Mission context is not initialized.");
          }

          const handoffFromUrl =
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("handoff") ?? ""
              : "";
          const activeHandoff = runtime.getHandoff(input.handoffId ?? handoffFromUrl);
          if (!activeHandoff) {
            return toolError(
              "MISSING_HANDOFF_CONTEXT",
              "This tool requires an active Express creative handoff.",
            );
          }
          if (activeHandoff.toSurface !== "Express") {
            return toolError("WRONG_SURFACE", "This handoff is not targeting the Express surface.");
          }

          const sourceAssetId = input?.sourceAssetId ?? activeHandoff.assetIds[0];
          const sourceAsset = runtime.files.find((file) => file.id === sourceAssetId);
          if (!sourceAsset) {
            return toolError("INVALID_ASSET", `Unknown source asset: ${sourceAssetId}`);
          }

          const outputFile = {
            ...sourceAsset,
            id: "kaftan-business-card-01",
            name: "Kaftan-business-card-01.png",
            type: "png",
            modifiedAt: new Date().toISOString(),
            hash: "hash-kaftan-business-card-01",
          };

          runtime.upsertFile(outputFile);
          runtime.completeStep("create_business_card", outputFile.id);

          return {
            status: "ok",
            data: {
              outputAssetId: outputFile.id,
              sourceAssetId: sourceAsset.id,
            },
          };
        },
      },
    ]);

  const localStatus = useWebMcpTools(localTools);
  const handoff = handoffId ? missionStore.getHandoff(handoffId) : null;

  return (
    <div className="surface">
      <header>
        <h1 className="section-title">Adobe Express</h1>
        <p className="muted">Optional local execution surface for business card output.</p>
      </header>

      <ToolRegistrationStatus
        available={globalStatus.available}
        registeredTools={globalStatus.registeredTools}
      />
      <ToolRegistrationStatus available={localStatus.available} registeredTools={localStatus.registeredTools} />

      {handoff ? (
        <p>
          <strong>Active handoff:</strong> {handoff.handoffId}
        </p>
      ) : (
        <p className="muted">No active Express handoff.</p>
      )}

      <p>
        <strong>Current asset:</strong> {missionStore.currentAsset?.id}
      </p>
      <p>
        <strong>Mission completed steps:</strong>{" "}
        {missionStore.mission.completedSteps.length
          ? missionStore.mission.completedSteps.join(", ")
          : "None yet"}
      </p>
    </div>
  );
}
