"use client";

import { PremiumHeader } from "@/components/premium-header";
import { PremiumHero } from "@/components/premium-hero";
import { ProductCarousel } from "@/components/product-carousel";
import { CapabilityGrid } from "@/components/capability-grid";
import { WorkflowShowcase } from "@/components/workflow-showcase";
import { PremiumPlansSection } from "@/components/premium-plans-section";
import { AgentActivityDrawer } from "@/components/agent-activity-drawer";
import { useGlobalWebMcpTools } from "@/hooks/use-global-webmcp-tools";
import { ToolRegistrationStatus } from "@/components/tool-registration-status";

export function PremiumSurface() {
  const globalStatus = useGlobalWebMcpTools("Adobe Agentic Front Door", "/cc-home");

  return (
    <>
      <PremiumHeader />
      <PremiumHero />
      <ProductCarousel />
      <CapabilityGrid />
      <WorkflowShowcase />
      <PremiumPlansSection />

      {/* Developer details drawer */}
      <div style={{ padding: "0 clamp(16px, 3vw, 48px)", maxWidth: "1440px", margin: "40px auto 0" }}>
        <details className="details-pane">
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>Developer Details</summary>
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            <ToolRegistrationStatus available={globalStatus.available} registeredTools={globalStatus.registeredTools} />
          </div>
        </details>
      </div>

      <AgentActivityDrawer />
    </>
  );
}
