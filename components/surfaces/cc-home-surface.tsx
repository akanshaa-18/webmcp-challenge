"use client";

import Link from "next/link";
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

export function CCHomeSurface({ route, surface }: CCHomeSurfaceProps) {
  const missionStore = useMission();
  const globalStatus = useGlobalWebMcpTools(surface, route);

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
      <header>
        <h1 className="section-title">{surface}</h1>
        <p className="muted">Discover globally. Execute locally. Resume seamlessly.</p>
      </header>

      <ToolRegistrationStatus
        available={globalStatus.available}
        registeredTools={globalStatus.registeredTools}
      />

      <ToolRegistrationStatus available={localStatus.available} registeredTools={localStatus.registeredTools} />

      <section>
        <h2 className="section-title">Project context</h2>
        <p>
          <strong>Project:</strong> {projectFixture.name}
        </p>
        <p>
          <strong>User:</strong> {userFixture.name} ({userFixture.region}) • Student:{" "}
          {String(userFixture.student)}
        </p>
        <p>
          <strong>Mission:</strong> {missionStore.mission.goal}
        </p>
      </section>

      <section>
        <h2 className="section-title">Synthetic files</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Hash</th>
            </tr>
          </thead>
          <tbody>
            {missionStore.files.map((file) => (
              <tr key={file.id}>
                <td>{file.id}</td>
                <td>{file.name}</td>
                <td>{file.hash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="section-title">Pending destructive approvals (Meera)</h2>
        {Object.values(missionStore.deletionApprovals).length === 0 ? (
          <p className="muted">No pending approvals.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Confirmation ID</th>
                <th>File</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(missionStore.deletionApprovals).map((approval) => (
                <tr key={approval.confirmationId}>
                  <td>{approval.confirmationId}</td>
                  <td>{approval.fileId}</td>
                  <td>{approval.reason}</td>
                  <td>{approval.approvedByHuman ? "Approved" : "Pending human approval"}</td>
                  <td>
                    <button
                      className="button-link"
                      type="button"
                      onClick={() => missionStore.approveDeletionApproval(approval.confirmationId)}
                      disabled={approval.approvedByHuman}
                      style={{ opacity: approval.approvedByHuman ? 0.6 : 1 }}
                    >
                      Approve deletion
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Link className="button-link" href="/firefly">
        Open Firefly surface
      </Link>
    </div>
  );
}
