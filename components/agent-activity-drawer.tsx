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

  const activities = [
    {
      status: passport.userGoal ? "✓" : "◯",
      text: "Creative requirements understood",
    },
    {
      status: passport.discoveredCapabilities.length > 0 ? "✓" : "◯",
      text: "Matching Adobe products identified",
    },
    {
      status: passport.region ? "✓" : "◯",
      text: "Live regional pricing resolved",
    },
    {
      status: passport.selectedWorkflowId ? "✓" : "◯",
      text: "Workflow composed",
    },
    {
      status: passport.selectedDestination ? "✓" : "◯",
      text: "Checkout prepared",
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
            <span className="agent-activity-status">{activity.status}</span>
            <p className="agent-activity-text">{activity.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
