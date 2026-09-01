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
        <p><strong>Workflow</strong>: {passport.recommendedWorkflow ?? "Not composed"}</p>
        <p><strong>Requirements</strong>: {passport.requirements.join(", ") || "Not set"}</p>
        <p><strong>Context</strong>: {passport.audience ?? "student"} · {passport.region ?? "IN"}</p>
        <p><strong>Current</strong>: {currentLabel}</p>
      </div>
    </article>
  );
}
