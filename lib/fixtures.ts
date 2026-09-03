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
  // region/audience intentionally start unset: a fresh public session has no
  // legitimate context until the calling agent supplies it explicitly on a
  // tool call. Do not seed these from userFixture -- see Phase 2 audit.
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
  executionHistory: [],
};

export const plansFixture: Plan[] = [
  {
    id: "cc-pro-in",
    name: "Creative Cloud Pro",
    supportedRegions: ["IN"],
    audience: "individual",
    billingPeriod: "month",
    studentEligible: false,
    osi: "PW3K57bKr9oyfdtwhnFN_K82bDeZQ4s9PUPiEy4dRVw",
    commerceAlias: "ccsn_direct_individual",
  },
  {
    id: "adobe-photography-in",
    name: "Photography",
    supportedRegions: ["IN"],
    audience: "individual",
    billingPeriod: "month",
    studentEligible: false,
    osi: "T_VU8u-Om_jOXDjvDwMcZXjoKKqaVMSPWB_EaXEYiCw",
    fragmentId: "86248907-1cb6-4d1e-8b3f-a42dee95d9bc",
    commerceAlias: "PA-128",
  },
  {
    id: "photoshop-in",
    name: "Photoshop",
    supportedRegions: ["IN"],
    audience: "individual",
    billingPeriod: "month",
    studentEligible: false,
    osi: "e7KVyeGPr6F0h7DCSZ-49IesIKms3-9hLEZKXDmdcc0",
    commerceAlias: "phsp_direct_individual",
  },
  {
    id: "firefly-pro-in",
    name: "Adobe Firefly Pro",
    supportedRegions: ["IN"],
    audience: "individual",
    billingPeriod: "month",
    studentEligible: false,
    osi: "msg4m1782IVpeTz8mHd_P_0GG3OSG7XS932oW-7EGuM",
    commerceAlias: "PA-1929",
  },
  {
    id: "premiere-in",
    name: "Adobe Premiere Pro",
    supportedRegions: ["IN"],
    audience: "individual",
    billingPeriod: "month",
    studentEligible: false,
    osi: "8RURe83ciyOEkmzv0aUFan309S-9WbT28BaIaTZk9VQ",
    commerceAlias: "ppro_direct_individual",
  },
  {
    id: "acrobat-pro-in",
    name: "Acrobat Pro",
    supportedRegions: ["IN"],
    audience: "individual",
    billingPeriod: "month",
    studentEligible: false,
    osi: "gW9NJdpWgZIt7aqMhaXWOZDGxw7fXoNWDidbAlbxmkM",
    commerceAlias: "apcc_direct_individual",
  },
  {
    id: "acrobat-express-in",
    name: "Acrobat Express",
    supportedRegions: ["IN"],
    audience: "individual",
    billingPeriod: "month",
    studentEligible: false,
    osi: "QzOBYETU2rV7nh4QP4_Jzv6_mI7w0JDZOSXvVsMrWE8",
    commerceAlias: "PA-2345",
  },
  {
    id: "adobe-all-apps-in",
    name: "Creative Cloud All Apps",
    supportedRegions: ["IN"],
    audience: "individual",
    billingPeriod: "month",
    studentEligible: true,
    osi: "CCR5FPiUwE6AfLMkubkLibOiapCnMlqqnbUWIPXVuvQ",
    commerceAlias: "ccsn_direct_individual",
  },
  {
    id: "adobe-student-cc-in",
    name: "Creative Cloud Student",
    supportedRegions: ["IN"],
    audience: "student",
    billingPeriod: "month",
    studentEligible: true,
    osi: "6ZlvF089GRSe5Igiq7o2-fe17CvGqdkmgvN1JMhY4Hk",
    fragmentId: "2bee9d3e-55ae-4701-b946-44b32fa5d9fa",
    commerceAlias: "ccsn_direct_student",
  },
];
