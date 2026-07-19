# =============================================
# VC Brain — Pydantic Models
# =============================================
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    founder = "founder"
    investor = "investor"

class RiskAppetite(str, Enum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"

class Recommendation(str, Enum):
    deploy = "deploy"
    diligence = "diligence"
    watch = "watch"
    passed = "pass"

class ThesisCreate(BaseModel):
    sectors: list[str] = []
    stages: list[str] = []
    geographies: list[str] = []
    check_size_min: int = 25000
    check_size_max: int = 250000
    ownership_target: float = 5.0
    risk_appetite: RiskAppetite = RiskAppetite.moderate
    keywords: list[str] = []
    description: str = ""

class ThesisResponse(ThesisCreate):
    id: str
    user_id: str

class FounderCreate(BaseModel):
    name: str
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    twitter_url: Optional[str] = None
    bio: str = ""
    location: str = ""
    tags: list[str] = []

class AxisScoreResponse(BaseModel):
    score: float
    confidence: float
    trend: str
    signals: list[str]

class OpportunityScoreResponse(BaseModel):
    application_id: str
    founder: AxisScoreResponse
    market: AxisScoreResponse
    idea_vs_market: AxisScoreResponse
    thesis_alignment: float
    recommendation: str

class TrustScoreResponse(BaseModel):
    claim_id: str
    score: float
    contradiction_flag: bool
    reasoning: str
    source_reliability: float
    corroboration_count: int
    freshness_days: int
    extraction_confidence: float

class ClaimResponse(BaseModel):
    id: str
    claim_type: str
    statement: str
    extracted_value: Optional[str] = None
    source: str
    trust_score: TrustScoreResponse

class MemoSection(BaseModel):
    content: str
    data_status: str   # "available" | "partial" | "missing"
    citations: list[str]

class SWOTResponse(BaseModel):
    strengths: list[str]
    weaknesses: list[str]
    opportunities: list[str]
    threats: list[str]

class TrustSummary(BaseModel):
    verified_claims: int
    contradictions: int
    avg_trust_score: float
    flags: list[str]

class MemoRecommendation(BaseModel):
    action: str
    confidence: str
    reasoning: str

class MemoResponse(BaseModel):
    id: str
    application_id: str
    company_snapshot: str
    investment_hypotheses: list[str]
    swot: SWOTResponse
    problem_and_product: str
    traction_and_kpis: MemoSection
    team_and_history: MemoSection
    technology_and_defensibility: MemoSection
    market_sizing: MemoSection
    competition: MemoSection
    financials_and_round: MemoSection
    cap_table: MemoSection
    due_diligence_log: MemoSection
    exit_perspective: MemoSection
    trust_summary: TrustSummary
    recommendation: MemoRecommendation
    open_questions: list[str]
    generated_at: str

class SearchQuery(BaseModel):
    query: str
    filters: Optional[dict] = None

class FounderScoreResponse(BaseModel):
    founder_id: str
    overall_score: float
    execution_velocity: float
    domain_expertise: float
    resilience_history: float
    confidence: float
    data_completeness: float
    trend: str
    trend_delta: float
    is_cold_start: bool
    history: list[dict]

class OutboundSignalResponse(BaseModel):
    id: str
    source: str
    signal_type: str
    title: str
    description: str
    url: str
    strength: float
    discovered_at: str
