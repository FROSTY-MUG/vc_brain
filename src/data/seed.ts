// =============================================
// VC Brain — Seed Data for Hackathon Demo
// =============================================
import type {
  Founder, FounderScore, Startup, Application, OpportunityScores,
  Claim, InvestmentMemo, OutboundSignal, InvestorThesis, UserProfile,
} from "@/types";

// ── Demo User ──
export const demoUser: UserProfile = {
  id: "user_01",
  name: "Sarah Chen",
  email: "sarah@conviction.vc",
  avatar: "",
  role: "investor",
  onboarded: true,
  createdAt: "2024-01-15",
};

// ── Default Thesis ──
export const demoThesis: InvestorThesis = {
  id: "thesis_01",
  userId: "user_01",
  sectors: ["AI Infrastructure", "Developer Tools", "Enterprise SaaS"],
  stages: ["pre-seed", "seed"],
  geographies: ["North America", "Europe"],
  checkSizeMin: 50000,
  checkSizeMax: 150000,
  ownershipTarget: 5,
  riskAppetite: "aggressive",
  keywords: ["technical founder", "open-source", "PLG", "API-first"],
  description: "We back deeply technical founders building category-defining developer infrastructure. We look for open-source traction, strong GitHub presence, and teams that can ship at outlier velocity.",
  updatedAt: "2024-06-01",
};

// ── Founders ──
export const founders: Founder[] = [
  {
    id: "f_01",
    name: "Alex Petrov",
    email: "alex@neuralforge.ai",
    linkedinUrl: "https://linkedin.com/in/alexpetrov",
    githubUrl: "https://github.com/alexpetrov",
    twitterUrl: "https://twitter.com/alexpetrov",
    bio: "Ex-DeepMind researcher. Published 12 papers on efficient transformer architectures. Built open-source inference engine with 4.2k GitHub stars.",
    location: "Berlin, Germany",
    tags: ["AI/ML", "infrastructure", "ex-DeepMind", "technical", "open-source"],
    isColdStart: true,
    createdAt: "2024-03-15",
    updatedAt: "2024-06-10",
  },
  {
    id: "f_02",
    name: "Priya Sharma",
    email: "priya@stackbridge.io",
    linkedinUrl: "https://linkedin.com/in/priyasharma",
    githubUrl: "https://github.com/priyasharma",
    bio: "2x founder. Previous company (DataPipe) acquired by Snowflake in 2022 for $45M. Stanford CS. 8 years building data infrastructure.",
    location: "San Francisco, CA",
    tags: ["data-infra", "2x-founder", "Stanford", "acquisition", "enterprise"],
    isColdStart: false,
    createdAt: "2023-11-20",
    updatedAt: "2024-06-12",
  },
  {
    id: "f_03",
    name: "Marcus Johnson",
    email: "marcus@quickledger.com",
    linkedinUrl: "https://linkedin.com/in/marcusjohnson",
    bio: "MBA from Wharton. 3 years at McKinsey. First-time founder building fintech for SMBs.",
    location: "New York, NY",
    tags: ["fintech", "MBA", "first-time-founder", "SMB"],
    isColdStart: false,
    createdAt: "2024-01-10",
    updatedAt: "2024-05-28",
  },
];

// ── Founder Scores (persistent) ──
export const founderScores: FounderScore[] = [
  {
    founderId: "f_01",
    overallScore: 92,
    executionVelocity: 95,
    domainExpertise: 94,
    resilienceHistory: 0,
    confidence: 0.72,
    dataCompleteness: 0.65,
    trend: "rising",
    trendDelta: 8.3,
    isColdStart: true,
    scoredAt: "2024-06-10",
    history: [
      { date: "2024-03-15", score: 78 },
      { date: "2024-04-10", score: 83 },
      { date: "2024-05-12", score: 88 },
      { date: "2024-06-10", score: 92 },
    ],
  },
  {
    founderId: "f_02",
    overallScore: 96,
    executionVelocity: 91,
    domainExpertise: 95,
    resilienceHistory: 98,
    confidence: 0.95,
    dataCompleteness: 0.92,
    trend: "stable",
    trendDelta: 1.2,
    isColdStart: false,
    scoredAt: "2024-06-12",
    history: [
      { date: "2023-11-20", score: 94 },
      { date: "2024-01-15", score: 95 },
      { date: "2024-03-20", score: 95 },
      { date: "2024-06-12", score: 96 },
    ],
  },
  {
    founderId: "f_03",
    overallScore: 58,
    executionVelocity: 42,
    domainExpertise: 55,
    resilienceHistory: 40,
    confidence: 0.80,
    dataCompleteness: 0.75,
    trend: "stable",
    trendDelta: -2.1,
    isColdStart: false,
    scoredAt: "2024-05-28",
    history: [
      { date: "2024-01-10", score: 62 },
      { date: "2024-03-15", score: 60 },
      { date: "2024-05-28", score: 58 },
    ],
  },
];

