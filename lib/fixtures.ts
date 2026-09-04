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

// ─── Region groups ────────────────────────────────────────────────────────────
// IN-only  = IN        — IN-specific OSIs with local pricing (INR); scraped from /in/ pages
// AMER/INTL = US,CA,DE,GB,AU — AMER OSIs verified to resolve for all 5 regions via WCS
// GLOBAL   = all 6    — OSIs that resolve for every region including IN (Firefly, etc.)
// Teams: most OSIs are global with -cc API key; cc-pro-teams uses a dedicated global OSI
// ─────────────────────────────────────────────────────────────────────────────

export const plansFixture: Plan[] = [

  // ── INDIVIDUAL — IN-only (correct INR pricing; AMER plans cover GB/AU separately) ──

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
  // APAC individual
  { id: "adobe-photography-in", name: "Photography", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "T_VU8u-Om_jOXDjvDwMcZXjoKKqaVMSPWB_EaXEYiCw", fragmentId: "86248907-1cb6-4d1e-8b3f-a42dee95d9bc", commerceAlias: "PA-128" },
  { id: "photoshop-in", name: "Photoshop", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "e7KVyeGPr6F0h7DCSZ-49IesIKms3-9hLEZKXDmdcc0", commerceAlias: "phsp_direct_individual" },
  { id: "premiere-in", name: "Adobe Premiere Pro", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "8RURe83ciyOEkmzv0aUFan309S-9WbT28BaIaTZk9VQ", commerceAlias: "ppro_direct_individual" },
  { id: "acrobat-pro-in", name: "Acrobat Pro", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "gW9NJdpWgZIt7aqMhaXWOZDGxw7fXoNWDidbAlbxmkM", commerceAlias: "apcc_direct_individual" },
  { id: "acrobat-express-in", name: "Acrobat Express", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "QzOBYETU2rV7nh4QP4_Jzv6_mI7w0JDZOSXvVsMrWE8", commerceAlias: "PA-2345" },
  { id: "acrobat-studio-in", name: "Acrobat Studio", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "zuIsmHec4TP5H2IIh1oGUn3roG_HRFiHh6LNsG5bwgY", commerceAlias: "PA-1806" },
  { id: "acrobat-standard-in", name: "Acrobat Standard", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "ES77iNtc3eI6yGyTX448vllSQin-gkfD3Vqlismwk6g", commerceAlias: "acro_direct_individual" },
  { id: "illustrator-in", name: "Illustrator", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "sDTRFOmA5PxYqHcGmoCeCDdnsXbAM-bAEosTX90DKdI", commerceAlias: "ilst_direct_individual" },
  { id: "after-effects-in", name: "After Effects", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "D5NAFUtZHeQ2UOKV3qHIk2QRJSnLhdagDvAdGwoh7r8", commerceAlias: "aeft_direct_individual" },
  { id: "indesign-in", name: "InDesign", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "1wxJVStm8uubUUOcsaYah0NpkWgvVsO2a9kCLi1nvRU", commerceAlias: "idsn_direct_individual" },
  { id: "lightroom-in", name: "Lightroom", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "Nq3dqu3-wvXb2LRtzB76QZxs1j9O2jf1SYuTOvOLjdc", commerceAlias: "PA-123" },
  { id: "lightroom-classic-in", name: "Lightroom Classic", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, commerceAlias: "ltrm_direct_individual" },
  { id: "animate-in", name: "Animate", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "NLJ8C38OS1QyuT0CpifezeQ9W31I4AWy-FAyKvjU5po", commerceAlias: "flpr_direct_individual" },
  { id: "audition-in", name: "Audition", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "gcyiGmk8IC2TcKb2MH38BtKLIhhhBetGolgrPLRM4ck", commerceAlias: "audt_direct_individual" },
  { id: "dreamweaver-in", name: "Dreamweaver", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "NvlK6_9str_AUBfwB9j_F7r7bfqN5OoAmXvnb7sYuKY", commerceAlias: "drwv_direct_individual" },
  { id: "substance-3d-in", name: "Substance 3D", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "LFYr34hS79Pouq9r415HlhwCF5ycYlZADlUQ1nSqI0k", commerceAlias: "PA-27" },
  { id: "adobe-express-in", name: "Adobe Express", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "NzqLMPYPpXgia7j0jIOUuRShsNo2HfxL1rIiCslE85M", commerceAlias: "PA-55" },
  { id: "cc-standard-in", name: "Creative Cloud Standard", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "ByoodfkewVBdYFJ4FGI-ykA-CICyC7ErlkUhpCTpGpk", commerceAlias: "PA-1517" },
  { id: "ai-assistant-acrobat-in", name: "AI Assistant for Acrobat", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "9cCXYaJU0Z_kBP5Nhi3v37n23A8f6UuFe7xzl7d_lVg", commerceAlias: "PA-1042" },
  { id: "adobe-all-apps-in", name: "Creative Cloud All Apps", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: true, osi: "CCR5FPiUwE6AfLMkubkLibOiapCnMlqqnbUWIPXVuvQ", commerceAlias: "ccsn_direct_individual" },
  // APAC individual — no standalone OSI (free, discontinued, or bundled-only apps)
  { id: "character-animator-in", name: "Character Animator", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, commerceAlias: "char_direct_individual" },
  { id: "fresco-in", name: "Adobe Fresco", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, commerceAlias: "frsc_direct_individual" },
  { id: "xd-in", name: "Adobe XD", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, commerceAlias: "amdxd_direct_individual" },
  { id: "premiere-rush-in", name: "Premiere Rush", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, commerceAlias: "rush_direct_individual" },
  { id: "dimension-in", name: "Dimension", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, commerceAlias: "eshr_direct_individual" },
  { id: "media-encoder-in", name: "Media Encoder", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, commerceAlias: "amed_direct_individual" },
  { id: "bridge-in", name: "Adobe Bridge", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, commerceAlias: "bridg_direct_individual" },
  { id: "incopy-in", name: "InCopy", supportedRegions: ["IN"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "ejtlGD-tMpc8y12UDCc78rmlr_Xk6l_pByErOlCkWc4", commerceAlias: "PA-120" },

  // ── INDIVIDUAL — AMER (US, CA, DE) — different OSI pool ───────────────────

  { id: "cc-pro-us", name: "Creative Cloud Pro", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8", commerceAlias: "ccsn_direct_individual" },
  { id: "photography-us", name: "Photography", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "MzCpF9nUi8rEzyW-9slEUwtRenS69PRW5fp84a93uK4", commerceAlias: "PA-128" },
  { id: "photoshop-us", name: "Photoshop", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M", commerceAlias: "phsp_direct_individual" },
  { id: "premiere-us", name: "Adobe Premiere Pro", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "e3DsJJwP_VUnBRzRMBEulATNukeKiNwKfdMNsxJWncU", commerceAlias: "ppro_direct_individual" },
  { id: "illustrator-us", name: "Illustrator", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "1KfaN_o5h4Gvmvh_QwfK7KB7xGPpNpsTXsdhqpJUT5Y", commerceAlias: "ilst_direct_individual" },
  { id: "after-effects-us", name: "After Effects", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "nt2DKD5H3TYag-Annag-QdKb8Q1flZmdJaojt5JeU7Y", commerceAlias: "aeft_direct_individual" },
  { id: "indesign-us", name: "InDesign", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "tYj-xoywYA5lbIV6eiXNoBaxQMVu4XjD2jxF_goFeYs", commerceAlias: "idsn_direct_individual" },
  { id: "lightroom-us", name: "Lightroom", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "YbmrrnDXjKp75tHcS_wDjwLhuZl3uldCu00qBXGJFMc", commerceAlias: "PA-123" },
  { id: "animate-us", name: "Animate", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "Hm9O9HGJwKY3Zgw5hcJnr7XuRfpGRUR2raMCds-Js1s", commerceAlias: "flpr_direct_individual" },
  { id: "audition-us", name: "Audition", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "E6R2ZyNzavXJ7u7bVA109EvEWWBI76n9v6mYmmm5MJ4", commerceAlias: "audt_direct_individual" },
  { id: "dreamweaver-us", name: "Dreamweaver", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "1Vu_Zgq_ymipOLtGMsJpG3kkNrwEHqmCevEa6w9IKWI", commerceAlias: "drwv_direct_individual" },
  { id: "substance-3d-us", name: "Substance 3D", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "39y2LKj90f79Fo7YiqluNIFhzFgZkpERMZwbe-9Q-XA", commerceAlias: "PA-27" },
  { id: "acrobat-pro-us", name: "Acrobat Pro", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "vQmS1H18A6_kPd0tYBgKnp-TQIF0GbT6p8SH8rWcLMs", commerceAlias: "apcc_direct_individual" },
  { id: "acrobat-express-us", name: "Acrobat Express", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "bLsxcpky9aPRHdxVksBqG_yY2DBgsJYeXkOXWT1pzSc", commerceAlias: "PA-2342" },
  { id: "acrobat-studio-us", name: "Acrobat Studio", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "V3W0kzf4e6M2Ht1hP9ZAt3dQNmhuDFrmYmEPlE2SlG0", commerceAlias: "PA-1806" },
  { id: "acrobat-standard-us", name: "Acrobat Standard", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "QgYu51CVY2wKyFEqMuvec4N1tc1OaCypeKJjT5n2-Fc", commerceAlias: "acro_direct_individual" },
  { id: "ai-assistant-acrobat-us", name: "AI Assistant for Acrobat", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "nIy-IPGnALw3KNncaqMjOJsMUrqElWi8sdGnBFBAgTw", commerceAlias: "PA-1042" },
  { id: "adobe-express-us", name: "Adobe Express", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "2yzU1dqwSmgxwAYD1qNk4vYjHn7aU4lnXlA7ttsE-cQ", commerceAlias: "PA-55" },
  { id: "cc-standard-us", name: "Creative Cloud Standard", supportedRegions: ["US", "CA", "DE", "GB", "AU"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "RtGS3tQldt6XY52QuIc3ADIQMC_zSX7fsKOUmhduoSQ", commerceAlias: "PA-1517" },
  // ── INDIVIDUAL — GLOBAL (same OSI on every regional page) ─────────────────

  { id: "firefly-pro-in", name: "Adobe Firefly Pro", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "msg4m1782IVpeTz8mHd_P_0GG3OSG7XS932oW-7EGuM", commerceAlias: "PA-1929" },
  { id: "firefly-standard", name: "Adobe Firefly Standard", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "x-CF3zQCxmvvlr_165q5CIQgGf1cjhj0DKCHZt6vlRU", commerceAlias: "PA-1930" },
  { id: "firefly-pro-plus", name: "Adobe Firefly Pro Plus", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "gYCn_HPAAlYUuXsJNUoFyFBiFE0rePc0uwoFbiI64JM", commerceAlias: "PA-2360" },
  { id: "firefly-premium", name: "Adobe Firefly Premium", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "U_6iWE53vcytktaieMj_ze4nV4Tn87YZULUy9dO0D-0", commerceAlias: "PA-2017" },
  { id: "stock-ai-studio", name: "Adobe Stock AI Studio", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "PexRdnQXvCj4CWLuGruCNrCc--cRKzqZYar8zJ4fhD8", commerceAlias: "PA-2511" },
  { id: "stock", name: "Adobe Stock", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "individual", billingPeriod: "month", studentEligible: false, osi: "JWIwpOv5nOckxDEBJeQWHa8spk7iEo4EEnQNQ1_YbmE", commerceAlias: "stks_direct_individual" },

  // ── BUSINESS / TEAMS — GLOBAL (same OSI across IN and US teams pages) ─────

  { id: "cc-pro-teams", name: "Creative Cloud Pro — Teams", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "KvzpMygyLD2aOsscDZxtx1Tr1Ah_FgtkbLHP9-4OHJM", commerceAlias: "ccle_direct_indirect_team" },
  { id: "cc-standard-teams", name: "Creative Cloud Standard — Teams", supportedRegions: ["IN"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "azxuL2c2NRYd-nEzIMCl7dB-5ScCSySnIYVZx0GZ4Pw", commerceAlias: "ccle_direct_indirect_team" },
  { id: "photoshop-teams", name: "Photoshop — Teams", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "yHKQJK2VOMSY5bINgg7oa2ov9RnmnU1oJe4NOg4QTYI", commerceAlias: "ccle_direct_indirect_team" },
  { id: "acrobat-pro-teams", name: "Acrobat Pro — Teams", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "vV01ci-KLH6hYdRfUKMBFx009hdpxZcIRG1-BY_PutE", commerceAlias: "apcc_direct_indirect_team" },
  { id: "illustrator-teams", name: "Illustrator — Teams", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "Z3QWplJj6vfX1gmA3QRemOP9HTCmgt_pSt5GN0SkzxE", commerceAlias: "ccle_direct_indirect_team" },
  { id: "premiere-teams", name: "Adobe Premiere Pro — Teams", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "7JJbqzMBOoxxLhb72MxrkaYuOa56CoVaelD0uQ4fmzY", commerceAlias: "ccle_direct_indirect_team" },
  { id: "acrobat-express-teams", name: "Acrobat Express — Teams", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "HPVp7DwzJdKGYxtRMVpZ6EI-V_Xs7Cjk40SvULZk1MA", commerceAlias: "ccle_direct_indirect_team" },
  { id: "lightroom-teams", name: "Lightroom — Teams", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "Fnnj69a5_sdJzGWWJHy2Kjhdj8SWQYK1KVvyc2VPMYw", commerceAlias: "ccle_direct_indirect_team" },
  { id: "indesign-teams", name: "InDesign — Teams", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "kKrpQuocU6PcQ9Nb3LPNhI4UikasKxPgh8LeCwKONTw", commerceAlias: "ccle_direct_indirect_team" },
  { id: "after-effects-teams", name: "After Effects — Teams", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "eyqG_83nEbKPvbwwSL33uw1n08U_FF225AWBIq4XX_Y", commerceAlias: "ccle_direct_indirect_team" },
  { id: "frameio-teams", name: "Frame.io — Teams", supportedRegions: ["IN", "US", "CA", "AU"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "hJh9TNkGzIt5qBescI0zy4jqHQqNAOX-SLC2pVSGu1s", commerceAlias: "ccle_direct_indirect_team" },
  { id: "audition-teams", name: "Audition — Teams", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "u1F1Xy77yiW_vJ7NrrRUYdwS-E8Vb1fUbYw8T9mvqIw", commerceAlias: "ccle_direct_indirect_team" },
  { id: "animate-teams", name: "Animate — Teams", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "u1F1Xy77yiW_vJ7NrrRUYdwS-E8Vb1fUbYw8T9mvqIw", commerceAlias: "ccle_direct_indirect_team" },
  { id: "acrobat-studio-teams", name: "Acrobat Studio — Teams", supportedRegions: ["IN", "GB", "AU", "US", "CA", "DE"], audience: "business", billingPeriod: "month", studentEligible: false, osi: "SfkorgyrBAsqBVpyKddQQEn6jR0ItBohpXc74sZcKHg", commerceAlias: "ccle_direct_indirect_team" },

  // ── EDUCATION (Schools & Universities) ────────────────────────────────────
  // creative_cloud_pro_edu OSIs appear on individual pages with edu pricing

  { id: "cc-edu-apac", name: "Creative Cloud for Education", supportedRegions: ["IN"], audience: "education", billingPeriod: "month", studentEligible: true, osi: "6ZlvF089GRSe5Igiq7o2-fe17CvGqdkmgvN1JMhY4Hk", commerceAlias: "ccsn_direct_student" },
  { id: "cc-edu-us", name: "Creative Cloud for Education", supportedRegions: ["US", "CA", "DE"], audience: "education", billingPeriod: "month", studentEligible: true, osi: "r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8", commerceAlias: "ccsn_direct_individual" },

  // ── STUDENT (individual student plans) ────────────────────────────────────

  { id: "adobe-student-cc-in", name: "Creative Cloud Student", supportedRegions: ["IN"], audience: "student", billingPeriod: "month", studentEligible: true, osi: "6ZlvF089GRSe5Igiq7o2-fe17CvGqdkmgvN1JMhY4Hk", fragmentId: "2bee9d3e-55ae-4701-b946-44b32fa5d9fa", commerceAlias: "ccsn_direct_student", promotionCode: "STEYR1_399INR" },
];
