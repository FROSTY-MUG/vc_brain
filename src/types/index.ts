// =============================================
// VC Brain — Core Types
// =============================================

export type UserRole = "founder" | "investor";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  onboarded: boolean;
  createdAt: string;
}

// ── Thesis Engine ──
export interface InvestorThesis {
  id: string;
  userId: string;
  sectors: string[];
  stages: string[];        // "pre-seed" | "seed" | "series-a"
  geographies: string[];
  checkSizeMin: number;
  checkSizeMax: number;
  ownershipTarget: number; // percentage
  riskAppetite: "conservative" | "moderate" | "aggressive";
  keywords: string[];      // free-form thesis keywords
  description: string;     // natural language thesis
  updatedAt: string;
}

// ── Founder ──
export interface Founder {
  id: string;
  name: string;
  email: string;
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  bio: string;
  location: string;
  tags: string[];
  isColdStart: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Persistent Founder Score ──
export interface FounderScore {
  founderId: string;
  overallScore: number;        // 0-100
  executionVelocity: number;   // 0-100
  domainExpertise: number;     // 0-100
  resilienceHistory: number;   // 0-100
  confidence: number;          // 0-1
  dataCompleteness: number;    // 0-1
  trend: "rising" | "stable" | "declining";
  trendDelta: number;          // e.g. +5.2
  isColdStart: boolean;
  scoredAt: string;
  history: { date: string; score: number }[];
}

// ── Startup / Company ──
export interface Startup {
  id: string;
  name: string;
  website?: string;
  sector: string;
  stage: string;
  geography: string;
  foundedDate?: string;
  founderIds: string[];
  createdAt: string;
}

// ── Application (Opportunity) ──
export interface Application {
  id: string;
  startupId: string;
  sourceType: "inbound" | "outbound_github" | "outbound_producthunt" | "outbound_arxiv" | "outbound_hackathon" | "outbound_accelerator";
  sourceDetail?: string;
  status: "new" | "screening" | "diligence" | "decision" | "passed" | "deployed";
  deckUrl?: string;
  rawText?: string;
  submittedAt: string;
  processedAt?: string;
}

// ── 3-Axis Opportunity Scores ──
export interface OpportunityScores {
  applicationId: string;
  founder: AxisScore;
  market: AxisScore;
  ideaVsMarket: AxisScore;
  thesisAlignment: number; // 0-100
  recommendation: "deploy" | "diligence" | "pass" | "watch";
}

export interface AxisScore {
  score: number;           // 0-100
  confidence: number;      // 0-1
  trend: "rising" | "stable" | "declining";
  signals: string[];       // key reasons
}

// ── Claims & Trust ──
export interface Claim {
  id: string;
  applicationId: string;
  claimType: "revenue" | "growth" | "users" | "team_background" | "market_size" | "tech_moat" | "patents" | "traction" | "funding" | "partnerships";
  statement: string;
  extractedValue?: string;
  source: string;          // "deck_slide_4" | "github_profile" | "linkedin"
  trustScore: TrustScore;
}

export interface TrustScore {
  score: number;           // 0-100
  contradictionFlag: boolean;
  reasoning: string;
  sourceReliability: number;
  corroborationCount: number;
  freshnessDays: number;
  extractionConfidence: number;
}

export interface EvidenceLink {
  id: string;
  claimId: string;
  sourceUrl: string;
  excerpt: string;
  reliabilityWeight: number;
  retrievedAt: string;
}

// ── Memo ──
export interface InvestmentMemo {
  id: string;
  applicationId: string;
  companySnapshot: string;
  investmentHypotheses: string[];
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  problemAndProduct: string;
  tractionAndKPIs: MemoSection;
  teamAndHistory: MemoSection;
  technologyAndDefensibility: MemoSection;
  marketSizing: MemoSection;
  competition: MemoSection;
  trustSummary: { verifiedClaims: number; contradictions: number; avgTrustScore: number; flags: string[] };
  recommendation: { action: "deploy" | "pass" | "diligence"; confidence: string; reasoning: string };
  openQuestions: string[];
  generatedAt: string;
}

export interface MemoSection {
  content: string;
  dataStatus: "available" | "partial" | "missing";
  citations: string[];
}

// ── Outbound Signal ──
export interface OutboundSignal {
  id: string;
  founderId?: string;
  source: string;
  signalType: string;
  title: string;
  description: string;
  url: string;
  strength: number;     // 0-100
  discoveredAt: string;
}

// ── Timeline Event ──
export interface TimelineEvent {
  id: string;
  entityType: "founder" | "startup" | "application";
  entityId: string;
  event: string;
  detail: string;
  timestamp: string;
}