// ── Startups ──
export const startups: Startup[] = [
  {
    id: "s_01",
    name: "NeuralForge",
    website: "https://neuralforge.ai",
    sector: "AI Infrastructure",
    stage: "pre-seed",
    geography: "Europe",
    foundedDate: "2024-01",
    founderIds: ["f_01"],
    createdAt: "2024-03-15",
  },
  {
    id: "s_02",
    name: "StackBridge",
    website: "https://stackbridge.io",
    sector: "Developer Tools",
    stage: "seed",
    geography: "North America",
    foundedDate: "2023-09",
    founderIds: ["f_02"],
    createdAt: "2023-11-20",
  },
  {
    id: "s_03",
    name: "QuickLedger",
    website: "https://quickledger.com",
    sector: "Fintech",
    stage: "pre-seed",
    geography: "North America",
    foundedDate: "2024-02",
    founderIds: ["f_03"],
    createdAt: "2024-01-10",
  },
];

// ── Applications ──
export const applications: Application[] = [
  {
    id: "app_01",
    startupId: "s_01",
    sourceType: "outbound_github",
    sourceDetail: "Discovered via trending GitHub repo: neural-forge/inference-engine (4.2k ★)",
    status: "screening",
    rawText: "NeuralForge builds an open-source inference engine that reduces LLM serving costs by 60%. Founded by ex-DeepMind researcher Alex Petrov.",
    submittedAt: "2024-06-08",
    processedAt: "2024-06-08",
  },
  {
    id: "app_02",
    startupId: "s_02",
    sourceType: "inbound",
    sourceDetail: "Direct application via pitch deck",
    status: "diligence",
    deckUrl: "/decks/stackbridge_deck.pdf",
    rawText: "StackBridge is a unified API layer for data infrastructure that lets engineering teams connect any data source in under 5 minutes. $1.2M ARR, 47 enterprise customers, 340% YoY growth.",
    submittedAt: "2024-06-01",
    processedAt: "2024-06-02",
  },
  {
    id: "app_03",
    startupId: "s_03",
    sourceType: "inbound",
    sourceDetail: "Direct application via pitch deck",
    status: "screening",
    deckUrl: "/decks/quickledger_deck.pdf",
    rawText: "QuickLedger is an AI-powered bookkeeping tool for SMBs. Claims 500 paying customers and $50K MRR.",
    submittedAt: "2024-05-25",
    processedAt: "2024-05-26",
  },
];

