"use client";

import { useEffect, useState } from "react";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { plansFixture, userFixture } from "@/lib/fixtures";
import { comparePlanOptions, getPlanCapabilities, getPlanPrice, getRegionalPlans } from "@/lib/plans";
import { toolError } from "@/lib/errors";

interface PriceViewState {
  status: "loading" | "ok" | "price_unavailable";
  formattedPrice?: string;
  currency?: string;
  amount?: number;
  billingPeriod?: string;
  reason?: string;
}

export function PlansSurface() {
  const [lastToolOutput, setLastToolOutput] = useState<string>("No tool output yet.");
  const [priceStateByPlan, setPriceStateByPlan] = useState<Record<string, PriceViewState>>(
    plansFixture
      .filter((plan) => plan.region === userFixture.region)
      .reduce<Record<string, PriceViewState>>((acc, plan) => {
        acc[plan.id] = { status: "loading" };
        return acc;
      }, {}),
  );
  const globalStatus = useGlobalWebMcpTools("Adobe Plans", "/plans");

  useEffect(() => {
    let cancelled = false;
    const relevantPlans = plansFixture.filter((plan) => plan.region === userFixture.region);

    const load = async () => {
      const resolved = await Promise.all(
        relevantPlans.map(async (plan) => {
          const result = await getPlanPrice(plansFixture, userFixture, {
            planId: plan.id,
            region: userFixture.region,
          });
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

  const [localTools] = useState(() => [
    {
      name: "get_regional_plans",
      description:
        "Get structured Adobe plan options by region and audience from demo plan data for WebMCP prototype.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: {
          region: {
            type: "string",
            description: "Optional. Defaults to Meera's region from persisted user context.",
          },
          audience: {
            type: "string",
            description: "Optional. Example values: student, individual, professional.",
          },
        },
      },
      execute: (input: { region?: string; audience?: string }) => {
        const result = getRegionalPlans(plansFixture, userFixture, input ?? {});
        setLastToolOutput(JSON.stringify(result.data, null, 2));
        return result;
      },
    },
    {
      name: "get_plan_capabilities",
      description: "Get structured capabilities and included apps for one Adobe plan.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: {
          planId: { type: "string" },
        },
        required: ["planId"],
      },
      execute: (input: { planId?: string }) => {
        if (!input?.planId) {
          return toolError("MISSING_REQUIRED_CONTEXT", "The planId field is required.");
        }
        const result = getPlanCapabilities(plansFixture, input.planId);
        if ("status" in result && result.status === "ok") {
          setLastToolOutput(JSON.stringify(result.data, null, 2));
        }
        return result;
      },
    },
    {
      name: "get_plan_price",
      description:
        "Get regional plan price from live regional pricing data (MAS fragment → offer selector → regional commerce response).",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: {
          planId: { type: "string" },
          region: {
            type: "string",
            description: "Optional. Defaults to Meera's region from persisted user context.",
          },
        },
        required: ["planId"],
      },
      execute: async (input: { planId?: string; region?: string }) => {
        if (!input?.planId) {
          return toolError("MISSING_REQUIRED_CONTEXT", "The planId field is required.");
        }
        const result = await getPlanPrice(plansFixture, userFixture, {
          planId: input.planId,
          region: input.region,
        });
        if ("status" in result && "data" in result) {
          setLastToolOutput(JSON.stringify(result.data, null, 2));
        }
        return result;
      },
    },
    {
      name: "compare_plan_options",
      description:
        "Compare Adobe plans against requirements and recommend the lowest-cost qualifying option using live regional pricing.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: {
          requirements: { type: "array", items: { type: "string" } },
          region: {
            type: "string",
            description: "Optional. Defaults to Meera's region from persisted user context.",
          },
          student: {
            type: "boolean",
            description: "Optional. Defaults to Meera's student status from persisted user context.",
          },
        },
        required: ["requirements"],
      },
      execute: async (input: { requirements?: string[]; region?: string; student?: boolean }) => {
        const result = await comparePlanOptions(plansFixture, userFixture, {
          requirements: input?.requirements ?? [],
          region: input?.region,
          student: input?.student,
        });
        if ("status" in result && result.status === "ok") {
          setLastToolOutput(JSON.stringify(result.data, null, 2));
        }
        return result;
      },
    },
  ]);

  const localStatus = useWebMcpTools(localTools);

  return (
    <div className="plans-surface">
      <section className="plans-hero">
        <p className="small-note">Plans and pricing</p>
        <h1 className="hero-title">Find the right plan</h1>
        <p className="hero-subtitle">Choose from Individuals, Business, and Students & Teachers plans.</p>
        <div className="plans-audience-tabs">
          <button className="plans-tab plans-tab-active" type="button">Students & Teachers</button>
          <button className="plans-tab" type="button">Individuals</button>
          <button className="plans-tab" type="button">Business</button>
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
              {plan.includedApps.map((app) => (
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
