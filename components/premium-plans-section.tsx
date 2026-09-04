"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMission } from "@/components/mission-provider";
import { plansFixture } from "@/lib/fixtures";
import { Plan } from "@/lib/types";
import { resolvePlanPrice } from "@/lib/regional-pricing";
import { getGoalsForPlan } from "@/lib/goals";

type Category = "individual" | "student" | "business" | "education";

interface PriceState {
  status: "loading" | "ok" | "unavailable";
  formattedPrice?: string;
  currency?: string;
}

const PLAN_ICONS: Record<string, string[]> = {
  // Creative Cloud (multi-app bundles show representative icons)
  "cc-pro-in": ["/assets/adobe/products/creative-cloud-mark.svg", "/assets/adobe/products/photoshop-mark.svg", "/assets/adobe/products/illustrator-mark.svg", "/assets/adobe/products/premiere-mark.svg"],
  "cc-pro-us": ["/assets/adobe/products/creative-cloud-mark.svg", "/assets/adobe/products/photoshop-mark.svg", "/assets/adobe/products/illustrator-mark.svg", "/assets/adobe/products/premiere-mark.svg"],
  "cc-pro-teams": ["/assets/adobe/products/creative-cloud-mark.svg", "/assets/adobe/products/photoshop-mark.svg", "/assets/adobe/products/illustrator-mark.svg", "/assets/adobe/products/premiere-mark.svg"],
  "cc-standard-in": ["/assets/adobe/products/creative-cloud-mark.svg", "/assets/adobe/products/photoshop-mark.svg", "/assets/adobe/products/illustrator-mark.svg"],
  "cc-standard-us": ["/assets/adobe/products/creative-cloud-mark.svg", "/assets/adobe/products/photoshop-mark.svg", "/assets/adobe/products/illustrator-mark.svg"],
  "cc-standard-teams": ["/assets/adobe/products/creative-cloud-mark.svg", "/assets/adobe/products/photoshop-mark.svg", "/assets/adobe/products/illustrator-mark.svg"],
  "adobe-all-apps-in": ["/assets/adobe/products/creative-cloud-mark.svg", "/assets/adobe/products/photoshop-mark.svg", "/assets/adobe/products/illustrator-mark.svg", "/assets/adobe/products/premiere-mark.svg"],
  "adobe-student-cc-in": ["/assets/adobe/products/creative-cloud-mark.svg", "/assets/adobe/products/photoshop-mark.svg", "/assets/adobe/products/illustrator-mark.svg", "/assets/adobe/products/premiere-mark.svg"],
  "cc-edu-apac": ["/assets/adobe/products/creative-cloud-mark.svg", "/assets/adobe/products/photoshop-mark.svg", "/assets/adobe/products/illustrator-mark.svg", "/assets/adobe/products/premiere-mark.svg"],
  "cc-edu-us": ["/assets/adobe/products/creative-cloud-mark.svg", "/assets/adobe/products/photoshop-mark.svg", "/assets/adobe/products/illustrator-mark.svg", "/assets/adobe/products/premiere-mark.svg"],
  // Photoshop
  "photoshop-in": ["/assets/adobe/products/photoshop-mark.svg"],
  "photoshop-us": ["/assets/adobe/products/photoshop-mark.svg"],
  "photoshop-teams": ["/assets/adobe/products/photoshop-mark.svg"],
  // Photography bundle: Photoshop + Lightroom
  "adobe-photography-in": ["/assets/adobe/products/photoshop-mark.svg", "/assets/adobe/products/lightroom-mark.svg"],
  "photography-us": ["/assets/adobe/products/photoshop-mark.svg", "/assets/adobe/products/lightroom-mark.svg"],
  // Premiere
  "premiere-in": ["/assets/adobe/products/premiere-mark.svg"],
  "premiere-us": ["/assets/adobe/products/premiere-mark.svg"],
  "premiere-teams": ["/assets/adobe/products/premiere-mark.svg"],
  "premiere-rush-in": ["/assets/adobe/products/premiere-rush-mark.svg"],
  // Firefly
  "firefly-pro-in": ["/assets/adobe/products/firefly-mark.svg"],
  "firefly-standard": ["/assets/adobe/products/firefly-mark.svg"],
  "firefly-pro-plus": ["/assets/adobe/products/firefly-mark.svg"],
  "firefly-premium": ["/assets/adobe/products/firefly-mark.svg"],
  // Acrobat
  "acrobat-pro-in": ["/assets/adobe/products/acrobat-mark.svg"],
  "acrobat-pro-us": ["/assets/adobe/products/acrobat-mark.svg"],
  "acrobat-pro-teams": ["/assets/adobe/products/acrobat-mark.svg"],
  // Acrobat Studio: Acrobat + Express
  "acrobat-studio-in": ["/assets/adobe/products/acrobat-mark.svg", "/assets/adobe/products/express-mark.svg"],
  "acrobat-studio-us": ["/assets/adobe/products/acrobat-mark.svg", "/assets/adobe/products/express-mark.svg"],
  "acrobat-studio-teams": ["/assets/adobe/products/acrobat-mark.svg", "/assets/adobe/products/express-mark.svg"],
  "acrobat-standard-in": ["/assets/adobe/products/acrobat-standard-mark.svg"],
  "acrobat-standard-us": ["/assets/adobe/products/acrobat-standard-mark.svg"],
  // AI Assistant for Acrobat: Acrobat + AI
  "ai-assistant-acrobat-in": ["/assets/adobe/products/acrobat-mark.svg"],
  "ai-assistant-acrobat-us": ["/assets/adobe/products/acrobat-mark.svg"],
  // Express
  "acrobat-express-in": ["/assets/adobe/products/express-mark.svg"],
  "acrobat-express-us": ["/assets/adobe/products/express-mark.svg"],
  "acrobat-express-teams": ["/assets/adobe/products/express-mark.svg"],
  "adobe-express-in": ["/assets/adobe/products/express-mark.svg"],
  "adobe-express-us": ["/assets/adobe/products/express-mark.svg"],
  // Illustrator
  "illustrator-in": ["/assets/adobe/products/illustrator-mark.svg"],
  "illustrator-us": ["/assets/adobe/products/illustrator-mark.svg"],
  "illustrator-teams": ["/assets/adobe/products/illustrator-mark.svg"],
  // After Effects
  "after-effects-in": ["/assets/adobe/products/after-effects-mark.svg"],
  "after-effects-us": ["/assets/adobe/products/after-effects-mark.svg"],
  "after-effects-teams": ["/assets/adobe/products/after-effects-mark.svg"],
  // InDesign
  "indesign-in": ["/assets/adobe/products/indesign-mark.svg"],
  "indesign-us": ["/assets/adobe/products/indesign-mark.svg"],
  "indesign-teams": ["/assets/adobe/products/indesign-mark.svg"],
  // Lightroom
  "lightroom-in": ["/assets/adobe/products/lightroom-mark.svg"],
  "lightroom-us": ["/assets/adobe/products/lightroom-mark.svg"],
  "lightroom-teams": ["/assets/adobe/products/lightroom-mark.svg"],
  "lightroom-classic-in": ["/assets/adobe/products/lightroom-classic-mark.svg"],
  // Animate
  "animate-in": ["/assets/adobe/products/animate-mark.svg"],
  "animate-us": ["/assets/adobe/products/animate-mark.svg"],
  "animate-teams": ["/assets/adobe/products/animate-mark.svg"],
  // Audition
  "audition-in": ["/assets/adobe/products/audition-mark.svg"],
  "audition-us": ["/assets/adobe/products/audition-mark.svg"],
  "audition-teams": ["/assets/adobe/products/audition-mark.svg"],
  // Dreamweaver
  "dreamweaver-in": ["/assets/adobe/products/dreamweaver-mark.svg"],
  "dreamweaver-us": ["/assets/adobe/products/dreamweaver-mark.svg"],
  // InCopy
  "incopy-in": ["/assets/adobe/products/incopy-mark.svg"],
  // Substance 3D
  "substance-3d-in": ["/assets/adobe/products/substance-3d-mark.svg"],
  "substance-3d-us": ["/assets/adobe/products/substance-3d-mark.svg"],
  // Stock
  "stock": ["/assets/adobe/products/stock-mark.svg"],
  "stock-ai-studio": ["/assets/adobe/products/stock-mark.svg"],
  // Frame.io
  "frameio-teams": ["/assets/adobe/products/frameio-mark.svg"],
  // Others
  "character-animator-in": ["/assets/adobe/products/character-animator-mark.svg"],
  "fresco-in": ["/assets/adobe/products/fresco-mark.svg"],
  "xd-in": ["/assets/adobe/products/xd-mark.svg"],
  "dimension-in": ["/assets/adobe/products/dimension-mark.svg"],
  "media-encoder-in": ["/assets/adobe/products/media-encoder-mark.svg"],
  "bridge-in": ["/assets/adobe/products/bridge-mark.svg"],
};

