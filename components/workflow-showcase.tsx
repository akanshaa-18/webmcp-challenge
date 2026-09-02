"use client";

interface WorkflowStep {
  productName: string;
  initials: string;
  color: string;
  task: string;
  receives?: string;
  produces: string;
}

interface WorkflowExample {
  id: string;
  description: string;
  steps: WorkflowStep[];
}

const WORKFLOW_EXAMPLES: WorkflowExample[] = [
  {
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
  },
];

export function WorkflowShowcase() {
  return (
    <section id="workflows" className="workflow-container">
      <h2 className="workflow-heading">Cross-Product Workflow</h2>
      <div className="workflow-visualization">
        {WORKFLOW_EXAMPLES.map((workflow) => (
          <div key={workflow.id} className="workflow-inner">
            <div className="workflow-steps-grid">
              {workflow.steps.map((step, index) => (
                <div key={index}>
                  {index > 0 && <div className="workflow-connector"></div>}
                  <div className="workflow-step">
                    <div className="workflow-step-mark" style={{ backgroundColor: step.color }}>
                      {step.initials}
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
                  </div>
                </div>
              ))}
            </div>
            <p className="workflow-description">{workflow.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
