"use client";

import { IntentPassport } from "@/lib/types";

interface IntentPassportCardProps {
  passport: IntentPassport;
  currentLabel: string;
}

export function IntentPassportCard({ passport, currentLabel }: IntentPassportCardProps) {
  return (
    <article className="frontdoor-card">
      <h2>Intent Passport</h2>
      <div className="frontdoor-activity-list">
        <p><strong>Goal</strong>: {passport.userGoal}</p>
        <p><strong>Recommended workflow</strong>: {passport.recommendedWorkflow ?? "Not composed"}</p>
        <p><strong>Requirements</strong>: {passport.requirements.join(", ") || "Not set"}</p>
        <p><strong>Context</strong>: {passport.audience ?? "Not provided"} · {passport.region ?? "Not provided"}</p>
        <p><strong>Current</strong>: {currentLabel}</p>
        <p><strong>Recommended starting product</strong>: {passport.selectedProducts[0] ?? "Not selected"}</p>
        <p><strong>Destination</strong>: {passport.selectedDestination ?? "Not selected"}</p>
      </div>
    </article>
  );
}
