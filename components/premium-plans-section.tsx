"use client";

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

  // Load recommended plan if we have session context
  useEffect(() => {
    const loadRecommendation = async () => {
      if (!passport.region && !passport.audience) {
        return;
      }

      const sessionContext = readSessionContext();
      const result = await comparePlanOptions(
        plansFixture,
        {
          requirements: passport.requirements || ["photo editing", "creative design"],
          region: passport.region,
          audience: passport.audience,
        },
        sessionContext,
      );

      if (result.status === "ok" && result.data.recommendedPlan) {
        setRecommendedPlan(result.data.recommendedPlan);

        // Load price for recommended plan
        const priceResult = await getPlanPrice(
          plansFixture,
          { planId: result.data.recommendedPlan.planId, region: passport.region },
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
      }
    };

    loadRecommendation();
  }, [passport.region, passport.audience, passport.requirements]);

  // Default student plan when no recommendation
  const displayPlan = recommendedPlan || {
    planId: "adobe-student-cc-in",
    name: "Creative Cloud — Students",
    description: "All Adobe creative apps with Generative Credits for AI-powered creativity",
    includedApps: ["Photoshop", "Illustrator", "Premiere Pro", "XD", "Firefly"],
  };

  const displayPrice = recommendedPlanPrice;
  const hasContext = passport.region || passport.audience;

  return (
    <section id="plans" className="plans-section">
      <h2 className="plans-section-heading">Plans & Pricing</h2>
      <p className="plans-section-subtext">
        {!hasContext
          ? "Ask your AI assistant about your region and whether you're a student to get a personalized plan recommendation with live regional pricing."
          : "Your recommendation based on context provided to your AI assistant."}
      </p>

      {hasContext && (
        <>
          <div className="plans-recommendation">
            <div className="plans-rec-info">
              <h3 className="plans-rec-name">{displayPlan.name}</h3>
              <p className="plans-rec-reason">Covers your creative needs</p>
              <ul className="plans-rec-capabilities">
                {displayPlan.includedApps?.slice(0, 4).map((app: string) => (
                  <li key={app}>{app}</li>
                ))}
              </ul>
            </div>
            <div className="plans-rec-pricing">
              {displayPrice.status === "ok" ? (
                <>
                  <p className="plans-rec-price">{displayPrice.formattedPrice}</p>
                  <p className="plans-rec-period">/month</p>
                  <div className="plans-rec-source">
                    <div className="plans-rec-source-dot"></div>
                    Live Adobe pricing
                  </div>
                  <button className="plans-rec-cta">
                    Continue with Adobe →
                  </button>
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
      )}

      <p style={{ fontSize: "0.8rem", color: "var(--adobe-neutral-mid)", marginTop: 16 }}>
        Recommendation based on your creative needs and region. Pricing resolved from live regional Adobe commerce.
      </p>
    </section>
  );
}
