"use client";

import Link from "next/link";
import { useState } from "react";
import { IntentPassportCard } from "@/components/intent-passport-card";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";
import { WorkflowProgress } from "@/components/workflow-progress";
import { describeCapability } from "@/lib/capability-registry";
import { toolError } from "@/lib/errors";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { getMissionRuntime } from "@/lib/mission-runtime";

interface FireflySurfaceProps {
  handoffIdFromRoute: string | null;
}

export function FireflySurface({ handoffIdFromRoute }: FireflySurfaceProps) {
  const runtime = getMissionRuntime();
  const handoffId = handoffIdFromRoute;
  const handoff = handoffId && runtime ? runtime.getHandoff(handoffId) : null;

  const globalStatus = useGlobalWebMcpTools("Firefly", "/firefly");
  const fireflyCapability = describeCapability("firefly.change_background");
  const expressCapability = describeCapability("express.create_business_card");

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
            description: "Optional. If omitted, the tool uses the first asset ID from the active handoff context.",
          },
          creativeDirection: {
            type: "string",
            description: "Optional. If omitted, the tool uses creative direction from the active handoff context.",
          },
        },
      },
      execute: (input: { handoffId?: string; assetId?: string; creativeDirection?: string }) => {
        const activeRuntime = getMissionRuntime();
        if (!activeRuntime) {
          return toolError("MISSING_MISSION", "Mission context is not initialized.");
        }

        const handoffFromUrl =
          typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("handoff") ?? "" : "";

        const resolvedHandoffId = input?.handoffId ?? handoffFromUrl;
        const activeHandoff = activeRuntime.getHandoff(resolvedHandoffId);
        if (!activeHandoff) {
          return toolError("MISSING_HANDOFF_CONTEXT", "This tool requires an active Firefly creative handoff.");
        }
        if (activeHandoff.toSurface !== "Firefly") {
          return toolError("WRONG_SURFACE", "This handoff is not targeting the Firefly surface.");
        }

        const handoffAssetIds = activeHandoff.assetIds ?? [];
        const sourceAssetId = input?.assetId ?? handoffAssetIds[0];
        if (!sourceAssetId || !handoffAssetIds.includes(sourceAssetId)) {
          return toolError("INVALID_HANDOFF_ASSET", `Asset ${sourceAssetId} is not part of handoff ${resolvedHandoffId}.`);
        }
        const sourceAsset = activeRuntime.files.find((file) => file.id === sourceAssetId);
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

        activeRuntime.upsertFile(outputFile);
        activeRuntime.completeStep("change_background", outputFile.id);

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
  const activeAssetId = handoff?.assetIds?.[0] ?? runtime?.mission.currentAssetId ?? "unknown";
  const completedSteps = runtime?.mission.completedSteps ?? [];
  const workflowSteps = [
    {
      id: "firefly.change_background",
      label: "Adobe Firefly",
      subtitle: "change_background",
    },
    {
      id: "express.create_business_card",
      label: "Adobe Express",
      subtitle: "create_business_card",
    },
  ];

  return (
    <div className="surface">
      <header className="hero">
        <p className="small-note">Legacy developer/demo route · Step 1 of 2</p>
        <h1 className="hero-title">Firefly handoff destination</h1>
        <p className="hero-subtitle">
          This route is retained for legacy regression testing. Public hero flow now hands off directly to Adobe Firefly.
        </p>
      </header>

      <section className="frontdoor-secondary-grid">
        <article className="frontdoor-card">
          <h2>Your workflow starts here</h2>
          <p>
            <strong>Goal:</strong> {handoff?.task ?? runtime?.intentPassport.userGoal ?? "Not provided"}
          </p>
          <p>
            <strong>Why this step:</strong> Firefly is selected for background transformation before adaptation in Express.
          </p>
          <WorkflowProgress steps={workflowSteps} currentStepId="firefly.change_background" />
        </article>

        {runtime ? (
          <IntentPassportCard
            passport={runtime.intentPassport}
            currentLabel="Step 1: Firefly destination with handoff context"
          />
        ) : null}
      </section>

      <section className="split">
        <article className="preview-card">
          <h2 className="section-title">Context carried into Firefly</h2>
          <div className="timeline-list">
            <div className="timeline-item">{handoff ? "✓ Handoff token present in URL" : "○ Missing handoff token"}</div>
            <div className="timeline-item">
              {handoff?.projectId ? `✓ Project: ${handoff.projectId}` : "○ Project context unavailable"}
            </div>
            <div className="timeline-item">{activeAssetId ? `✓ Active asset: ${activeAssetId}` : "○ Active asset missing"}</div>
            <div className="timeline-item">
              {handoff?.expectedResult ? `✓ Expected result: ${handoff.expectedResult}` : "○ Expected result missing"}
            </div>
          </div>
          <details className="details-pane" style={{ marginTop: 12 }}>
            <summary>Technical handoff context</summary>
            <div className="code-block" style={{ marginTop: 8 }}>
              handoffId: {handoff?.handoffId ?? "n/a"}
              {"\n"}from: {handoff?.fromSurface ?? "n/a"}
              {"\n"}to: {handoff?.toSurface ?? "n/a"}
              {"\n"}assetIds: {(handoff?.assetIds ?? []).join(", ") || "n/a"}
              {"\n"}completedSteps: {completedSteps.join(", ") || "none"}
            </div>
          </details>
        </article>

        <article className="preview-card">
          <h2 className="section-title">Continue this workflow</h2>
          <p className="small-note">
            Launch Firefly using the destination defined in the capability registry. This route does not claim local
            file transfer or completed Adobe-side execution.
          </p>
          <div className="badge-row" style={{ marginTop: 12 }}>
            {fireflyCapability?.destinationUrl ? (
              <a className="button-link" href={fireflyCapability.destinationUrl} target="_blank" rel="noreferrer">
                Open Adobe Firefly
              </a>
            ) : null}
            <Link className="button-link" href="/cc-home">
              Back to workflow briefing
            </Link>
            {expressCapability?.destinationRoute && handoff?.handoffId ? (
              <Link className="button-link" href={`${expressCapability.destinationRoute}?handoff=${handoff.handoffId}`}>
                View next destination
              </Link>
            ) : null}
          </div>
          <p className="small-note" style={{ marginTop: 8 }}>
            Navigation preserves mission state and handoff history in session storage.
          </p>
        </article>
      </section>

      <details className="details-pane">
        <summary>WebMCP registration details</summary>
        <div style={{ marginTop: 10, display: "grid", gap: "10px" }}>
          <ToolRegistrationStatus available={globalStatus.available} registeredTools={globalStatus.registeredTools} />
          <ToolRegistrationStatus available={localStatus.available} registeredTools={localStatus.registeredTools} />
        </div>
      </details>
    </div>
  );
}
