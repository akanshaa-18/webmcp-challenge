"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMission } from "@/components/mission-provider";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";
import { describeCapability } from "@/lib/capability-registry";
import { toolError } from "@/lib/errors";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { getMissionRuntime } from "@/lib/mission-runtime";

interface FireflySurfaceProps {
  handoffIdFromRoute: string | null;
}

export function FireflySurface({ handoffIdFromRoute }: FireflySurfaceProps) {
  const router = useRouter();
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
            creativeDirection: {
              type: "string",
              description:
                "Optional. If omitted, the tool uses creative direction from the active handoff context.",
            },
          },
        },
        execute: (input: { handoffId?: string; assetId?: string; creativeDirection?: string }) => {
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
          if (!activeHandoff.assetIds.includes(sourceAssetId)) {
            return toolError(
              "INVALID_HANDOFF_ASSET",
              `Asset ${sourceAssetId} is not part of handoff ${resolvedHandoffId}.`,
            );
          }
          const sourceAsset = runtime.files.find((file) => file.id === sourceAssetId);
          if (!sourceAsset) {
            return toolError("INVALID_ASSET", `Unknown source asset: ${sourceAssetId}`);
          }

          const resolvedCreativeDirection = input?.creativeDirection?.trim() ?? activeHandoff.task?.trim() ?? "";
          if (!resolvedCreativeDirection || resolvedCreativeDirection.toLowerCase() === "change background") {
            return {
              status: "decision_required" as const,
              data: {
                code: "MISSING_CREATIVE_DIRECTION",
                message:
                  "A human-provided creative direction is required to change background under current mission constraints.",
              },
            };
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
  const hasGenerated = missionStore.files.some((file) => file.id === "kaftan-logo-background-v1");
  const activeAssetName = missionStore.currentAsset?.name ?? "Kaftan-logo-final.psd";

  const continueToExpress = () => {
    const runtime = getMissionRuntime();
    if (!runtime) {
      return;
    }
    const capability = describeCapability("express.create_business_card");
    if (!capability) {
      return;
    }
    const activeAssetId = missionStore.currentAsset?.id ?? runtime.mission.currentAssetId;
    const handoff = runtime.createAndStoreHandoff({
      fromSurface: "Firefly",
      toSurface: capability.ownerSurface,
      toolName: capability.toolName,
      projectId: runtime.mission.projectId,
      assetIds: [activeAssetId],
      task: "Create a business card from this asset.",
      expectedResult: "business-card-output",
    });
    router.push(`${capability.destinationRoute}?handoff=${handoff.handoffId}`);
  };

  return (
    <div className="firefly-surface">
      <header className="firefly-topbar">
        <div className="firefly-brand">Adobe Firefly</div>
        <div className="firefly-top-actions">
          <span>Generative Fill</span>
          <span>Text to image</span>
          <span>Sketch to image</span>
        </div>
      </header>

      <div className="firefly-layout">
        <aside className="firefly-left-panel">
          <p className="small-note">Workflow</p>
          <h2>Change background</h2>
          <p className="small-note">Context carried from Adobe Home</p>
          <div className="timeline-list" style={{ marginTop: "10px" }}>
            <div className="timeline-item">Active creative: {activeAssetName}</div>
            <div className="timeline-item">Task: Dark premium textile background</div>
          </div>
        </aside>

        <main className="firefly-canvas-wrap">
          {!handoff ? (
            <p className="status-error">Context carried from Creative Cloud is required to continue.</p>
          ) : (
            <section className="firefly-canvas-grid">
              <article className="preview-card">
                <h2 className="section-title">Source</h2>
                <Image
                  src="/demo-assets/kaftan-logo-final.svg"
                  alt="Kaftan logo source"
                  width={720}
                  height={420}
                  style={{ width: "100%", height: "auto", borderRadius: "10px", border: "1px solid #d6dae5" }}
                />
              </article>
              <article className="preview-card">
                <h2 className="section-title">Result</h2>
                {hasGenerated ? (
                  <Image
                    src="/demo-assets/kaftan-logo-background-v1.svg"
                    alt="Kaftan background variation"
                    width={720}
                    height={420}
                    style={{ width: "100%", height: "auto", borderRadius: "10px", border: "1px solid #d6dae5" }}
                  />
                ) : (
                  <div className="preview-placeholder">
                    <div>
                      <strong>Ready to generate</strong>
                      <p className="small-note">Run change_background to create variation.</p>
                    </div>
                  </div>
                )}
              </article>
            </section>
          )}
        </main>

        <aside className="firefly-right-panel">
          <h2 className="section-title">Prompt</h2>
          <p className="small-note">
            Create a dark premium textile background while preserving the approved Kaftan logo.
          </p>
          <div className="badge-row" style={{ marginTop: "12px" }}>
            <span className="status-badge">{hasGenerated ? "Background complete" : "Pending execution"}</span>
            <button type="button" className="button-link" onClick={continueToExpress}>
              Continue to Express
            </button>
          </div>
          <p className="small-note" style={{ marginTop: "8px" }}>
            Using Firefly result
          </p>
        </aside>
      </div>

      <details className="details-pane">
        <summary>View handoff details</summary>
        <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
          <ToolRegistrationStatus
            available={globalStatus.available}
            registeredTools={globalStatus.registeredTools}
          />
          <ToolRegistrationStatus available={localStatus.available} registeredTools={localStatus.registeredTools} />
          {handoff ? (
            <div className="code-block">
              Source: {handoff.assetIds.join(", ")}
              {"\n"}Task: {handoff.task}
              {"\n"}Goal: {handoff.userGoal}
              {"\n"}Completed steps: {handoff.previousSteps.join(", ") || "None"}
            </div>
          ) : null}
        </div>
      </details>
    </div>
  );
}
