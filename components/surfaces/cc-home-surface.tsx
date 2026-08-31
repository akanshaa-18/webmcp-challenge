"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useMission } from "@/components/mission-provider";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";
import { resolveDuplicateDeletion } from "@/lib/delete-duplicates";
import { detectDuplicates } from "@/lib/duplicate-detection";
import { searchCreativeFiles } from "@/lib/file-search";
import { projectFixture, userFixture } from "@/lib/fixtures";
import { toolError } from "@/lib/errors";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { getMissionRuntime } from "@/lib/mission-runtime";
import { Surface } from "@/lib/types";

interface CCHomeSurfaceProps {
  route: string;
  surface: Surface;
}

function getAssetPreview(fileId: string) {
  if (fileId === "kaftan-logo-final" || fileId === "kaftan-logo-copy") {
    return "/demo-assets/kaftan-logo-final.svg";
  }
  if (fileId === "kaftan-logo-v2") {
    return "/demo-assets/kaftan-logo-v2.svg";
  }
  if (fileId === "kaftan-product-reference") {
    return "/demo-assets/kaftan-product-reference.svg";
  }
  if (fileId === "kaftan-logo-background-v1") {
    return "/demo-assets/kaftan-logo-background-v1.svg";
  }
  if (fileId === "kaftan-business-card-01") {
    return "/demo-assets/kaftan-business-card-01.svg";
  }
  return "/demo-assets/kaftan-logo-final.svg";
}

