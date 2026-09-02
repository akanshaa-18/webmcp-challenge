"use client";

import { useState } from "react";
import { useMission } from "@/components/mission-provider";

export function AgentActivityDrawer() {
  const [isOpen, setIsOpen] = useState(true);
  const missionStore = useMission();
  const passport = missionStore.intentPassport;

  if (!isOpen) {
    return null;
  }

  // Only show truly verified events, not inferred state
  const activities = [
    {
      status: passport.userGoal ? "✓" : "◯",
      text: "Requirements understood",
      detail: passport.userGoal ? "(goal set)" : null,
    },
    {
      status: passport.discoveredCapabilities.length > 0 ? "✓" : "◯",
      text: "Products identified",
      detail: passport.discoveredCapabilities.length > 0 ? `(${passport.discoveredCapabilities.length} capabilities)` : null,
    },
    {
      status: passport.region ? "✓" : "◯",
      text: "Market context set",
      detail: passport.region ? `(${passport.region})` : null,
    },
    {
      status: passport.selectedWorkflowId ? "✓" : "◯",
      text: "Workflow composed",
      detail: passport.recommendedWorkflow ? `(${passport.recommendedWorkflow})` : null,
    },
    {
      status: passport.selectedDestination ? "✓" : "◯",
      text: "Checkout ready",
      detail: passport.selectedDestination ? "(link prepared)" : null,
    },
  ];

  return (
    <div className="agent-activity-drawer">
      <div className="agent-activity-header">
        <h3 className="agent-activity-title">Agent Activity</h3>
        <button
          className="agent-activity-close"
          onClick={() => setIsOpen(false)}
          aria-label="Close activity drawer"
        >
          ✕
        </button>
      </div>
      <div className="agent-activity-content">
        {activities.map((activity, idx) => (
          <div key={idx} className="agent-activity-item">
            <span className={`agent-activity-status ${activity.status === "✓" ? "completed" : ""}`}>
              {activity.status}
            </span>
            <div className="agent-activity-info">
              <p className="agent-activity-text">{activity.text}</p>
              {activity.detail && <p className="agent-activity-detail">{activity.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
