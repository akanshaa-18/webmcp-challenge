"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMission } from "@/components/mission-provider";
import { plansFixture } from "@/lib/fixtures";
import { Plan } from "@/lib/types";
import { resolvePlanPrice } from "@/lib/regional-pricing";
import { getGoalsForPlan } from "@/lib/goals";

type Category = "individual" | "student";

interface PriceState {
  status: "loading" | "ok" | "unavailable";
  formattedPrice?: string;
  currency?: string;
}

const PLAN_ICONS: Record<string, string> = {
  "cc-pro-in": "/assets/adobe/products/creative-cloud-mark.svg",
  "adobe-all-apps-in": "/assets/adobe/products/creative-cloud-mark.svg",
  "adobe-student-cc-in": "/assets/adobe/products/creative-cloud-mark.svg",
  "photoshop-in": "/assets/adobe/products/photoshop-mark.svg",
  "adobe-photography-in": "/assets/adobe/products/photoshop-mark.svg",
  "premiere-in": "/assets/adobe/products/premiere-mark.svg",
  "firefly-pro-in": "/assets/adobe/products/firefly-mark.svg",
  "acrobat-pro-in": "/assets/adobe/products/acrobat-mark.svg",
  "acrobat-express-in": "/assets/adobe/products/express-mark.svg",
};

function buildCheckoutUrl(plan: Plan, country: string): string {
  if (plan.commerceAlias) {
    return `https://commerce.adobe.com/store/segmentation?pa=${plan.commerceAlias}&co=${country}&lang=en&cli=creative&ctx=if`;
  }
  return "https://www.adobe.com/creativecloud/plans.html";
}

interface PremiumPlansSectionProps {
  selectedGoalId?: string | null;
}

export function PremiumPlansSection({ selectedGoalId }: PremiumPlansSectionProps) {
  const missionStore = useMission();
  const passport = missionStore.intentPassport;
  const country = passport.region ?? "IN";

  const [activeCategory, setActiveCategory] = useState<Category>("individual");
  const [prices, setPrices] = useState<Record<string, PriceState>>({});
  const [recommendedPlan, setRecommendedPlan] = useState<any>(null);
  const [recommendedPlanPrice, setRecommendedPlanPrice] = useState<PriceState>({ status: "loading" });
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const initial: Record<string, PriceState> = {};
    for (const plan of plansFixture) {
      initial[plan.id] = { status: "loading" };
    }
    setPrices(initial);

    for (const plan of plansFixture) {
      if (!plan.osi && !plan.fragmentId) {
        setPrices((prev) => ({ ...prev, [plan.id]: { status: "unavailable" } }));
        continue;
      }
      resolvePlanPrice({ planId: plan.id, country, osi: plan.osi, fragmentId: plan.fragmentId }).then((result) => {
        if (result.status === "ok") {
          setPrices((prev) => ({
            ...prev,
            [plan.id]: { status: "ok", formattedPrice: result.data.formattedPrice, currency: result.data.currency },
          }));
        } else {
          setPrices((prev) => ({ ...prev, [plan.id]: { status: "unavailable" } }));
        }
      });
    }
  }, [country]);

  useEffect(() => {
    if (passport.comparePlanResult) {
      setRecommendedPlan(passport.comparePlanResult);
      const pricing = (passport.comparePlanResult as any)?.pricing;
      if (pricing?.formattedPrice) {
        setRecommendedPlanPrice({ status: "ok", formattedPrice: pricing.formattedPrice, currency: pricing.currency });
      } else {
        setRecommendedPlanPrice({ status: "unavailable" });
      }
    }
  }, [passport.comparePlanResult]);

  const hasToolExecution = passport.comparePlanResult || recommendedPlanPrice.status === "ok";

  const filteredPlans = plansFixture.filter((plan) =>
    activeCategory === "student" ? plan.audience === "student" : plan.audience !== "student",
  );

  return (
    <section id="plans" className="plans-section">
      <h2 className="plans-section-heading">Plans & Pricing</h2>
      <p className="plans-section-subtext">
        {!hasToolExecution
          ? "Find the right plan for how you create."
          : "Your personalized recommendation based on creative needs and location."}
      </p>

      {hasToolExecution && recommendedPlan ? (
        <>
          <div className="plans-recommendation">
            <div className="plans-rec-info">
              <h3 className="plans-rec-name">{recommendedPlan.name}</h3>
              <p className="plans-rec-reason">Covers your creative needs</p>
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
                  <a href={passport.checkoutUrl || recommendedPlan.checkoutUrl || "#"} target="_blank" rel="noopener noreferrer" className="plans-rec-cta">
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
        <>
          <div className="plans-category-tabs">
            <button
              className={`plans-category-tab${activeCategory === "individual" ? " active" : ""}`}
              onClick={() => setActiveCategory("individual")}
            >
              Individual
            </button>
            <button
              className={`plans-category-tab${activeCategory === "student" ? " active" : ""}`}
              onClick={() => setActiveCategory("student")}
            >
              Students &amp; Teachers
            </button>
          </div>

          <div className="plans-catalog">
            {filteredPlans.map((plan) => {
              const priceState = prices[plan.id];
              const iconSrc = PLAN_ICONS[plan.id];
              const checkoutUrl = buildCheckoutUrl(plan, country);
              const supportedGoals = getGoalsForPlan(plan.id);
              const isRelevant = selectedGoalId
                ? supportedGoals.some((g) => g.id === selectedGoalId)
                : false;
              const isDimmed = selectedGoalId ? !isRelevant : false;

              return (
                <a
                  key={plan.id}
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    "plans-catalog-card",
                    isRelevant ? "plans-catalog-card-relevant" : "",
                    isDimmed ? "plans-catalog-card-dimmed" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={`View ${plan.name}`}
                >
                  {iconSrc && (
                    <div className="plans-catalog-icon-wrapper">
                      <Image src={iconSrc} alt={plan.name} width={48} height={48} className="plans-catalog-icon" />
                    </div>
                  )}
                  <p className="plans-catalog-badge">
                    {plan.audience === "student" ? "Students & Teachers" : "Individual"}
                  </p>
                  <h3 className="plans-catalog-name">{plan.name}</h3>
                  <p className="plans-catalog-price">
                    {!priceState || priceState.status === "loading"
                      ? "Loading…"
                      : priceState.status === "ok"
                      ? priceState.formattedPrice
                      : "—"}
                  </p>
                  <p className="plans-catalog-period">/month</p>
                  {supportedGoals.length > 0 && (
                    <div className="plans-goal-list">
                      {supportedGoals.slice(0, 3).map((goal) => (
                        <div
                          key={goal.id}
                          className={`plans-goal-item${selectedGoalId === goal.id ? " plans-goal-item-active" : ""}`}
                        >
                          <span className="plans-goal-check">✓</span>
                          {goal.label}
                        </div>
                      ))}
                      {supportedGoals.length > 3 && (
                        <div className="plans-goal-item" style={{ color: "var(--adobe-neutral-mid)", fontStyle: "italic" }}>
                          +{supportedGoals.length - 3} more workflows
                        </div>
                      )}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
