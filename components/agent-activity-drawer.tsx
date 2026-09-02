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

  // Display real WebMCP execution events in chronological order
  const hasExecutions = passport.executionHistory && passport.executionHistory.length > 0;

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
        {!hasExecutions ? (
          <div className="agent-activity-empty">
            <p style={{ color: "var(--adobe-neutral-mid)", fontSize: "0.9rem", margin: 0 }}>
              Awaiting agent interaction...
            </p>
          </div>
        ) : (
          <>
            {passport.executionHistory
              .sort((a, b) => a.order - b.order)
              .map((event) => (
                <div key={`${event.toolName}-${event.order}`} className="agent-activity-item">
                  <span className={`agent-activity-status ${event.status === "success" ? "completed" : event.status === "error" ? "error" : ""}`}>
                    {event.status === "success" ? "✓" : event.status === "error" ? "✕" : "◯"}
                  </span>
                  <div className="agent-activity-info">
                    <p className="agent-activity-text">{event.summary || event.toolName}</p>
                    {event.status === "error" && event.errorMessage && (
                      <p className="agent-activity-detail" style={{ color: "var(--warning)" }}>
                        {event.errorMessage}
                      </p>
                    )}
                    {event.completedAt && (
                      <p className="agent-activity-detail" style={{ fontSize: "0.75rem", color: "var(--adobe-muted)" }}>
                        {new Date(event.completedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
