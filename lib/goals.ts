export interface GoalWorkflowStep {
  productName: string;
  initials: string;
  color: string;
  task: string;
  receives?: string;
  produces: string;
}

export interface CreativeGoal {
  id: string;
  label: string;
  icon: string;
  description: string;
  workflowSummary: string;
  workflowPhases: string;
  workflowSteps: GoalWorkflowStep[];
  capabilityIds: string[];
  planIds: string[];
}

export const CREATIVE_GOALS: CreativeGoal[] = [
  {
    id: "social-campaign",
    label: "Social Campaign",
    icon: "📱",
    description: "Create scroll-stopping social content at scale",
    workflowSummary: "Firefly → Photoshop → Express",
    workflowPhases: "Generate → Refine → Adapt",
    workflowSteps: [
      { productName: "Firefly", initials: "Ff", color: "#FF4B4B", task: "Generate campaign imagery", produces: "Brand-consistent visuals" },
      { productName: "Photoshop", initials: "Ps", color: "#001AFF", task: "Refine & composite", receives: "Generated visuals", produces: "Polished composition" },
      { productName: "Express", initials: "Ex", color: "#FF0099", task: "Adapt to social formats", receives: "Polished composition", produces: "Social-ready posts" },
    ],
    // generate: primary driver; publish: the clear output
    capabilityIds: ["generate", "publish"],
    planIds: ["cc-pro-in", "firefly-pro-in"],
  },
  {
    id: "product-photography",
    label: "Product Photography",
    icon: "📷",
    description: "Professional product visuals for e-commerce and campaigns",
    workflowSummary: "Firefly → Photoshop → Illustrator",
    workflowPhases: "Generate → Retouch → Compose",
    workflowSteps: [
      { productName: "Firefly", initials: "Ff", color: "#FF4B4B", task: "Generate scene backgrounds", produces: "Scene variants" },
      { productName: "Photoshop", initials: "Ps", color: "#001AFF", task: "Composite & retouch", receives: "Product photo + scenes", produces: "Hero shot" },
      { productName: "Illustrator", initials: "Ai", color: "#FF9B00", task: "Add brand overlays", receives: "Hero shot", produces: "Campaign-ready asset" },
    ],
    // enhance: core retouching step; edit: Photoshop compositing
    capabilityIds: ["enhance", "edit"],
    planIds: ["cc-pro-in", "adobe-photography-in"],
  },
  {
    id: "brand-identity",
    label: "Brand Identity",
    icon: "✦",
    description: "Build cohesive brand systems from logo to asset library",
    workflowSummary: "Firefly → Illustrator → Express",
    workflowPhases: "Concept → Design → Template",
    workflowSteps: [
      { productName: "Firefly", initials: "Ff", color: "#FF4B4B", task: "Generate visual concepts", produces: "Concept variants" },
      { productName: "Illustrator", initials: "Ai", color: "#FF9B00", task: "Build vector brand system", receives: "Visual concepts", produces: "Brand kit (logo, marks)" },
      { productName: "Express", initials: "Ex", color: "#FF0099", task: "Create brand templates", receives: "Brand kit", produces: "Reusable brand assets" },
    ],
    // design: Illustrator is central; publish: Express templates
    capabilityIds: ["design", "publish"],
    planIds: ["cc-pro-in", "adobe-all-apps-in"],
  },
  {
    id: "marketing-video",
    label: "Marketing Video",
    icon: "🎬",
    description: "Produce compelling video content for any channel",
    workflowSummary: "Firefly → Photoshop → Premiere Pro",
    workflowPhases: "Generate → Craft → Publish",
    workflowSteps: [
      { productName: "Firefly", initials: "Ff", color: "#FF4B4B", task: "Generate motion assets", produces: "Visual elements" },
      { productName: "Photoshop", initials: "Ps", color: "#001AFF", task: "Create stills & graphics", receives: "Visual elements", produces: "Video-ready frames" },
      { productName: "Premiere Pro", initials: "Pr", color: "#9933FF", task: "Edit & publish video", receives: "Video-ready frames", produces: "Published video" },
    ],
    // video: the defining capability; edit: Photoshop pre-production
    capabilityIds: ["video", "edit"],
    planIds: ["cc-pro-in", "premiere-in"],
  },
  {
    id: "web-campaign",
    label: "Web Campaign Assets",
    icon: "🌐",
    description: "Design banners, landing page assets, and display ads",
    workflowSummary: "Firefly → Photoshop → Express",
    workflowPhases: "Generate → Optimize → Deploy",
    workflowSteps: [
      { productName: "Firefly", initials: "Ff", color: "#FF4B4B", task: "Generate imagery & backgrounds", produces: "Visual variations" },
      { productName: "Photoshop", initials: "Ps", color: "#001AFF", task: "Composite & optimize", receives: "Visual variations", produces: "Web-optimized assets" },
      { productName: "Express", initials: "Ex", color: "#FF0099", task: "Build ad templates", receives: "Web-optimized assets", produces: "Campaign asset library" },
    ],
    // generate: Firefly drives it; design: layout and templating
    capabilityIds: ["generate", "design"],
    planIds: ["cc-pro-in", "adobe-all-apps-in"],
  },
];

export function getGoalsForCapability(capabilityId: string): CreativeGoal[] {
  return CREATIVE_GOALS.filter((g) => g.capabilityIds.includes(capabilityId));
}

export function getGoalsForPlan(planId: string): CreativeGoal[] {
  return CREATIVE_GOALS.filter((g) => g.planIds.includes(planId));
}
