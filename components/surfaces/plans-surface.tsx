"use client";

import { useEffect, useState } from "react";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { plansFixture } from "@/lib/fixtures";
import { createPlanActionTools } from "@/lib/shared-plan-tools";
import { getPlanPrice, SessionContext } from "@/lib/plans";
import { getMissionRuntime } from "@/lib/mission-runtime";

interface PriceViewState {
  status: "loading" | "ok" | "price_unavailable";
  formattedPrice?: string;
  currency?: string;
  amount?: number;
  billingPeriod?: string;
  reason?: string;
}

function readSessionContext(): SessionContext {
  const runtime = getMissionRuntime();
  return {
    region: runtime?.intentPassport.region,
    audience: runtime?.intentPassport.audience,
  };
}

export function PlansSurface() {
  const [lastToolOutput, setLastToolOutput] = useState<string>("No tool output yet.");
  const [priceStateByPlan, setPriceStateByPlan] = useState<Record<string, PriceViewState>>(
    plansFixture.reduce<Record<string, PriceViewState>>((acc, plan) => {
      acc[plan.id] = { status: "loading" };
      return acc;
    }, {}),
  );
  const globalStatus = useGlobalWebMcpTools("Adobe Plans", "/plans");

  useEffect(() => {
    let cancelled = false;

    // Catalog browse view: each plan is priced using its OWN first declared
    // supported region (plan.supportedRegions[0]), not a guess about the
    // visitor. This is plan metadata, not user context, so it never
    // fabricates who/where the visitor is.
    const load = async () => {
      const resolved = await Promise.all(
        plansFixture.map(async (plan) => {
          const result = await getPlanPrice(plansFixture, { planId: plan.id, region: plan.supportedRegions[0] });
          return { planId: plan.id, result };
        }),
      );

      if (cancelled) return;

      setPriceStateByPlan((current) => {
        const next = { ...current };
        for (const entry of resolved) {
          if (entry.result.status === "ok") {
            next[entry.planId] = {
              status: "ok",
              formattedPrice: entry.result.data.formattedPrice,
              currency: entry.result.data.currency,
              amount: entry.result.data.amount,
              billingPeriod: entry.result.data.billingPeriod,
            };
            continue;
          }
          next[entry.planId] = {
            status: "price_unavailable",
            reason: "data" in entry.result ? entry.result.data.reason : undefined,
          };
        }
        return next;
      });
    };

    load().catch(() => {
      if (cancelled) return;
      setPriceStateByPlan((current) =>
        Object.fromEntries(
          Object.entries(current).map(([planId]) => [planId, { status: "price_unavailable", reason: "upstream_unavailable" }]),
        ),
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const [localTools] = useState(() => {
    const baseTools = createPlanActionTools();
    return baseTools.map((tool) => ({
      ...tool,
      execute: (input: any) => {
        const result = tool.execute(input);
        if ("status" in result && "data" in result) {
          setLastToolOutput(JSON.stringify(result.data, null, 2));
        } else if (typeof result === "object" && result && "then" in result) {
          return result.then((r: any) => {
            if ("status" in r && "data" in r) {
              setLastToolOutput(JSON.stringify(r.data, null, 2));
            }
            return r;
          });
        }
        return result;
      },
    }));
  });

  const localStatus = useWebMcpTools(localTools);

  return (
    <div className="plans-surface">
      <section className="plans-hero">
        <p className="small-note">Plans and pricing</p>
        <h1 className="hero-title">Find the right plan</h1>
        <p className="hero-subtitle">Choose from Individuals and Students &amp; Teachers plans.</p>
        <div className="plans-audience-tabs">
          <button className="plans-tab plans-tab-active" type="button">Students &amp; Teachers</button>
          <button className="plans-tab" type="button">Individuals</button>
        </div>
      </section>

      <section className="plans-card-grid">
        {plansFixture.map((plan) => (
          <article key={plan.id} className="plans-card">
            <p className="small-note">{plan.audience === "student" ? "Students & Teachers" : "Individual"}</p>
            <h2>{plan.name}</h2>
            <p className="plans-price">
              {priceStateByPlan[plan.id]?.status === "loading" ? (
                <span>Loading live price…</span>
              ) : null}
              {priceStateByPlan[plan.id]?.status === "ok" ? (
                <>
                  <span>{priceStateByPlan[plan.id].formattedPrice}</span>
                  <small>/{priceStateByPlan[plan.id].billingPeriod}</small>
                </>
              ) : null}
              {priceStateByPlan[plan.id]?.status === "price_unavailable" ? (
                <span>Price unavailable</span>
              ) : null}
            </p>
            {priceStateByPlan[plan.id]?.status === "price_unavailable" ? (
              <p className="small-note">Reason: {priceStateByPlan[plan.id].reason ?? "pricing_unavailable"}</p>
            ) : null}
            <p className="small-note">{plan.studentEligible ? "Eligible with student verification" : "Standard eligibility"}</p>
            <ul className="plans-feature-list">
              {(plan.includedApps ?? []).map((app) => (
                <li key={`${plan.id}-${app}`}>{app}</li>
              ))}
            </ul>
            <div className="badge-row">
              <span className="status-badge">Generative credits: {plan.generativeCredits}</span>
            </div>
            <button type="button" className="button-link">Choose this plan</button>
          </article>
        ))}
      </section>

      <section className="preview-card">
        <h2 className="section-title">Recommendation output</h2>
        <div className="code-block">{lastToolOutput}</div>
      </section>

      <p className="plans-disclosure small-note">
        Plan information uses a public reference snapshot. Pricing is resolved at request time from live regional pricing.
      </p>

      <details className="details-pane">
        <summary>Developer details</summary>
        <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
          <ToolRegistrationStatus
            available={globalStatus.available}
            registeredTools={globalStatus.registeredTools}
          />
          <ToolRegistrationStatus available={localStatus.available} registeredTools={localStatus.registeredTools} />
        </div>
      </details>
    </div>
  );
}