// ── 3-Axis Opportunity Scores ──
export const opportunityScores: OpportunityScores[] = [
  {
    applicationId: "app_01",
    founder: {
      score: 92,
      confidence: 0.72,
      trend: "rising",
      signals: ["12 published papers", "4.2k GitHub stars", "Ex-DeepMind", "Cold-start: high velocity compensates"],
    },
    market: {
      score: 95,
      confidence: 0.90,
      trend: "rising",
      signals: ["LLM inference market growing 40% CAGR", "Major cloud providers investing heavily", "Cost reduction is top priority for enterprises"],
    },
    ideaVsMarket: {
      score: 78,
      confidence: 0.65,
      trend: "rising",
      signals: ["Open-source GTM is proven", "Direct competition from vLLM and TensorRT", "Unique architecture approach", "No enterprise customers yet"],
    },
    thesisAlignment: 94,
    recommendation: "deploy",
  },
  {
    applicationId: "app_02",
    founder: {
      score: 96,
      confidence: 0.95,
      trend: "stable",
      signals: ["2x founder with $45M exit", "8 years domain expertise", "Stanford CS", "Strong hiring track record"],
    },
    market: {
      score: 88,
      confidence: 0.88,
      trend: "stable",
      signals: ["Data integration market is $15B+", "Enterprise adoption accelerating", "Fragmented competitor landscape"],
    },
    ideaVsMarket: {
      score: 91,
      confidence: 0.85,
      trend: "rising",
      signals: ["47 enterprise customers prove PMF", "$1.2M ARR validates pricing", "340% YoY growth", "5-min setup is strong wedge"],
    },
    thesisAlignment: 89,
    recommendation: "deploy",
  },
  {
    applicationId: "app_03",
    founder: {
      score: 58,
      confidence: 0.80,
      trend: "declining",
      signals: ["First-time founder", "No technical co-founder", "MBA background, limited engineering depth", "Low GitHub activity"],
    },
    market: {
      score: 62,
      confidence: 0.75,
      trend: "stable",
      signals: ["SMB fintech is crowded", "Low willingness to pay", "Regulatory complexity"],
    },
    ideaVsMarket: {
      score: 45,
      confidence: 0.60,
      trend: "declining",
      signals: ["No clear moat", "Competing with QuickBooks and Wave", "Claims 500 customers but trust score flagged contradiction"],
    },
    thesisAlignment: 32,
    recommendation: "pass",
  },
];

// ── Claims with Trust Scores ──
export const claims: Claim[] = [
  // NeuralForge claims
  {
    id: "c_01", applicationId: "app_01", claimType: "team_background",
    statement: "Founder was a researcher at DeepMind", extractedValue: "DeepMind",
    source: "linkedin_profile",
    trustScore: { score: 92, contradictionFlag: false, reasoning: "Confirmed via LinkedIn employment history and 3 co-authored DeepMind papers on Google Scholar.", sourceReliability: 0.95, corroborationCount: 3, freshnessDays: 15, extractionConfidence: 0.98 },
  },
  {
    id: "c_02", applicationId: "app_01", claimType: "traction",
    statement: "Open-source repo has 4,200+ GitHub stars", extractedValue: "4,200",
    source: "github_api",
    trustScore: { score: 98, contradictionFlag: false, reasoning: "Directly verified via GitHub API. Star count is 4,247 as of today.", sourceReliability: 0.99, corroborationCount: 1, freshnessDays: 1, extractionConfidence: 1.0 },
  },
  {
    id: "c_03", applicationId: "app_01", claimType: "tech_moat",
    statement: "Inference engine reduces LLM serving costs by 60%", extractedValue: "60%",
    source: "deck_slide_5",
    trustScore: { score: 55, contradictionFlag: false, reasoning: "Claim from deck only. No independent benchmark found. Plausible based on architecture but unverified.", sourceReliability: 0.50, corroborationCount: 0, freshnessDays: 30, extractionConfidence: 0.90 },
  },
  // StackBridge claims
  {
    id: "c_04", applicationId: "app_02", claimType: "revenue",
    statement: "Company has $1.2M ARR", extractedValue: "$1.2M",
    source: "deck_slide_8",
    trustScore: { score: 78, contradictionFlag: false, reasoning: "Claim from deck. Partially corroborated by 47 listed enterprise customers at ~$25K ACV average. Consistent with team size of 12.", sourceReliability: 0.50, corroborationCount: 1, freshnessDays: 14, extractionConfidence: 0.95 },
  },
  {
    id: "c_05", applicationId: "app_02", claimType: "growth",
    statement: "340% year-over-year revenue growth", extractedValue: "340%",
    source: "deck_slide_9",
    trustScore: { score: 65, contradictionFlag: false, reasoning: "Deck claim. Growth rate is aggressive but plausible for a seed-stage company scaling from low base.", sourceReliability: 0.50, corroborationCount: 0, freshnessDays: 14, extractionConfidence: 0.92 },
  },
  {
    id: "c_06", applicationId: "app_02", claimType: "team_background",
    statement: "Previous company acquired by Snowflake for $45M", extractedValue: "$45M acquisition",
    source: "crunchbase",
    trustScore: { score: 96, contradictionFlag: false, reasoning: "Acquisition confirmed on Crunchbase, TechCrunch article, and LinkedIn.", sourceReliability: 0.95, corroborationCount: 3, freshnessDays: 5, extractionConfidence: 0.99 },
  },
  // QuickLedger claims — with contradiction
  {
    id: "c_07", applicationId: "app_03", claimType: "users",
    statement: "500 paying customers", extractedValue: "500",
    source: "deck_slide_6",
    trustScore: { score: 22, contradictionFlag: true, reasoning: "CONTRADICTION: Deck claims 500 paying customers, but website shows 'Join our waitlist' language. Trustpilot shows only 8 reviews. App Store shows ~200 downloads. High risk of exaggeration.", sourceReliability: 0.50, corroborationCount: 0, freshnessDays: 30, extractionConfidence: 0.85 },
  },
  {
    id: "c_08", applicationId: "app_03", claimType: "revenue",
    statement: "$50K Monthly Recurring Revenue", extractedValue: "$50K",
    source: "deck_slide_7",
    trustScore: { score: 18, contradictionFlag: true, reasoning: "CONTRADICTION: $50K MRR with claimed 500 customers implies $100 ARPU, which is inconsistent with SMB bookkeeping tool pricing. Website shows $19/mo plan. $19 × 500 = $9.5K, not $50K. Major discrepancy.", sourceReliability: 0.50, corroborationCount: 0, freshnessDays: 30, extractionConfidence: 0.88 },
  },
  {
    id: "c_09", applicationId: "app_03", claimType: "team_background",
    statement: "Founder has MBA from Wharton", extractedValue: "Wharton MBA",
    source: "linkedin_profile",
    trustScore: { score: 90, contradictionFlag: false, reasoning: "Confirmed via LinkedIn education section. Graduation year 2020.", sourceReliability: 0.90, corroborationCount: 1, freshnessDays: 10, extractionConfidence: 0.97 },
  },
];

