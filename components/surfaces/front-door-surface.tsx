"use client";

import { useEffect, useState } from "react";
import { IntentPassportCard } from "@/components/intent-passport-card";
import { useMission } from "@/components/mission-provider";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";
import { WorkflowProgress } from "@/components/workflow-progress";
import { describeCapability } from "@/lib/capability-registry";
import { plansFixture, userFixture } from "@/lib/fixtures";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { getMissionRuntime } from "@/lib/mission-runtime";
import {
  findProductForTask,
  getProductCapabilities,
} from "@/lib/public-intelligence";
import { getCapabilityById, getCapabilityContinuations, rankCapabilitiesForTask } from "@/lib/catalog/capabilities";
import { getPublicProductById } from "@/lib/catalog/products";
import { fetchOsRanges, isCompatible, PRODUCT_TO_SAP } from "@/lib/ffc-os-compatibility";
import { comparePlanOptions } from "@/lib/plans";

type WorkflowStep = {
  order: number;
  productId: string;
  productName: string;
  capabilityId: string;
  capability: string;
  why: string;
  requires: string[];
  produces: string;
  destinationUrl: string;
};

type WorkflowState =
  | { status: "ok"; data: { workflowId: string; steps: WorkflowStep[]; recommendedStart: { destinationUrl: string } } }
  | { status: "error"; code: string; message: string };

const DEFAULT_GOAL =
  "I want to remove the background from a product image and turn it into an Instagram post.";
const DEFAULT_DISCOVERY_PROMPT = "What Adobe app should I use to edit a video?";