export function CCHomeSurface({ route, surface }: CCHomeSurfaceProps) {
  const missionStore = useMission();
  const globalStatus = useGlobalWebMcpTools(surface, route);
  const duplicateOverview = detectDuplicates(missionStore.files);
  const currentAsset = missionStore.currentAsset;
  const isMissionComplete = missionStore.mission.currentStep === "mission_complete";

  const [localTools] = useState(() => [
      {
        name: "get_project_context",
        description: "Get structured context for the current Kaftan creative mission.",
        annotations: { readOnlyHint: true },
        execute: () => ({
          status: "ok",
          data: {
            user: userFixture,
            project: projectFixture,
            mission: getMissionRuntime()?.mission,
            files: getMissionRuntime()?.files,
          },
        }),
      },
      {
        name: "search_files",
        description: "Find creative files in the current Adobe project matching a query.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
        annotations: { readOnlyHint: true },
        execute: (input: { query?: string }) => {
          if (!input?.query) {
            return toolError("MISSING_REQUIRED_CONTEXT", "The query field is required.");
          }
          const runtime = getMissionRuntime();
          if (!runtime) {
            return toolError("MISSING_MISSION", "Mission context is not initialized.");
          }
          const results = searchCreativeFiles(input.query, runtime.files);
          return {
            status: "ok",
            data: {
              query: input.query,
              results,
            },
          };
        },
      },
      {
        name: "get_file_metadata",
        description: "Get metadata for one project file by ID.",
        inputSchema: {
          type: "object",
          properties: { fileId: { type: "string" } },
          required: ["fileId"],
        },
        annotations: { readOnlyHint: true },
        execute: (input: { fileId?: string }) => {
          if (!input?.fileId) {
            return toolError("MISSING_REQUIRED_CONTEXT", "The fileId field is required.");
          }
          const runtime = getMissionRuntime();
          if (!runtime) {
            return toolError("MISSING_MISSION", "Mission context is not initialized.");
          }
          const file = runtime.files.find((item) => item.id === input.fileId);
          if (!file) {
            return toolError("INVALID_ASSET", `Unknown file ID: ${input.fileId}`);
          }
          return { status: "ok", data: file };
        },
      },
      {
        name: "find_duplicates",
        description:
          "Find deterministic duplicate groups by file hash for this project. Returns exactDuplicates, similarVersions, and protectedFiles. This tool is read-only.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description:
                "Optional. Defaults to the active project when omitted, and only that project is scanned.",
            },
          },
        },
        annotations: { readOnlyHint: true },
        execute: (input: { projectId?: string }) => {
          const runtime = getMissionRuntime();
          if (!runtime) {
            return toolError("MISSING_MISSION", "Mission context is not initialized.");
          }

          const projectId = input?.projectId ?? runtime.mission.projectId;
          if (projectId !== runtime.mission.projectId) {
            return toolError("MISSING_REQUIRED_CONTEXT", `Unknown project ID: ${projectId}`);
          }

          return {
            status: "ok",
            data: detectDuplicates(runtime.files.filter((file) => file.projectId === projectId)),
          };
        },
      },
      {
        name: "delete_file",
        description:
          "Delete a safe duplicate file only after explicit human UI approval. First call returns confirmation_required and creates a pending approval record; after Meera approves in UI, call again with confirmationId.",
        annotations: { readOnlyHint: false },
        inputSchema: {
          type: "object",
          properties: {
            fileId: { type: "string" },
            confirmationId: {
              type: "string",
              description:
                "Optional on first request. Required on follow-up deletion after UI approval and must match a pending approved confirmation.",
            },
          },
          required: ["fileId"],
        },
        execute: (input: { fileId?: string; confirmationId?: string }) => {
          if (!input?.fileId) {
            return toolError("MISSING_REQUIRED_CONTEXT", "The fileId field is required.");
          }
          const runtime = getMissionRuntime();
          if (!runtime) {
            return toolError("MISSING_MISSION", "Mission context is not initialized.");
          }
          if (!runtime.mission.constraints.noDestructiveActionWithoutApproval) {
            return toolError("CONSTRAINT_VIOLATION", "Mission constraints are not loaded correctly.");
          }

          const outcome = resolveDuplicateDeletion({
            mission: runtime.mission,
            files: runtime.files,
            fileId: input.fileId,
            confirmationId: input.confirmationId,
            pendingApprovals: runtime.deletionApprovals,
          });

          if (outcome.approvalRequest) {
            runtime.addDeletionApproval(outcome.approvalRequest);
          }
          if (outcome.consumedConfirmationId && outcome.nextFiles && outcome.nextMission) {
            runtime.removeDeletionApproval(outcome.consumedConfirmationId);
            runtime.setMission(outcome.nextMission);
            runtime.removeFile(input.fileId);
          }

          return outcome.result;
        },
      },
    ]);

  const localStatus = useWebMcpTools(localTools);

  return (
    <div className="surface">
      <header className="hero">
        <p className="small-note">{surface === "Project" ? "Creative workspace" : "Creative Cloud Home"}</p>
        <h1 className="hero-title">Kaftan</h1>
        <p className="hero-subtitle">Client brand project</p>
        <div className="badge-row">
          <span className={`status-badge ${isMissionComplete ? "status-badge-success" : ""}`}>
            Status: {isMissionComplete ? "Mission complete" : "In progress"}
          </span>
          <span className="status-badge">Current asset: {currentAsset?.name ?? "None"}</span>
          <span className="status-badge">
            {userFixture.name} · Student · {userFixture.city}, {userFixture.region}
          </span>
        </div>
      </header>

      {isMissionComplete ? (
        <section className="preview-card">
          <h2 className="section-title">Mission complete</h2>
          <p>Kaftan launch assets are ready.</p>
          <div className="timeline-list" style={{ marginTop: "8px" }}>
            <div className="timeline-item">✓ Background variation created</div>
            <div className="timeline-item">✓ Business card created</div>
            <div className="timeline-item">✓ Exact duplicate removed</div>
            <div className="timeline-item">✓ Approved original preserved</div>
            <div className="timeline-item">✓ Distinct versions preserved</div>
            <div className="timeline-item">✓ No purchase made</div>
          </div>
        </section>
      ) : null}

      <section className="split">
        <aside className="preview-card">
          <h2 className="section-title">Creative Cloud</h2>
          <div className="timeline-list" style={{ marginTop: "8px" }}>
            <div className="timeline-item">Home</div>
            <div className="timeline-item">Files</div>
            <div className="timeline-item">Projects</div>
            <div className="timeline-item">Libraries</div>
          </div>
        </aside>
        <article>
        <h2 className="section-title">Project assets</h2>
        <div className="asset-grid">
          {missionStore.files.map((file) => {
            const isGenerated = file.id.includes("background") || file.id.includes("business-card");
            const isVersion = file.name.toLowerCase().includes("-v");
            const isDuplicateCandidate = duplicateOverview.exactDuplicates.some((group) =>
              group.safeDeletionCandidateIds.includes(file.id),
            );
            return (
              <article key={file.id} className="asset-card">
                <Image
                  src={getAssetPreview(file.id)}
                  alt={`${file.name} preview`}
                  width={720}
                  height={420}
                  style={{ width: "100%", height: "auto", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <h3>{file.name}</h3>
                <p className="asset-meta">{file.type.toUpperCase()} · {(file.size / 1_000_000).toFixed(1)} MB</p>
                <div className="badge-row">
                  {file.approved ? <span className="status-badge status-badge-success">Approved</span> : null}
                  {isVersion ? <span className="status-badge">Version</span> : null}
                  {isGenerated ? <span className="status-badge">Generated</span> : null}
                  {isDuplicateCandidate ? <span className="status-badge">Duplicate candidate</span> : null}
                </div>
              </article>
            );
          })}
        </div>
        </article>
      </section>

      <section className="split">
        <article className="preview-card">
          <h2 className="section-title">Duplicate cleanup</h2>
          {duplicateOverview.exactDuplicates.length ? (
            <>
              <p>
                Exact duplicate detected:{" "}
                <strong>{duplicateOverview.exactDuplicates[0].safeDeletionCandidateIds.join(", ") || "None"}</strong>
              </p>
              <p>
                Matches approved original: <strong>{duplicateOverview.exactDuplicates[0].protectedFileIds.join(", ")}</strong>
              </p>
            </>
          ) : (
            <p>No exact duplicates remaining in the current project set.</p>
          )}
          <p className="small-note">Distinct version preserved: kaftan-logo-v2</p>
        </article>
        <article className="preview-card">
          <h2 className="section-title">Approval required</h2>
          <p>
            Creative Mission Control found an exact duplicate. The approved original will remain untouched.
          </p>
          {Object.values(missionStore.deletionApprovals).length === 0 ? (
            <p className="small-note">No pending approvals yet.</p>
          ) : (
            <div className="timeline-list">
              {Object.values(missionStore.deletionApprovals).map((approval) => (
                <div key={approval.confirmationId} className="timeline-item">
                  <p>
                    <strong>{approval.fileId}</strong> ·{" "}
                    {approval.approvedByHuman ? "Approved" : "Pending human approval"}
                  </p>
                  <button
                    className="button-link"
                    type="button"
                    onClick={() => missionStore.approveDeletionApproval(approval.confirmationId)}
                    disabled={approval.approvedByHuman}
                    style={{ marginTop: "8px", opacity: approval.approvedByHuman ? 0.6 : 1 }}
                  >
                    Approve deletion
                  </button>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <div className="badge-row">
        <span className="status-badge">Opening in Firefly: {currentAsset?.name ?? "Kaftan-logo-final.psd"}</span>
        <span className="status-badge">Creative context carried</span>
        <Link className="button-link" href="/firefly">
          Continue to Firefly
        </Link>
      </div>

      <details className="details-pane">
        <summary>Developer details</summary>
        <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
          <ToolRegistrationStatus
            available={globalStatus.available}
            registeredTools={globalStatus.registeredTools}
          />
          <ToolRegistrationStatus available={localStatus.available} registeredTools={localStatus.registeredTools} />
          <table className="table">
            <thead>
              <tr>
                <th>File</th>
                <th>Hash</th>
                <th>Modified</th>
              </tr>
            </thead>
            <tbody>
              {missionStore.files.map((file) => (
                <tr key={file.id}>
                  <td>{file.name}</td>
                  <td>{file.hash}</td>
                  <td>{new Date(file.modifiedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
