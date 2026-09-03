"use client";

import Image from "next/image";
import { useMission } from "@/components/mission-provider";
import { CREATIVE_GOALS } from "@/lib/goals";

interface WorkflowStep {
  productName: string;
  initials: string;
  color: string;
  task: string;
  receives?: string;
  produces: string;
  destinationUrl?: string;
}

interface WorkflowShowcaseProps {
  selectedGoalId?: string | null;
}

interface WorkflowExample {
  id: string;
  description: string;
  steps: WorkflowStep[];
}

const DEFAULT_WORKFLOW: WorkflowExample = {
  id: "social-content",
  description: "E-commerce to social content creation",
  steps: [
    {
      productName: "Firefly",
      initials: "Ff",
      color: "#FF4B4B",
      task: "Transform source image",
      receives: "Product photograph",
      produces: "Enhanced variant",
    },
    {
      productName: "Photoshop",
      initials: "Ps",
      color: "#001AFF",
      task: "Refine creative asset",
      receives: "Enhanced variant",
      produces: "Refined composition",
    },
    {
      productName: "Express",
      initials: "Ex",
      color: "#FF0099",
      task: "Create social post",
      receives: "Refined composition",
      produces: "Social-ready content",
    },
  ],
};

export function WorkflowShowcase({ selectedGoalId }: WorkflowShowcaseProps) {
  const missionStore = useMission();
  const passport = missionStore.intentPassport;

  const selectedGoal = selectedGoalId ? CREATIVE_GOALS.find((g) => g.id === selectedGoalId) ?? null : null;

  // Priority: agent workflow > selected goal > default
  const workflowSteps = passport.actualWorkflowSteps ?? (selectedGoal?.workflowSteps ?? DEFAULT_WORKFLOW.steps);
  const workflow: WorkflowExample = passport.actualWorkflowSteps
    ? { id: "agent-workflow", description: passport.recommendedWorkflow || "Composed workflow", steps: workflowSteps }
    : selectedGoal
    ? { id: selectedGoal.id, description: `${selectedGoal.workflowPhases} — ${selectedGoal.description}`, steps: selectedGoal.workflowSteps }
    : DEFAULT_WORKFLOW;

  const getProductIcon = (productName: string) => {
    const iconMap: Record<string, string> = {
      Photoshop: "/assets/adobe/photoshop-icon.svg",
      Illustrator: "/assets/adobe/illustrator-icon.svg",
      Firefly: "/assets/adobe/firefly-icon.svg",
      Express: "/assets/adobe/express-icon.svg",
      Premiere: "/assets/adobe/premiere-icon.svg",
      "Premiere Pro": "/assets/adobe/premiere-icon.svg",
    };
    return iconMap[productName];
  };

  return (
    <section id="workflows" className="workflow-container">
      <div className="workflow-background">
        <Image
          src="/assets/adobe/creative-community.jpg"
          alt="Creative community"
          fill
          quality={75}
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
        />
        <div className="workflow-background-overlay"></div>
      </div>
      <h2 className="workflow-heading">
        {passport.workflowFromTool
          ? "Your Creative Workflow"
          : selectedGoal
          ? `Recommended Workflow: ${selectedGoal.label}`
          : "Workflow Example"}
      </h2>
      <div className="workflow-visualization">
        <div className="workflow-inner">
          <div className="workflow-steps-grid">
            {workflow.steps.map((step, index) => {
              const iconPath = getProductIcon(step.productName);
              const isLast = index === workflow.steps.length - 1;
              return (
                <div key={index} className="workflow-step">
                  {!isLast && <div className="workflow-connector"></div>}
                  <div className="workflow-step-icon-container">
                    {iconPath ? (
                      <Image src={iconPath} alt={step.productName} width={32} height={32} />
                    ) : (
                      <div className="workflow-step-mark" style={{ backgroundColor: step.color }}>
                        {step.initials}
                      </div>
                    )}
                  </div>
                  <h3 className="workflow-step-title">{step.productName}</h3>
                  <p className="workflow-step-action">{step.task}</p>
                  {step.receives && (
                    <div className="workflow-step-detail">
                      <span className="workflow-detail-label">Receives:</span>
                      <span>{step.receives}</span>
                    </div>
                  )}
                  <div className="workflow-step-detail">
                    <span className="workflow-detail-label">Produces:</span>
                    <span>{step.produces}</span>
                  </div>
                  {step.destinationUrl && (
                    <a href={step.destinationUrl} target="_blank" rel="noopener noreferrer" className="workflow-step-action" style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                      Start in {step.productName} →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          <p className="workflow-description">{workflow.description}</p>
        </div>
      </div>
    </section>
  );
}
