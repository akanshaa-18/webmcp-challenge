"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  const hasOutput = missionStore.files.some((file) => file.id === "kaftan-business-card-01");

  return (
    <div className="surface">
      <header className="hero">
        <p className="small-note">Adobe Express</p>
        <h1 className="hero-title">Business card adaptation</h1>
        <p className="hero-subtitle">Creative context preserved from prior mission steps.</p>
      </header>

      <section className="split">
        <article className="preview-card">
          <h2 className="section-title">Source</h2>
          <Image
            src="/demo-assets/kaftan-logo-background-v1.svg"
            alt="Firefly source asset"
            width={720}
            height={420}
            style={{ width: "100%", height: "auto", borderRadius: "10px", border: "1px solid #d6dae5" }}
          />
          <p className="small-note" style={{ marginTop: "8px" }}>
            {handoff ? handoff.assetIds.join(", ") : "Awaiting handoff"}
          </p>
        </article>
        <article className="preview-card">
          <h2 className="section-title">Output</h2>
          {hasOutput ? (
            <Image
              src="/demo-assets/kaftan-business-card-01.svg"
              alt="Kaftan business card output"
              width={720}
              height={420}
              style={{ width: "100%", height: "auto", borderRadius: "10px", border: "1px solid #d6dae5" }}
            />
          ) : (
            <div className="preview-placeholder">
              <div>
                <strong>Ready to create</strong>
                <p className="small-note">No generated card yet.</p>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="preview-card">
        <h2 className="section-title">Business card preview</h2>
        <div style={{ border: "1px solid #d0d9ee", borderRadius: "12px", padding: "14px", background: "#ffffff" }}>
          <p style={{ fontWeight: 700, fontSize: "1.05rem" }}>Meera Sharma</p>
          <p className="small-note">Freelance Designer</p>
          <p style={{ marginTop: "8px" }}>meera@example.com</p>
        </div>
      </section>

      <div className="badge-row">
        <Link className="button-link" href="/project/kaftan">
          Return to Project
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
          <div className="code-block">
            Current asset: {missionStore.currentAsset?.id}
            {"\n"}Completed steps: {missionStore.mission.completedSteps.join(", ") || "None"}
          </div>
        </div>
      </details>
    </div>
  );
}
