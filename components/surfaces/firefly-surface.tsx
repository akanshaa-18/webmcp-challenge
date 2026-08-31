"use client";

import Link from "next/link";
import Image from "next/image";
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
  const hasGenerated = missionStore.files.some((file) => file.id === "kaftan-logo-background-v1");

  return (
    <div className="surface">
      <header className="hero">
        <p className="small-note">Adobe Firefly</p>
        <h1 className="hero-title">Background transformation</h1>
        <p className="hero-subtitle">
          Create a dark premium textile background while preserving the approved Kaftan logo.
        </p>
      </header>

      {!handoff ? (
        <p className="status-error">Context carried from Creative Cloud is required to continue.</p>
      ) : (
        <section className="split">
          <article className="preview-card">
            <h2 className="section-title">Before</h2>
            <Image
              src="/demo-assets/kaftan-logo-final.svg"
              alt="Kaftan logo source"
              width={720}
              height={420}
              style={{ width: "100%", height: "auto", borderRadius: "10px", border: "1px solid #d6dae5" }}
            />
            <p className="small-note" style={{ marginTop: "8px" }}>
              Approved source asset
            </p>
          </article>
          <article className="preview-card">
            <h2 className="section-title">After</h2>
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
                  <strong>Pending transformation</strong>
                  <p className="small-note">Ready to generate variation.</p>
                </div>
              </div>
            )}
            <p className="small-note" style={{ marginTop: "8px" }}>
              {hasGenerated ? "Generated background variation ready." : "Awaiting tool execution."}
            </p>
          </article>
        </section>
      )}

      <section className="timeline-list">
        <div className="timeline-item">Context carried from Creative Cloud</div>
        <div className="timeline-item">Current mission asset: {missionStore.currentAsset?.id}</div>
      </section>

      <div className="badge-row">
        <span className="status-badge">Continue in Adobe Express</span>
        <span className="status-badge">Using Firefly result</span>
        <Link className="button-link" href="/express">
          Continue to Express
        </Link>
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
