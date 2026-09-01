import { CreativeFile, IntentPassport, Mission, Plan, ProjectFixture, UserFixture } from "@/lib/types";

export const userFixture: UserFixture = {
  name: "Meera",
  region: "IN",
  city: "Bangalore",
  student: true,
};

export const projectFixture: ProjectFixture = {
  id: "kaftan-001",
  name: "Kaftan Client Project",
};

export const creativeFilesFixture: CreativeFile[] = [
  {
    id: "kaftan-logo-final",
    name: "Kaftan-logo-final.psd",
    type: "psd",
    size: 6_300_000,
    hash: "hash-kaftan-logo-main",
    modifiedAt: "2026-08-30T12:30:00.000Z",
    approved: true,
    projectId: projectFixture.id,
  },
  {
    id: "kaftan-logo-v2",
    name: "Kaftan-logo-v2.psd",
    type: "psd",
    size: 6_120_000,
    hash: "hash-kaftan-logo-v2",
    modifiedAt: "2026-08-27T12:30:00.000Z",
    approved: false,
    projectId: projectFixture.id,
  },
  {
    id: "kaftan-logo-copy",
    name: "Kaftan-logo-copy.psd",
    type: "psd",
    size: 6_300_000,
    hash: "hash-kaftan-logo-main",
    modifiedAt: "2026-08-29T12:30:00.000Z",
    approved: false,
    projectId: projectFixture.id,
  },
  {
    id: "kaftan-product-reference",
    name: "Kaftan-product-reference.png",
    type: "png",
    size: 1_540_000,
    hash: "hash-kaftan-product-reference",
    modifiedAt: "2026-08-26T12:30:00.000Z",
    approved: true,
    projectId: projectFixture.id,
  },
];

export const seededMission: Mission = {
  id: "mission-kaftan-001",
  goal: "Finish Kaftan client project",
  projectId: projectFixture.id,
  originalPrompt:
    "Find my latest Kaftan logo, change its background, create a business card version, and clean up duplicate project files when you're done. Don't delete anything important, don't spend money, and don't make subjective creative decisions without asking me.",
  constraints: {
    noPurchaseWithoutApproval: true,
    noDestructiveActionWithoutApproval: true,
    noSubjectiveCreativeDecisionWithoutApproval: true,
  },
  completedSteps: [],
  currentStep: "Discover capabilities",
  currentAssetId: "kaftan-logo-final",
  handoffHistory: [],
};

export const seededIntentPassport: IntentPassport = {
  id: "intent-passport-session",
  userGoal: "Find the right Adobe products and plans for my workflow.",
  region: userFixture.region,
  audience: userFixture.student ? "student" : "individual",
  requirements: [],
  discoveredCapabilities: [],
  selectedProducts: [],
  recommendedWorkflow: undefined,
  selectedDestination: "/plans",
  handoffTrail: [],
  userConstraints: [
    "Use public Adobe information",
    "Do not perform purchases",
  ],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

export const plansFixture: Plan[] = [
  {
    id: "adobe-student-cc-in",
    name: "Creative Cloud Student",
    region: "IN",
    audience: "student",
    price: 1599,
    currency: "INR",
    billingPeriod: "month",
    includedApps: ["Photoshop", "Illustrator", "Express", "Acrobat"],
    capabilities: [
      "photo editing",
      "vector design",
      "business card design",
      "background replacement",
      "freelance starter toolkit",
    ],
    generativeCredits: 1000,
    studentEligible: true,
  },
  {
    id: "adobe-photography-in",
    name: "Photography Plan",
    region: "IN",
    audience: "individual",
    price: 799,
    currency: "INR",
    billingPeriod: "month",
    includedApps: ["Photoshop", "Lightroom"],
    capabilities: ["photo editing", "raw development", "portfolio exports"],
    generativeCredits: 100,
    studentEligible: false,
  },
  {
    id: "adobe-all-apps-in",
    name: "Creative Cloud All Apps",
    region: "IN",
    audience: "professional",
    price: 4599,
    currency: "INR",
    billingPeriod: "month",
    includedApps: ["Photoshop", "Illustrator", "Express", "InDesign", "Premiere Pro"],
    capabilities: [
      "photo editing",
      "vector design",
      "business card design",
      "background replacement",
      "advanced production workflows",
    ],
    generativeCredits: 1500,
    studentEligible: true,
  },
];