// ── Outbound Signals ──
export const outboundSignals: OutboundSignal[] = [
  {
    id: "sig_01", founderId: "f_01", source: "GitHub Trending",
    signalType: "trending_repo", title: "neural-forge/inference-engine",
    description: "Trending #3 in ML category. 4.2k stars, 89 forks, 42 contributors. Active daily commits.",
    url: "https://github.com/neural-forge/inference-engine", strength: 92, discoveredAt: "2024-06-08",
  },
  {
    id: "sig_02", founderId: undefined, source: "arXiv",
    signalType: "paper", title: "Efficient Sparse Attention for Long-Context LLMs",
    description: "Novel attention mechanism reducing memory by 8x. Lead author: Dr. Yuki Tanaka (MIT). No startup yet.",
    url: "https://arxiv.org/abs/2406.12345", strength: 85, discoveredAt: "2024-06-12",
  },
  {
    id: "sig_03", founderId: undefined, source: "Product Hunt",
    signalType: "launch", title: "DevProxy — API testing tool for microservices",
    description: "Launched today. #2 Product of the Day. 340 upvotes. Solo founder, ex-Stripe engineer.",
    url: "https://producthunt.com/posts/devproxy", strength: 78, discoveredAt: "2024-06-14",
  },
  {
    id: "sig_04", founderId: undefined, source: "Y Combinator W24",
    signalType: "accelerator_cohort", title: "SynthQL — Natural language to SQL for analytics",
    description: "YC W24 batch company. Technical founders from Google Brain. Raised $500K pre-seed.",
    url: "https://ycombinator.com/companies/synthql", strength: 88, discoveredAt: "2024-06-10",
  },
  {
    id: "sig_05", founderId: undefined, source: "ETHGlobal Hackathon",
    signalType: "hackathon_winner", title: "ChainProof — ZK-proof verification layer",
    description: "1st place at ETHGlobal Brussels. Team of 3 from ETH Zurich. Novel approach to proof aggregation.",
    url: "https://ethglobal.com/showcase/chainproof", strength: 80, discoveredAt: "2024-06-09",
  },
];

