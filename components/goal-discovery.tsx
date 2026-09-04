"use client";

import { CREATIVE_GOALS, CreativeGoal } from "@/lib/goals";

interface GoalDiscoveryProps {
  selectedGoalId: string | null;
  onGoalSelect: (goalId: string | null) => void;
}

export function GoalDiscovery({ selectedGoalId, onGoalSelect }: GoalDiscoveryProps) {
  const handleSelect = (goal: CreativeGoal) => {
    const next = selectedGoalId === goal.id ? null : goal.id;
    onGoalSelect(next);
    if (next) {
      setTimeout(() => {
        document.getElementById("workflows")?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
  };

  return (
    <section id="goals" className="goals-section">
      <div className="goals-header">
        <h2 className="goals-heading">What do you want to create?</h2>
        <p className="goals-subtext">
          Select a goal to see the Adobe workflow, capabilities, and plan that can get you there.
        </p>
      </div>
      <div className="goals-grid">
        {CREATIVE_GOALS.map((goal) => {
          const isActive = selectedGoalId === goal.id;
          return (
            <button
              key={goal.id}
              className={`goal-card${isActive ? " goal-card-active" : ""}`}
              onClick={() => handleSelect(goal)}
              aria-pressed={isActive}
              aria-label={`Select goal: ${goal.label}`}
            >
              <span className="goal-card-icon">{goal.icon}</span>
              <span className="goal-card-label">{goal.label}</span>
              <span className="goal-card-workflow">{goal.workflowSummary}</span>
            </button>
          );
        })}
      </div>
      {selectedGoalId && (
        <p className="goals-hint">
          Scroll down to see your recommended workflow, relevant capabilities, and plans.
          <button className="goals-clear" onClick={() => onGoalSelect(null)}>Clear selection ×</button>
        </p>
      )}
    </section>
  );
}
