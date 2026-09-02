"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMission } from "@/components/mission-provider";
import { plansFixture } from "@/lib/fixtures";
import { getPlanPrice, comparePlanOptions, SessionContext } from "@/lib/plans";
import { getMissionRuntime } from "@/lib/mission-runtime";

interface PriceState {
  status: "loading" | "ok" | "price_unavailable";
  formattedPrice?: string;
  currency?: string;
}

function readSessionContext(): SessionContext {
  const runtime = getMissionRuntime();
  return {
    region: runtime?.intentPassport.region,
    audience: runtime?.intentPassport.audience,
  };
}

export function PremiumPlansSection() {
  const missionStore = useMission();
  const passport = missionStore.intentPassport;
  const [recommendedPlan, setRecommendedPlan] = useState<any>(null);
  const [recommendedPlanPrice, setRecommendedPlanPrice] = useState<PriceState>({ status: "loading" });
  const [showExplanation, setShowExplanation] = useState(false);
  const [catalogPrices, setCatalogPrices] = useState<Record<string, PriceState>>({});

  // Load catalog prices (initial state - no personalization)
  useEffect(() => {
    const loadCatalogPrices = async () => {
      const prices: Record<string, PriceState> = {};
      for (const plan of plansFixture) {
        const result = await getPlanPrice(
          plansFixture,
          { planId: plan.id, region: plan.supportedRegions[0] },
          readSessionContext(),
        );
        if (result.status === "ok") {
          prices[plan.id] = {
            status: "ok",
            formattedPrice: result.data.formattedPrice,
            currency: result.data.currency,
          };
        } else {
          prices[plan.id] = { status: "price_unavailable" };
        }
      }
      setCatalogPrices(prices);
    };
    loadCatalogPrices();
  }, []);

  // Load recommended plan if we have actual compare_plan_options result from agent
  useEffect(() => {
    if (passport.comparePlanResult) {
      setRecommendedPlan(passport.comparePlanResult);

      const loadPrice = async () => {
        const sessionContext = readSessionContext();
        const planId = passport.comparePlanResult?.planId;
        if (!planId || !passport.region) return;

        const priceResult = await getPlanPrice(
          plansFixture,
          { planId, region: passport.region },
          sessionContext,
        );

        if (priceResult.status === "ok") {
          setRecommendedPlanPrice({
            status: "ok",
            formattedPrice: priceResult.data.formattedPrice,
            currency: priceResult.data.currency,
          });
        } else {
          setRecommendedPlanPrice({ status: "price_unavailable" });
        }
      };

      loadPrice();
    }
  }, [passport.comparePlanResult]);

  const hasContext = passport.region || passport.audience;

  return (
    <section id="plans" className="plans-section">
      <h2 className="plans-section-heading">Plans & Pricing</h2>
      <p className="plans-section-subtext">
        {!hasContext
          ? "Current regional pricing appears when your assistant knows your market."
          : "Your recommendation based on context provided to your assistant."}
      </p>

      {hasContext && recommendedPlan ? (
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
                    Continue with Adobe →
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
        <div className="plans-catalog">
          {plansFixture.map((plan) => {
            const planIcons: Record<string, { src: string; alt: string }> = {
              "photo_plus": { src: "/assets/adobe/photoshop-icon.svg", alt: "Photoshop" },
              "illustrator_plus": { src: "/assets/adobe/illustrator-icon.svg", alt: "Illustrator" },
              "creative_cloud": { src: "/assets/adobe/creative-community.jpg", alt: "Creative Cloud" },
            };
            const planIcon = planIcons[plan.id];
            return (
              <div key={plan.id} className="plans-catalog-card">
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
                  {catalogPrices[plan.id]?.status === "ok"
                    ? catalogPrices[plan.id].formattedPrice
                    : "—"}
                </p>
                <p className="plans-catalog-period">/month · {plan.supportedRegions[0]}</p>
                <ul className="plans-catalog-apps">
                  {plan.includedApps.slice(0, 3).map((app) => (
                    <li key={app}>{app}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: "0.8rem", color: "var(--adobe-neutral-mid)", marginTop: 16, textAlign: "center" }}>
        {hasContext && recommendedPlan
          ? "Recommendation based on your creative needs and region. Pricing resolved from live regional Adobe commerce."
          : "Plan information and reference pricing. Ask your assistant about your market and needs for a personalized recommendation."}
      </p>
    </section>
  );
}