// ── Investment Memos ──
export const memos: InvestmentMemo[] = [
  {
    id: "memo_01",
    applicationId: "app_02",
    companySnapshot: "StackBridge is a unified API layer for data infrastructure founded by Priya Sharma, a 2x founder whose previous company (DataPipe) was acquired by Snowflake for $45M. The company is at seed stage with $1.2M ARR across 47 enterprise customers.",
    investmentHypotheses: [
      "Priya is a proven operator who has navigated a full company lifecycle including a successful exit.",
      "The data integration market is large ($15B+) and still fragmented, creating room for a modern API-first approach.",
      "The '5-minute setup' value proposition is a strong PLG wedge that can drive bottoms-up enterprise adoption.",
      "340% YoY growth, if sustained, puts this company on a trajectory to $5M ARR within 12 months.",
    ],
    swot: {
      strengths: [
        "Founder with $45M exit and deep domain expertise",
        "$1.2M ARR with strong growth trajectory",
        "47 enterprise customers validate product-market fit",
        "Technical moat in connector architecture",
      ],
      weaknesses: [
        "Burn rate unknown — team of 12 implies ~$150K/mo minimum",
        "340% growth claim not independently verified",
        "Heavy reliance on founder for enterprise sales",
      ],
      opportunities: [
        "Expand into data governance and compliance",
        "Partner with cloud providers for marketplace distribution",
        "International expansion to Europe",
      ],
      threats: [
        "Fivetran, Airbyte, and Segment are well-funded competitors",
        "Enterprise sales cycles could slow growth",
        "Open-source alternatives may commoditize connectors",
      ],
    },
    problemAndProduct: "Engineering teams spend 30-40% of their time on data plumbing — connecting, transforming, and maintaining data pipelines across dozens of sources. StackBridge provides a single API that abstracts this complexity, allowing teams to connect any data source in under 5 minutes with auto-generated schemas and real-time sync.",
    tractionAndKPIs: {
      content: "$1.2M ARR | 47 enterprise customers | 340% YoY growth | <5% monthly churn | 12 FTEs",
      dataStatus: "partial",
      citations: ["Deck Slide 8", "Deck Slide 9", "Crunchbase"],
    },
    teamAndHistory: {
      content: "Priya Sharma (CEO) — Stanford CS, 8 years in data infrastructure, previous exit to Snowflake. CTO is ex-Databricks (LinkedIn verified). Team of 12, mostly engineers.",
      dataStatus: "available",
      citations: ["LinkedIn", "Crunchbase", "Deck Slide 3"],
    },
    technologyAndDefensibility: {
      content: "Proprietary connector architecture with auto-schema detection. 200+ pre-built connectors. SDK for custom connectors. Patent pending on real-time sync protocol.",
      dataStatus: "partial",
      citations: ["Deck Slide 11", "GitHub (partial open-source SDK)"],
    },
    marketSizing: {
      content: "Data integration market estimated at $15.6B (2024) growing to $29B by 2028. StackBridge targets mid-market and enterprise segments (~40% of TAM).",
      dataStatus: "available",
      citations: ["Gartner Report 2024", "Deck Slide 6"],
    },
    competition: {
      content: "Direct: Fivetran ($5.6B valuation), Airbyte (open-source), Segment (Twilio). Differentiation: API-first approach vs. UI-driven, faster setup time, modern architecture.",
      dataStatus: "available",
      citations: ["Crunchbase", "Deck Slide 12"],
    },
    trustSummary: {
      verifiedClaims: 4,
      contradictions: 0,
      avgTrustScore: 79,
      flags: ["340% growth claim unverified — request bank statements", "Burn rate and runway not disclosed"],
    },
    recommendation: {
      action: "deploy",
      confidence: "HIGH",
      reasoning: "Strong founder with proven exit, validated PMF with $1.2M ARR, and high thesis alignment. Primary risk is competitive pressure from well-funded incumbents, but founder's domain expertise and execution velocity mitigate this. Recommend deploying $100K at $8M pre-money valuation.",
    },
    openQuestions: [
      "What is the current burn rate and runway?",
      "Can you share bank statements to verify ARR claim?",
      "What is the enterprise sales cycle length?",
      "How defensible is the connector architecture against Airbyte's open-source approach?",
      "Plans for international expansion?",
    ],
    generatedAt: "2024-06-14T10:30:00Z",
  },
];
