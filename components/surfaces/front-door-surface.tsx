"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";
import { useMission } from "@/components/mission-provider";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { describeCapability } from "@/lib/capability-registry";
import { plansFixture, userFixture } from "@/lib/fixtures";
import { getMissionRuntime } from "@/lib/mission-runtime";
import { comparePlanOptions, getPlanPrice } from "@/lib/plans";
import { checkDeviceCompatibility } from "@/lib/public-intelligence";
import { buildAdobeWorkflow } from "@/lib/workflow-composer";

type WorkflowState = ReturnType<typeof buildAdobeWorkflow>;

function includes(text: string, term: string) {
  return text.toLowerCase().includes(term);
}

export function FrontDoorSurface() {
  const router = useRouter();
  const missionStore = useMission();
  const globalStatus = useGlobalWebMcpTools("Adobe Agentic Front Door", "/cc-home");
  const [goal, setGoal] = useState(
    "Remove the background from this product image and turn it into an Instagram post",
  );
  const [workflowResult, setWorkflowResult] = useState<WorkflowState | null>(null);

  const planResult = useMemo(() => {
    if (!includes(goal, "plan") && !includes(goal, "cost") && !includes(goal, "price")) {
      return null;
    }
    const compared = comparePlanOptions(plansFixture, userFixture, {
      requirements: ["photo editing", "background replacement", "business card design"],
    });
    if (compared.status !== "ok" || !compared.data.recommendedPlan) {
      return null;
    }
    return getPlanPrice(plansFixture, userFixture, {
      planId: compared.data.recommendedPlan.planId,
    });
  }, [goal]);

  const compatibilityResult = useMemo(() => {
    const lowerGoal = goal.toLowerCase();
    if (!lowerGoal.includes("premiere") || !lowerGoal.includes("mac")) {
      return null;
    }
    return checkDeviceCompatibility("premiere-pro", "macos", {
      osVersion: "macOS (unspecified)",
      memoryGB: 16,
      freeStorageGB: 100,
    });
  }, [goal]);

  const composeWorkflow = () => {
    const runtime = getMissionRuntime();
    const result = buildAdobeWorkflow(goal, runtime?.intentPassport.userConstraints ?? []);
    setWorkflowResult(result);
    if (result.status !== "ok" || !runtime) {
      return;
    }

    runtime.updateIntentPassport((passport) => ({
      ...passport,
      userGoal: goal,
      requirements: result.data.steps.map((step) => step.capability),
      discoveredCapabilities: Array.from(
        new Set([
          ...passport.discoveredCapabilities,
          "public.build_adobe_workflow",
          ...result.data.steps.map((step) => step.capabilityId),
        ]),
      ),
      selectedProducts: result.data.steps.map((step) => step.productId),
      selectedWorkflowId: result.data.workflowId,
      selectedWorkflowStep: result.data.steps[0]?.capabilityId,
      recommendedWorkflow: result.data.steps.map((step) => step.productName).join(" → "),
      selectedDestination: result.data.recommendedStart.destinationUrl,
    }));
  };

  const continueWithHandoff = () => {
    if (!workflowResult || workflowResult.status !== "ok") {
      return;
    }
    const runtime = getMissionRuntime();
    if (!runtime) {
      return;
    }
    const firstStep = workflowResult.data.steps[0];
    if (!firstStep) {
      return;
    }

    const toolNameByProduct: Record<string, "firefly.change_background" | "express.create_business_card"> = {
      firefly: "firefly.change_background",
      express: "express.create_business_card",
    };
    const toolName = toolNameByProduct[firstStep.productId];
    if (!toolName) {
      return;
    }

    const capability = describeCapability(toolName);
    if (!capability?.destinationRoute) {
      return;
    }

    const handoff = runtime.createAndStoreHandoff({
      fromSurface: "Adobe Agentic Front Door",
      toSurface: capability.ownerSurface,
      toolName: capability.toolName,
      projectId: runtime.mission.projectId,
      assetIds: [runtime.mission.currentAssetId],
      task: goal,
      expectedResult: firstStep.produces,
      selectedWorkflowId: workflowResult.data.workflowId,
      selectedWorkflowStep: firstStep.capabilityId,
      selectedDestination: firstStep.destinationUrl,
    });

    router.push(`${capability.destinationRoute}?handoff=${handoff.handoffId}`);
  };

  const passport = missionStore.intentPassport;

  return (
    <div className="surface">
      <header className="hero">
        <p className="small-note">Adobe Agentic Front Door</p>
        <h1 className="hero-title">What are you trying to create?</h1>
        <p className="hero-subtitle">
          Understand globally, verify authoritatively, compose across Adobe, and hand off precisely.
        </p>
        <div className="badge-row">
          <span className="status-badge">{userFixture.name} · Student · Bangalore, India</span>
          <span className="status-badge">Public reference snapshots</span>
        </div>
      </header>

      <section className="preview-card">
        <label htmlFor="goal-input" className="section-title">User goal</label>
        <textarea
          id="goal-input"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          style={{ width: "100%", minHeight: 88, marginTop: 8 }}
        />
        <div className="badge-row" style={{ marginTop: 10 }}>
          <button type="button" className="button-link" onClick={composeWorkflow}>
            Compose Adobe workflow
          </button>
          {workflowResult?.status === "ok" ? (
            <button type="button" className="button-link" onClick={continueWithHandoff}>
              Continue to {workflowResult.data.steps[0]?.productName ?? "destination"}
            </button>
          ) : null}
        </div>
      </section>

      {workflowResult?.status === "ok" ? (
        <section className="split">
          <article className="preview-card">
            <h2 className="section-title">Adobe workflow</h2>
            <div className="timeline-list">
              {workflowResult.data.steps.map((step) => (
                <div key={step.capabilityId} className="timeline-item">
                  Step {step.order}: {step.productName} · {step.capability}
                </div>
              ))}
            </div>
            <p className="small-note" style={{ marginTop: 8 }}>
              Start in {workflowResult.data.steps[0]?.productName}
            </p>
          </article>
          <article className="preview-card">
            <h2 className="section-title">Why Adobe recommends this</h2>
            <div className="timeline-list">
              {workflowResult.data.steps.map((step) => (
                <div key={`why-${step.capabilityId}`} className="timeline-item">
                  <strong>{step.productName}:</strong> {step.why}
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {workflowResult?.status === "error" ? (
        <section className="preview-card">
          <h2 className="section-title">Workflow result</h2>
          <p className="status-error">{workflowResult.code}: {workflowResult.message}</p>
        </section>
      ) : null}

      <section className="split">
        <article className="preview-card">
          <h2 className="section-title">Intent Passport</h2>
          <div className="timeline-list">
            <div className="timeline-item">Goal: {passport.userGoal}</div>
            <div className="timeline-item">
              Requirements: {passport.requirements.length ? passport.requirements.join(", ") : "none"}
            </div>
            <div className="timeline-item">
              Discovered: {passport.selectedProducts.length ? passport.selectedProducts.join(", ") : "none"}
            </div>
            <div className="timeline-item">
              Workflow: {passport.recommendedWorkflow ?? "not composed"}
            </div>
          </div>
        </article>
        <article className="preview-card">
          <h2 className="section-title">Public workflow handoff</h2>
          <p className="small-note">
            Asset context can carry &quot;User-provided image&quot; intent metadata, but binary transfer into external
            Adobe apps is not performed in this prototype.
          </p>
          <p className="small-note">Handoff trail: {passport.handoffTrail.length}</p>
        </article>
      </section>

      <section className="split">
        {planResult && planResult.status === "ok" ? (
          <article className="preview-card">
            <h2 className="section-title">Plan recommendation</h2>
            <p>Student · India</p>
            <p>
              {planResult.data.planId} · {planResult.data.currency} {planResult.data.amount}/
              {planResult.data.billingPeriod}
            </p>
            <p className="small-note">Source: {planResult.data.dataSource}</p>
          </article>
        ) : null}
        {compatibilityResult && compatibilityResult.status === "ok" ? (
          <article className="preview-card">
            <h2 className="section-title">Compatibility check</h2>
            <p>Premiere Pro · macOS</p>
            <p>Result: {String(compatibilityResult.data.compatibility)}</p>
            <p className="small-note">Source: {compatibilityResult.data.dataSource}</p>
          </article>
        ) : null}
      </section>

      <footer className="small-note" style={{ marginTop: 12 }}>
        Data disclosure: product capabilities, plans, and requirements are public reference snapshots for this
        WebMCP prototype, not live account or production backend data.
      </footer>

      <details className="details-pane">
        <summary>Developer details</summary>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <ToolRegistrationStatus available={globalStatus.available} registeredTools={globalStatus.registeredTools} />
        </div>
      </details>
    </div>
  );
}