// Apps included in multi-app plans (shown as a subtitle on the card)
const PLAN_INCLUDED_APPS: Record<string, string> = {
  "adobe-photography-in": "Photoshop + Lightroom",
  "cc-pro-in": "20+ creative apps · AI features",
  "adobe-all-apps-in": "20+ creative apps",
  "adobe-student-cc-in": "20+ creative apps",
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
  const [showAllPlans, setShowAllPlans] = useState(false);

  const INITIAL_VISIBLE = 4;

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
      resolvePlanPrice({ planId: plan.id, country, osi: plan.osi, fragmentId: plan.fragmentId, promotionCode: plan.promotionCode }).then((result) => {
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

  const filteredPlans = plansFixture.filter((plan) => {
    const inRegion = plan.supportedRegions.includes(country);
    const hasPricing = !!(plan.osi || plan.fragmentId);
    return inRegion && hasPricing && plan.audience === activeCategory;
  });

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
              onClick={() => { setActiveCategory("individual"); setShowAllPlans(false); }}
            >
              Individual
            </button>
            <button
              className={`plans-category-tab${activeCategory === "student" ? " active" : ""}`}
              onClick={() => { setActiveCategory("student"); setShowAllPlans(false); }}
            >
              Students &amp; Teachers
            </button>
            <button
              className={`plans-category-tab${activeCategory === "business" ? " active" : ""}`}
              onClick={() => setActiveCategory("business")}
            >
              Business
            </button>
            <button
              className={`plans-category-tab${activeCategory === "education" ? " active" : ""}`}
              onClick={() => { setActiveCategory("education"); setShowAllPlans(false); }}
            >
              Schools &amp; Universities
            </button>
          </div>

          <div className="plans-catalog">
            {(showAllPlans ? filteredPlans : filteredPlans.slice(0, INITIAL_VISIBLE)).map((plan) => {
              const priceState = prices[plan.id];
              const iconSrcs = PLAN_ICONS[plan.id] ?? [];
              const includedApps = PLAN_INCLUDED_APPS[plan.id];
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
                  {iconSrcs.length > 0 && (
                    <div className={`plans-catalog-icon-wrapper${iconSrcs.length > 1 ? " plans-catalog-icon-wrapper-multi" : ""}`}>
                      {iconSrcs.map((src, i) => (
                        <Image key={i} src={src} alt={i === 0 ? plan.name : ""} width={40} height={40} className="plans-catalog-icon" />
                      ))}
                    </div>
                  )}
                  <h3 className="plans-catalog-name">{plan.name}</h3>
                  {includedApps && (
                    <p className="plans-catalog-apps-line">{includedApps}</p>
                  )}
                  <p className="plans-catalog-price">
                    {!priceState || priceState.status === "loading"
                      ? "Loading…"
                      : priceState.status === "ok"
                      ? <>{priceState.formattedPrice}<span className="plans-catalog-period">/mo</span></>
                      : "—"}
                  </p>
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
          {filteredPlans.length > INITIAL_VISIBLE && (
            <button
              className="plans-view-more-btn"
              onClick={() => setShowAllPlans((v) => !v)}
            >
              {showAllPlans
                ? "Show less"
                : `View ${filteredPlans.length - INITIAL_VISIBLE} more plans`}
              <span>{showAllPlans ? "↑" : "↓"}</span>
            </button>
          )}
        </>
      )}
    </section>
  );
}
