"use client";

import { useState } from "react";
import { IntentPassportCard } from "@/components/intent-passport-card";
import { useMission } from "@/components/mission-provider";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";
import { WorkflowProgress } from "@/components/workflow-progress";
import { describeCapability } from "@/lib/capability-registry";
import { plansFixture, userFixture } from "@/lib/fixtures";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { getMissionRuntime } from "@/lib/mission-runtime";
import {
  checkDeviceCompatibility,
  findProductForTask,
  getProductCapabilities,
  getProductSystemRequirements,
} from "@/lib/public-intelligence";
import { comparePlanOptions, getPlanPrice } from "@/lib/plans";
import { buildAdobeWorkflow } from "@/lib/workflow-composer";

type WorkflowState = ReturnType<typeof buildAdobeWorkflow>;

const DEFAULT_GOAL =
  "I want to remove the background from a product image and turn it into an Instagram post.";
const DEFAULT_DISCOVERY_PROMPT = "What Adobe app should I use to edit a video?";
const DEFAULT_COMPATIBILITY_PROMPT = "Will Premiere Pro run on my Mac?";

export function FrontDoorSurface() {
  const missionStore = useMission();
  const globalStatus = useGlobalWebMcpTools("Adobe Agentic Front Door", "/cc-home");
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [workflowResult, setWorkflowResult] = useState<WorkflowState | null>(null);
  const [productPrompt, setProductPrompt] = useState(DEFAULT_DISCOVERY_PROMPT);
  const compatibilityPrompt = DEFAULT_COMPATIBILITY_PROMPT;
  const [deviceMemory, setDeviceMemory] = useState<string>("");
  const [deviceStorage, setDeviceStorage] = useState<string>("");
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);

  const planSummary = (() => {
    const recommendation = comparePlanOptions(plansFixture, userFixture, {
      requirements: ["photo editing", "business card design", "background replacement"],
      region: userFixture.region,
      student: userFixture.student,
    });
    if (recommendation.status !== "ok" || !recommendation.data.recommendedPlan) {
      return null;
    }
    const price = getPlanPrice(plansFixture, userFixture, {
      planId: recommendation.data.recommendedPlan.planId,
      region: userFixture.region,
    });
    if (price.status !== "ok") {
      return null;
    }
    return {
      plan: recommendation.data.recommendedPlan,
      price: price.data,
    };
  })();

  const productDiscovery = (() => {
    const recommendation = findProductForTask(productPrompt);
    if (recommendation.status !== "ok") {
      return recommendation;
    }
    const top = recommendation.data.recommendations[0];
    if (!top) {
      return recommendation;
    }
    const capabilities = getProductCapabilities(top.productId);
    return {
      recommendation,
      capabilities,
    };
  })();

  const compatibilitySummary = (() => {
    const requirements = getProductSystemRequirements("premiere-pro", "macos");
    const memory = Number(deviceMemory);
    const storage = Number(deviceStorage);
    const hasMemory = Number.isFinite(memory) && memory > 0;
    const hasStorage = Number.isFinite(storage) && storage > 0;
    const compatibility = checkDeviceCompatibility(
      "premiere-pro",
      "macos",
      hasMemory || hasStorage
        ? {
            osVersion: "macOS (user provided)",
            memoryGB: hasMemory ? memory : undefined,
            freeStorageGB: hasStorage ? storage : undefined,
          }
        : undefined,
    );

    return {
      prompt: compatibilityPrompt,
      requirements,
      compatibility,
      hasDeviceDetails: hasMemory || hasStorage,
    };
  })();

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
    if (!capability?.destinationUrl) {
      return;
    }

    runtime.createAndStoreHandoff({
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

  };

  const passport = missionStore.intentPassport;
  const workflowSteps = workflowResult?.status === "ok" ? workflowResult.data.steps : [];
  const currentStepDisplay = workflowSteps.length > 0 ? `Step 1 of ${workflowSteps.length}` : "Step 0 of 0";

  return (
    <div className="frontdoor">
      <section className="frontdoor-hero">
        <p className="frontdoor-kicker">Creative Community workspace</p>
        <h1>What are you trying to create?</h1>
        <p>
          Find what to use, what it costs, what runs on your device, and which workflow to start.
        </p>
        <label htmlFor="frontdoor-goal" className="frontdoor-goal-label">Your goal</label>
        <textarea
          id="frontdoor-goal"
          className="frontdoor-goal-input"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
        />
        <div className="frontdoor-hero-actions">
          <button type="button" className="button-link" onClick={composeWorkflow}>
            Compose creative workflow
          </button>
          {workflowResult?.status === "ok" ? (
            <a
              className="button-link"
              href={workflowResult.data.recommendedStart.destinationUrl}
              target="_blank"
              rel="noreferrer"
              onClick={continueWithHandoff}
            >
              Open {workflowResult.data.steps[0]?.productName ?? "destination"}
            </a>
          ) : null}
          <button
            type="button"
            className="frontdoor-secondary-button"
            onClick={() => setShowWorkflowDetails((current) => !current)}
          >
            {showWorkflowDetails ? "Hide workflow details" : "View workflow details"}
          </button>
        </div>
      </section>

      {workflowResult?.status === "ok" ? (
        <section className="frontdoor-workflow">
          <h2>Your creative workflow</h2>
          <div className="frontdoor-workflow-steps">
            {workflowResult.data.steps.map((step) => (
              <article key={step.capabilityId} className="frontdoor-step-card">
                <p className="frontdoor-step-order">{step.order}</p>
                <h3>{step.productName}</h3>
                <p>{step.capability}</p>
                <p className="small-note">Why: {step.why}</p>
                <p className="small-note">Requires: {step.requires.join(", ") || "none"}</p>
                <p className="small-note">Produces: {step.produces}</p>
              </article>
            ))}
          </div>
          <p className="small-note">
            Recommended starting point: {workflowResult.data.steps[0]?.productName} ·{" "}
            {workflowResult.data.recommendedStart.destinationUrl}
          </p>
          {workflowResult.data.steps[0]?.productId === "firefly" ? (
            <p className="small-note">Add your source image in Firefly to continue.</p>
          ) : null}
          {workflowResult.data.steps[1] ? (
            <p className="small-note">
              Next workflow step: {workflowResult.data.steps[1].productName} · {workflowResult.data.steps[1].capability}
            </p>
          ) : null}
        </section>
      ) : null}

      {workflowResult?.status === "error" ? (
        <section className="frontdoor-card">
          <h2>Workflow result</h2>
          <p className="status-error">{workflowResult.code}: {workflowResult.message}</p>
        </section>
      ) : null}

      <section className="frontdoor-grid">
        <article className="frontdoor-card">
          <h2>Why this is recommended</h2>
          {workflowResult?.status === "ok" ? (
            <div className="frontdoor-activity-list">
              {workflowResult.data.steps.map((step) => (
                <p key={`why-${step.capabilityId}`}>
                  <strong>{step.productName}</strong>: {step.why}
                </p>
              ))}
              <p>
                <strong>Workflow dependency:</strong> background transformation happens before social adaptation.
              </p>
            </div>
          ) : (
            <p className="small-note">Compose a workflow to see capability reasoning and dependencies.</p>
          )}
        </article>
        <div>
          <IntentPassportCard passport={passport} currentLabel={currentStepDisplay} />
          {workflowResult?.status === "ok" ? (
            <div style={{ marginTop: 10 }}>
              <WorkflowProgress
                steps={workflowResult.data.steps.map((step) => ({
                  id: step.capabilityId,
                  label: step.productName,
                  subtitle: step.capability,
                }))}
                currentStepId={workflowResult.data.steps[0]?.capabilityId}
              />
            </div>
          ) : null}
          <h3 className="frontdoor-subheading">Activity</h3>
          <div className="frontdoor-activity-list">
            <p>✓ Goal understood</p>
            <p>{passport.discoveredCapabilities.includes("public.find_product_for_task") ? "✓" : "○"} Product capability discovered</p>
            <p>{passport.discoveredCapabilities.includes("public.build_adobe_workflow") ? "✓" : "○"} Workflow composed</p>
            <p>{passport.selectedDestination ? "✓" : "○"} Start destination identified</p>
            <p>{passport.handoffTrail.length > 0 ? "✓" : "○"} Structured handoff prepared</p>
          </div>
        </div>
      </section>

      <section className="frontdoor-grid">
        <article className="frontdoor-card">
          <h2>Plans</h2>
          <p className="small-note">Student · India</p>
          {planSummary ? (
            <>
              <p><strong>Recommended plan:</strong> {planSummary.plan.planId}</p>
              <p>
                <strong>Regional price:</strong> {planSummary.price.currency} {planSummary.price.amount}/
                {planSummary.price.billingPeriod}
              </p>
              <p className="small-note">Data: {planSummary.price.dataSource}</p>
            </>
          ) : (
            <p className="small-note">Plan recommendation is unavailable.</p>
          )}
          <a className="frontdoor-text-link" href="/plans">Explore plans</a>
        </article>

        <article className="frontdoor-card">
          <h2>Device compatibility</h2>
          <p className="small-note">{compatibilitySummary.prompt}</p>
          <div className="frontdoor-inline-inputs">
            <label>
              Memory (GB)
              <input
                type="number"
                min={1}
                value={deviceMemory}
                onChange={(event) => setDeviceMemory(event.target.value)}
              />
            </label>
            <label>
              Free storage (GB)
              <input
                type="number"
                min={1}
                value={deviceStorage}
                onChange={(event) => setDeviceStorage(event.target.value)}
              />
            </label>
          </div>
          {compatibilitySummary.requirements.status === "ok" ? (
            <p className="small-note">Source: {compatibilitySummary.requirements.data.dataSource}</p>
          ) : null}
          {compatibilitySummary.compatibility.status === "ok" ? (
            <p><strong>Result:</strong> {String(compatibilitySummary.compatibility.data.compatibility)}</p>
          ) : (
            <p className="small-note">More device information needed.</p>
          )}
        </article>

        <article className="frontdoor-card">
          <h2>Find the right product</h2>
          <textarea
            className="frontdoor-goal-input"
            style={{ minHeight: 72 }}
            value={productPrompt}
            onChange={(event) => setProductPrompt(event.target.value)}
          />
          {"recommendation" in productDiscovery && productDiscovery.recommendation.status === "ok" ? (
            <>
              <p>
                <strong>Recommended:</strong> {productDiscovery.recommendation.data.recommendations[0]?.productName}
              </p>
              {"status" in productDiscovery.capabilities && productDiscovery.capabilities.status === "ok" ? (
                <p className="small-note">
                  Capabilities: {productDiscovery.capabilities.data.capabilities.map((capability) => capability.name).join(", ")}
                </p>
              ) : null}
            </>
          ) : (
            <p className="small-note">Product recommendation unavailable for this prompt.</p>
          )}
        </article>
      </section>

      {showWorkflowDetails && workflowResult?.status === "ok" ? (
        <section className="frontdoor-card">
          <h2>Workflow details</h2>
          <p className="small-note">
            Asset context may include &quot;User-provided image&quot;. Binary transfer into external Adobe surfaces is
            not performed in this prototype.
          </p>
          <p className="small-note">
            Data disclosure: public reference snapshot catalog only; not live account or entitlement data.
          </p>
        </section>
      ) : null}

      <details className="details-pane">
        <summary>Developer details</summary>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <ToolRegistrationStatus available={globalStatus.available} registeredTools={globalStatus.registeredTools} />
        </div>
      </details>
    </div>
  );
}
