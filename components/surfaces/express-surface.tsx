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

interface ExpressSurfaceProps {
  handoffIdFromRoute: string | null;
}

export function ExpressSurface({ handoffIdFromRoute }: ExpressSurfaceProps) {
  const runtime = getMissionRuntime();
  const handoffId = handoffIdFromRoute;
  const handoff = handoffId && runtime ? runtime.getHandoff(handoffId) : null;
  const globalStatus = useGlobalWebMcpTools("Express", "/express");
  const expressCapability = describeCapability("express.create_business_card");

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
            description: "Optional. If omitted, the tool uses the first asset ID from the active handoff context.",
          },
        },
      },
      execute: (input: { handoffId?: string; sourceAssetId?: string }) => {
        const activeRuntime = getMissionRuntime();
        if (!activeRuntime) {
          return toolError("MISSING_MISSION", "Mission context is not initialized.");
        }

        const handoffFromUrl =
          typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("handoff") ?? "" : "";
        const activeHandoff = activeRuntime.getHandoff(input.handoffId ?? handoffFromUrl);
        if (!activeHandoff) {
          return toolError("MISSING_HANDOFF_CONTEXT", "This tool requires an active Express creative handoff.");
        }
        if (activeHandoff.toSurface !== "Express") {
          return toolError("WRONG_SURFACE", "This handoff is not targeting the Express surface.");
        }

        const handoffAssetIds = activeHandoff.assetIds ?? [];
        const sourceAssetId = input?.sourceAssetId ?? handoffAssetIds[0];
        if (!sourceAssetId || !handoffAssetIds.includes(sourceAssetId)) {
          return toolError(
            "INVALID_HANDOFF_ASSET",
            `Asset ${sourceAssetId} is not part of handoff ${input.handoffId ?? handoffFromUrl}.`,
          );
        }
        const sourceAsset = activeRuntime.files.find((file) => file.id === sourceAssetId);
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

        activeRuntime.upsertFile(outputFile);
        activeRuntime.completeStep("create_business_card", outputFile.id);

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
  const completedSteps = runtime?.mission.completedSteps ?? [];

  return (
    <div className="surface">
      <header className="hero">
        <p className="small-note">Public destination · Step 2 of 2</p>
        <h1 className="hero-title">Express handoff destination</h1>
        <p className="hero-subtitle">
          This page carries workflow continuity state. Business card creation runs on Adobe Express.
        </p>
      </header>

      <section className="frontdoor-secondary-grid">
        <article className="frontdoor-card">
          <h2>Finish your composed workflow</h2>
          <p>
            <strong>Goal:</strong> {handoff?.task ?? runtime?.intentPassport.userGoal ?? "Not provided"}
          </p>
          <p>
            <strong>Why this step:</strong> Express is selected to adapt the Firefly-prepared asset into social-ready output.
          </p>
          <WorkflowProgress steps={workflowSteps} currentStepId="express.create_business_card" />
        </article>

        {runtime ? (
          <IntentPassportCard
            passport={runtime.intentPassport}
            currentLabel="Step 2: Express destination with handoff context"
          />
        ) : null}
      </section>

      <section className="split">
        <article className="preview-card">
          <h2 className="section-title">Context carried into Express</h2>
          <div className="timeline-list">
            <div className="timeline-item">{handoff ? "✓ Handoff token present in URL" : "○ Missing handoff token"}</div>
            <div className="timeline-item">
              {handoff?.toolName ? `✓ Requested capability: ${handoff.toolName}` : "○ Capability missing"}
            </div>
            <div className="timeline-item">
              {handoff?.assetIds?.length ? `✓ Source asset: ${handoff.assetIds[0]}` : "○ Source asset missing"}
            </div>
            <div className="timeline-item">✓ Completed mission steps: {completedSteps.join(", ") || "none"}</div>
          </div>
          <details className="details-pane" style={{ marginTop: 12 }}>
            <summary>Technical handoff context</summary>
            <div className="code-block" style={{ marginTop: 8 }}>
              handoffId: {handoff?.handoffId ?? "n/a"}
              {"\n"}from: {handoff?.fromSurface ?? "n/a"}
              {"\n"}to: {handoff?.toSurface ?? "n/a"}
              {"\n"}previousSteps: {(handoff?.previousSteps ?? []).join(", ") || "none"}
              {"\n"}expectedResult: {handoff?.expectedResult ?? "n/a"}
            </div>
          </details>
        </article>

        <article className="preview-card">
          <h2 className="section-title">Continue this workflow</h2>
          <p className="small-note">
            Launch Express using the registry-owned destination URL. This route validates continuity and does not claim
            binary upload/transfer execution in-browser.
          </p>
          <div className="badge-row" style={{ marginTop: 12 }}>
            {expressCapability?.destinationUrl ? (
              <a className="button-link" href={expressCapability.destinationUrl} target="_blank" rel="noreferrer">
                Open Adobe Express
              </a>
            ) : null}
            <Link className="button-link" href="/cc-home">
              Back to workflow briefing
            </Link>
            <Link className="button-link" href="/project/kaftan">
              Return to project summary
            </Link>
          </div>
          <p className="small-note" style={{ marginTop: 8 }}>
            Resuming the workflow returns to the project route with mission and handoff history preserved.
          </p>
        </article>
      </section>

      <details className="details-pane">
        <summary>WebMCP registration details</summary>
        <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
          <ToolRegistrationStatus available={globalStatus.available} registeredTools={globalStatus.registeredTools} />
          <ToolRegistrationStatus available={localStatus.available} registeredTools={localStatus.registeredTools} />
        </div>
      </details>
    </div>
  );
}