export function FrontDoorSurface() {
  const missionStore = useMission();
  const globalStatus = useGlobalWebMcpTools("Adobe Agentic Front Door", "/cc-home");
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [workflowResult, setWorkflowResult] = useState<WorkflowState | null>(null);
  const [productPrompt, setProductPrompt] = useState(DEFAULT_DISCOVERY_PROMPT);
  const [compatProduct, setCompatProduct] = useState("photoshop");
  const [compatPlatform, setCompatPlatform] = useState<"macos" | "windows">("macos");
  const [compatOsVersion, setCompatOsVersion] = useState("");
  const [compatResult, setCompatResult] = useState<{
    status: "idle" | "loading" | "ok" | "error";
    compatible?: boolean;
    ranges?: string[];
    message?: string;
  }>({ status: "idle" });
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);
  const [planSummaryState, setPlanSummaryState] = useState<{
    status: "loading" | "ok" | "unavailable";
    plan?: { planId: string; name: string };
    pricing?: {
      country: string;
      locale: string;
      currency: string;
      amount: number;
      formattedPrice: string;
      billingPeriod: string;
      dataSource: string;
    };
  }>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const loadPlanSummary = async () => {
      const recommendation = await comparePlanOptions(plansFixture, userFixture, {
        requirements: ["photo editing", "business card design", "background replacement"],
        region: userFixture.region,
        student: userFixture.student,
      });
      if (cancelled) return;
      if (recommendation.status !== "ok" || !recommendation.data.recommendedPlan) {
        setPlanSummaryState({ status: "unavailable" });
        return;
      }

      const pricing = recommendation.data.recommendedPlan.pricing;
      if (!pricing || !("formattedPrice" in pricing) || !("amount" in pricing)) {
        setPlanSummaryState({ status: "unavailable" });
        return;
      }

      setPlanSummaryState({
        status: "ok",
        plan: {
          planId: recommendation.data.recommendedPlan.planId,
          name: recommendation.data.recommendedPlan.name,
        },
        pricing: {
          country: pricing.country,
          locale: pricing.locale,
          currency: pricing.currency,
          amount: pricing.amount,
          formattedPrice: pricing.formattedPrice,
          billingPeriod: pricing.billingPeriod,
          dataSource: pricing.dataSource,
        },
      });
    };

    loadPlanSummary().catch(() => {
      if (!cancelled) {
        setPlanSummaryState({ status: "unavailable" });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const checkCompatibility = async () => {
    if (!compatOsVersion.trim()) return;
    setCompatResult({ status: "loading" });
    try {
      const sapCode = PRODUCT_TO_SAP[compatProduct];
      const ranges = await fetchOsRanges(sapCode, compatPlatform);
      const compatible = isCompatible(compatOsVersion.trim(), ranges);
      setCompatResult({ status: "ok", compatible, ranges });
    } catch (e) {
      setCompatResult({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  const composeWorkflow = () => {
    const ranked = rankCapabilitiesForTask(goal);

    if (ranked.length === 0) {
      setWorkflowResult({ status: "error", code: "NO_MATCH", message: "No Adobe apps matched this goal." });
      return;
    }

    const topCapability = ranked[0];
    const topProduct = getPublicProductById(topCapability.productId);
    if (!topProduct) {
      setWorkflowResult({ status: "error", code: "NO_MATCH", message: "No Adobe apps matched this goal." });
      return;
    }

    const continuations = getCapabilityContinuations(topCapability.id);
    let bestContinuation: typeof continuations[0] | null = null;
    if (continuations.length > 0) {
      const scored = rankCapabilitiesForTask(goal)
        .filter((cap) => continuations.some((c) => c.capabilityId === cap.id));
      if (scored.length > 0) {
        bestContinuation = continuations.find((c) => c.capabilityId === scored[0].id) ?? null;
      }
    }

    const topStep = {
      productId: topProduct.id,
      productName: topProduct.name,
      capabilityId: topCapability.id,
      capabilityName: topCapability.name,
      destinationUrl: topCapability.destinationUrl,
    };
    const allSteps = [topStep, ...(bestContinuation ? [bestContinuation] : [])];

    const steps: WorkflowStep[] = allSteps.map((step, index) => {
      const cap = getCapabilityById(step.capabilityId);
      return {
        order: index + 1,
        productId: step.productId,
        productName: step.productName,
        capabilityId: step.capabilityId,
        capability: step.capabilityName,
        why: cap?.description ?? "",
        requires: cap?.inputs ?? [],
        produces: cap?.outputs?.[0] ?? "",
        destinationUrl: step.destinationUrl,
      };
    });

    const workflowId = "wf-" + steps.map((s) => s.productId).join("-");
    const workflowData = { workflowId, steps, recommendedStart: { destinationUrl: steps[0].destinationUrl } };
    setWorkflowResult({ status: "ok", data: workflowData });

    const runtime = getMissionRuntime();
    if (runtime) {
      runtime.updateIntentPassport((passport) => ({
        ...passport,
        userGoal: goal,
        requirements: steps.map((s) => s.capability),
        discoveredCapabilities: Array.from(
          new Set([...passport.discoveredCapabilities, ...steps.map((s) => s.capabilityId)]),
        ),
        selectedProducts: steps.map((s) => s.productId),
        selectedWorkflowId: workflowId,
        selectedWorkflowStep: steps[0]?.capabilityId,
        recommendedWorkflow: steps.map((s) => s.productName).join(" → "),
        selectedDestination: steps[0]?.destinationUrl,
      }));
    }
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
            <p>{passport.discoveredCapabilities.length > 0 ? "✓" : "○"} Capabilities discovered</p>
            <p>{passport.selectedProducts.length > 0 ? "✓" : "○"} Apps identified</p>
            <p>{passport.selectedDestination ? "✓" : "○"} Start destination identified</p>
            <p>{passport.handoffTrail.length > 0 ? "✓" : "○"} Structured handoff prepared</p>
          </div>
        </div>
      </section>

      <section className="frontdoor-grid">
        <article className="frontdoor-card">
          <h2>Plans</h2>
          <p className="small-note">Student · India</p>
          {planSummaryState.status === "loading" ? (
            <p className="small-note">Loading live price…</p>
          ) : null}
          {planSummaryState.status === "ok" && planSummaryState.plan && planSummaryState.pricing ? (
            <>
              <p><strong>Recommended plan:</strong> {planSummaryState.plan.planId}</p>
              <p>
                <strong>Regional price:</strong> {planSummaryState.pricing.formattedPrice}/
                {planSummaryState.pricing.billingPeriod}
              </p>
              <p className="small-note">Data: {planSummaryState.pricing.dataSource}</p>
            </>
          ) : null}
          {planSummaryState.status === "unavailable" ? (
            <p className="small-note">Plan recommendation is unavailable.</p>
          ) : null}
          <a className="frontdoor-text-link" href="/plans">Explore plans</a>
        </article>

        <article className="frontdoor-card">
          <h2>OS compatibility</h2>
          <p className="small-note">Live data from Adobe FFC</p>
          <div className="frontdoor-inline-inputs">
            <label>
              Product
              <select value={compatProduct} onChange={(e) => { setCompatProduct(e.target.value); setCompatResult({ status: "idle" }); }}>
                {Object.keys(PRODUCT_TO_SAP).map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </label>
            <label>
              Platform
              <select value={compatPlatform} onChange={(e) => { setCompatPlatform(e.target.value as "macos" | "windows"); setCompatResult({ status: "idle" }); }}>
                <option value="macos">macOS</option>
                <option value="windows">Windows</option>
              </select>
            </label>
          </div>
          <label>
            OS version (e.g. 14.5 or 10.0.22631)
            <input
              type="text"
              placeholder="e.g. 14.5"
              value={compatOsVersion}
              onChange={(e) => { setCompatOsVersion(e.target.value); setCompatResult({ status: "idle" }); }}
            />
          </label>
          <button type="button" className="button-link" onClick={() => { void checkCompatibility(); }}>
            Check compatibility
          </button>
          {compatResult.status === "loading" ? <p className="small-note">Checking…</p> : null}
          {compatResult.status === "ok" ? (
            <>
              <p><strong>Result:</strong> {compatResult.compatible ? "✓ Compatible" : "✗ Not compatible"}</p>
              <p className="small-note">Supported ranges: {compatResult.ranges?.join(", ") || "none"}</p>
            </>
          ) : null}
          {compatResult.status === "error" ? (
            <p className="status-error">{compatResult.message}</p>
          ) : null}
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
