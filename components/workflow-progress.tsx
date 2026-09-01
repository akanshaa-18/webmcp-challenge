"use client";

interface WorkflowStepItem {
  id: string;
  label: string;
  subtitle: string;
}

interface WorkflowProgressProps {
  steps: WorkflowStepItem[];
  currentStepId?: string;
}

export function WorkflowProgress({ steps, currentStepId }: WorkflowProgressProps) {
  return (
    <div className="workflow-progress" role="list" aria-label="Workflow progress">
      {steps.map((step, index) => {
        const isCurrent = step.id === currentStepId;
        return (
          <div key={step.id} className="workflow-progress-step" role="listitem">
            <span className={`workflow-progress-dot ${isCurrent ? "workflow-progress-dot-current" : ""}`}>
              {isCurrent ? "●" : "○"}
            </span>
            <div>
              <p className="workflow-progress-label">{step.label}</p>
              <p className="workflow-progress-subtitle">{step.subtitle}</p>
            </div>
            {index < steps.length - 1 ? <span className="workflow-progress-line" aria-hidden="true" /> : null}
          </div>
        );
      })}
    </div>
  );
}
