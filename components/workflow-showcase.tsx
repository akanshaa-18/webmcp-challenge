"use client";

interface WorkflowExample {
  id: string;
  steps: { icon: string; title: string; task: string }[];
  description: string;
}

const WORKFLOW_EXAMPLES: WorkflowExample[] = [
  {
    id: "social-content",
    description: "E-commerce to social content creation",
    steps: [
      { icon: "📸", title: "Firefly", task: "Transform product image" },
      { icon: "🎨", title: "Photoshop", task: "Refine creative asset" },
      { icon: "📱", title: "Express", task: "Create social post" },
    ],
  },
];

export function WorkflowShowcase() {
  return (
    <section id="workflows" className="workflow-container">
      <h2 className="workflow-heading">Cross-Product Workflows</h2>
      <div className="workflow-visualization">
        {WORKFLOW_EXAMPLES.map((workflow) => (
          <div key={workflow.id}>
            <div className="workflow-steps">
              {workflow.steps.map((step, index) => (
                <div key={index} className="workflow-step">
                  <div className="workflow-step-icon">{step.icon}</div>
                  <h3 className="workflow-step-title">{step.title}</h3>
                  <p className="workflow-step-task">{step.task}</p>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", color: "#757575", fontSize: "0.9rem", margin: "16px 0 0" }}>
              {workflow.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
