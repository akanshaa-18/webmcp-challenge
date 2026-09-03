export interface SuggestedWorkflow {
  id: string;
  name: string;
  steps: string[];
  description: string;
}

export const suggestedWorkflows: SuggestedWorkflow[] = [
  {
    id: "workflow-firefly-express",
    name: "Asset adaptation flow",
    description: "Prepare an image in Firefly and adapt it in Express for downstream channels.",
    steps: ["firefly-background-transformation", "express-social-post-design"],
  },
];
