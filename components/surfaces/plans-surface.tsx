"use client";

import { useState } from "react";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { plansFixture, userFixture } from "@/lib/fixtures";
import { comparePlanOptions, getPlanCapabilities, getPlanPrice, getRegionalPlans } from "@/lib/plans";
import { toolError } from "@/lib/errors";

export function PlansSurface() {
  const [lastToolOutput, setLastToolOutput] = useState<string>("No tool output yet.");
  const globalStatus = useGlobalWebMcpTools("Adobe Plans", "/plans");

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
        "Get regional plan price from demo snapshot data. Returns dataSource=demo_snapshot.",
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
      execute: (input: { planId?: string; region?: string }) => {
        if (!input?.planId) {
          return toolError("MISSING_REQUIRED_CONTEXT", "The planId field is required.");
        }
        const result = getPlanPrice(plansFixture, userFixture, {
          planId: input.planId,
          region: input.region,
        });
        if ("status" in result && result.status === "ok") {
          setLastToolOutput(JSON.stringify(result.data, null, 2));
        }
        return result;
      },
    },
    {
      name: "compare_plan_options",
      description:
        "Compare Adobe plans against requirements and recommend the lowest-cost qualifying option.",
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
      execute: (input: { requirements?: string[]; region?: string; student?: boolean }) => {
        const result = comparePlanOptions(plansFixture, userFixture, {
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
    <div className="surface">
      <header>
        <h1 className="section-title">Adobe Plans</h1>
        <p className="muted">Demo plan data for WebMCP prototype</p>
        <p>
          <strong>Meera</strong> • Student • Bangalore, India
        </p>
      </header>

      <ToolRegistrationStatus
        available={globalStatus.available}
        registeredTools={globalStatus.registeredTools}
      />
      <ToolRegistrationStatus available={localStatus.available} registeredTools={localStatus.registeredTools} />

      <section>
        <h2 className="section-title">Demo plan cards</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Audience</th>
              <th>Price</th>
              <th>Apps</th>
              <th>Student eligible</th>
            </tr>
          </thead>
          <tbody>
            {plansFixture.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.name}</td>
                <td>{plan.audience}</td>
                <td>
                  {plan.currency} {plan.price}/{plan.billingPeriod}
                </td>
                <td>{plan.includedApps.join(", ")}</td>
                <td>{plan.studentEligible ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="section-title">Last WebMCP tool output</h2>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>{lastToolOutput}</pre>
      </section>
    </div>
  );
}

