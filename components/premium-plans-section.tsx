"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMission } from "@/components/mission-provider";
import { plansFixture } from "@/lib/fixtures";
import { getPlanPrice } from "@/lib/plans";

interface PriceState {
  status: "loading" | "ok" | "price_unavailable";
  formattedPrice?: string;
  currency?: string;
  region?: string;
}

type CatalogMarket = "US" | "IN";

export function PremiumPlansSection() {
  const missionStore = useMission();
  const passport = missionStore.intentPassport;
  const [recommendedPlan, setRecommendedPlan] = useState<any>(null);
  const [recommendedPlanPrice, setRecommendedPlanPrice] = useState<PriceState>({ status: "loading" });
  const [showExplanation, setShowExplanation] = useState(false);
  const [catalogPrices, setCatalogPrices] = useState<Record<string, PriceState>>({});
  const [catalogMarket, setCatalogMarket] = useState<CatalogMarket>("US");
  const [catalogLoadingRegion, setCatalogLoadingRegion] = useState<string | null>(null);

  // Load default US catalog pricing on mount
  useEffect(() => {
    const loadCatalogPricing = async () => {
      const targetRegion = catalogMarket === "US" ? "United States" : "India";
      setCatalogLoadingRegion(targetRegion);

      const prices: Record<string, PriceState> = {};

      for (const plan of plansFixture) {
        const result = await getPlanPrice(plansFixture, { planId: plan.id, region: targetRegion });

        if (result.status === "ok") {
          prices[plan.id] = {
            status: "ok",
            formattedPrice: (result as any).data.formattedPrice,
            currency: (result as any).data.currency,
            region: targetRegion,
          };
        } else {
          prices[plan.id] = {
            status: "price_unavailable",
            region: targetRegion,
          };
        }
      }

      setCatalogPrices(prices);
      setCatalogLoadingRegion(null);
    };

    loadCatalogPricing();
  }, [catalogMarket]);

  // Use pricing from compare_plan_options result (already live pricing from WebMCP execution)
  useEffect(() => {
    if (passport.comparePlanResult) {
      setRecommendedPlan(passport.comparePlanResult);

      // Extract pricing already returned by compare_plan_options WebMCP tool
      const pricing = (passport.comparePlanResult as any)?.pricing;
      if (pricing?.formattedPrice) {
        setRecommendedPlanPrice({
          status: "ok",
          formattedPrice: pricing.formattedPrice,
          currency: pricing.currency,
        });
      } else {
        setRecommendedPlanPrice({ status: "price_unavailable" });
      }
    }
  }, [passport.comparePlanResult]);

  // Only show personalized state when actual WebMCP tool execution has occurred
  const hasToolExecution = passport.comparePlanResult || recommendedPlanPrice.status === "ok";

  // Determine which region pricing is displayed (agent personalization > catalog market)
  const displayedRegion = hasToolExecution && passport.region ? passport.region : catalogPrices[plansFixture[0]?.id]?.region;

  return (
    <section id="plans" className="plans-section">
      <h2 className="plans-section-heading">Plans & Pricing</h2>
      <p className="plans-section-subtext">
        {!hasToolExecution
          ? "Ask your assistant for a plan recommendation to see live regional pricing."
          : "Your personalized recommendation based on creative needs and location."}
      </p>

      {hasToolExecution && recommendedPlan ? (
        <>
          <div className="plans-recommendation">
            <div className="plans-rec-info">
              <h3 className="plans-rec-name">{recommendedPlan.name}</h3>
              <p className="plans-rec-reason">Covers your creative needs</p>
              <ul className="plans-rec-capabilities">
                {recommendedPlan.includedApps?.slice(0, 4).map((app: string) => (
                  <li key={app}>{app}</li>
                ))}
              </ul>
            </div>
            <div className="plans-rec-pricing">
              {recommendedPlanPrice.status === "ok" ? (
                <>
                  <p className="plans-rec-price">{recommendedPlanPrice.formattedPrice}</p>
                  <p className="plans-rec-period">/month</p>
                  <div className="plans-rec-source">
                    <div className="plans-rec-source-dot"></div>
                    Live Adobe pricing
                  </div>
                  <a href={passport.checkoutUrl || "#"} target="_blank" rel="noopener noreferrer" className="plans-rec-cta">
                    Continue to checkout →
                  </a>
                </>
              ) : (
                <>
                  <p className="plans-rec-price">—</p>
                  <p className="plans-rec-period">Price unavailable</p>
                  <button className="plans-rec-cta">
                    Learn more →
                  </button>
                </>
              )}
            </div>
          </div>

          <details className="plans-explanation" open={showExplanation}>
            <summary onClick={() => setShowExplanation(!showExplanation)} style={{ cursor: "pointer", fontWeight: 700 }}>
              Why this plan?
            </summary>
            {showExplanation && (
              <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                {passport.region && (
                  <div className="plans-explanation-row">
                    <div className="plans-explanation-label">Region</div>
                    <div className="plans-explanation-value">{passport.region}</div>
                  </div>
                )}
                {passport.audience && (
                  <div className="plans-explanation-row">
                    <div className="plans-explanation-label">Audience</div>
                    <div className="plans-explanation-value">{passport.audience}</div>
                  </div>
                )}
                {passport.requirements && passport.requirements.length > 0 && (
                  <div className="plans-explanation-row">
                    <div className="plans-explanation-label">Matched</div>
                    <div className="plans-explanation-value">{passport.requirements.slice(0, 3).join(", ")}</div>
                  </div>
                )}
              </div>
            )}
          </details>
        </>
      ) : (
        <div>
          {/* Catalog market selector */}
          <div className="plans-catalog-market-selector">
            <label htmlFor="market-select" className="plans-market-label">
              Catalog pricing:
            </label>
            <select
              id="market-select"
              className="plans-market-dropdown"
              value={catalogMarket}
              onChange={(e) => setCatalogMarket(e.target.value as CatalogMarket)}
              disabled={catalogLoadingRegion !== null}
            >
              <option value="US">United States</option>
              <option value="IN">India</option>
            </select>
            <span className="plans-pricing-source">
              ● Live pricing · {catalogMarket === "US" ? "United States" : "India"}
            </span>
          </div>

          {/* Plans catalog */}
          <div className="plans-catalog">
            {plansFixture.map((plan) => {
              const planIcons: Record<string, { src: string; alt: string }> = {
                "photo_plus": { src: "/assets/adobe/photoshop-icon.svg", alt: "Photoshop" },
                "illustrator_plus": { src: "/assets/adobe/illustrator-icon.svg", alt: "Illustrator" },
                "creative_cloud": { src: "/assets/adobe/creative-community.jpg", alt: "Creative Cloud" },
              };
              const planIcon = planIcons[plan.id];
              const priceState = catalogPrices[plan.id];
              const isLoading = catalogLoadingRegion !== null;

              return (
                <div key={plan.id} className="plans-catalog-card" style={{ opacity: isLoading ? 0.6 : 1 }}>
                  {planIcon && (
                    <div className="plans-catalog-icon-wrapper">
                      <Image
                        src={planIcon.src}
                        alt={planIcon.alt}
                        width={48}
                        height={48}
                        className="plans-catalog-icon"
                      />
                    </div>
                  )}
                  <p className="plans-catalog-badge">{plan.audience === "student" ? "Students & Teachers" : "Individual"}</p>
                  <h3 className="plans-catalog-name">{plan.name}</h3>
                  <p className="plans-catalog-price">
                    {isLoading ? "Loading…" : priceState?.status === "ok" ? priceState.formattedPrice : "Price unavailable"}
                  </p>
                  <p className="plans-catalog-period">/month</p>
                  <ul className="plans-catalog-apps">
                    {plan.includedApps.slice(0, 3).map((app) => (
                      <li key={app}>{app}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p style={{ fontSize: "0.8rem", color: "var(--adobe-neutral-mid)", marginTop: 16, textAlign: "center" }}>
        {hasToolExecution && recommendedPlan
          ? "Personalized plan based on your creative needs. Live pricing from Adobe commerce."
          : "Plan options. Ask your assistant about your creative goals and location for a personalized recommendation."}
      </p>
    </section>
  );
}
