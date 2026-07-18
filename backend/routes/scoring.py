# =============================================
# VC Brain — Scoring Routes
# =============================================
from fastapi import APIRouter
from services.scoring import (
    compute_execution_velocity,
    compute_domain_expertise,
    compute_resilience_history,
    compute_data_completeness,
    compute_founder_score,
)
from services.screening import (
    score_founder_axis,
    score_market_axis,
    score_idea_vs_market_axis,
    compute_thesis_alignment,
)
from services.trust import compute_trust_score, detect_contradictions

router = APIRouter()

@router.post("/founder-score")
async def calculate_founder_score(data: dict):
    """Compute the persistent Founder Score."""
    velocity = compute_execution_velocity(
        github_commits_90d=data.get("github_commits_90d", 0),
        projects_shipped=data.get("projects_shipped", 0),
        days_since_last_ship=data.get("days_since_last_ship", 365),
        contributions_trend=data.get("contributions_trend", 0),
    )
    expertise = compute_domain_expertise(
        years_in_domain=data.get("years_in_domain", 0),
        papers_published=data.get("papers_published", 0),
        patents=data.get("patents", 0),
        technical_depth_signal=data.get("technical_depth_signal", 0),
        pedigree_bonus=data.get("pedigree_bonus", 0),
    )
    resilience = compute_resilience_history(
        previous_startups=data.get("previous_startups", 0),
        exits=data.get("exits", 0),
        exit_value_usd=data.get("exit_value_usd", 0),
        years_as_founder=data.get("years_as_founder", 0),
        failure_recovery=data.get("failure_recovery", False),
    )
    completeness = compute_data_completeness(
        has_linkedin=data.get("has_linkedin", False),
        has_github=data.get("has_github", False),
        has_bio=data.get("has_bio", False),
        has_work_history=data.get("has_work_history", False),
        has_education=data.get("has_education", False),
        has_prior_startups=data.get("has_prior_startups", False),
    )
    result = compute_founder_score(
        execution_velocity=velocity,
        domain_expertise=expertise,
        resilience_history=resilience,
        data_completeness=completeness,
        is_cold_start=data.get("is_cold_start", True),
        previous_score=data.get("previous_score"),
    )
    return result


@router.post("/3-axis")
async def calculate_3axis(data: dict):
    """Compute the 3 independent screening axes."""
    founder = score_founder_axis(
        founder_score=data.get("founder_score", 50),
        team_completeness=data.get("team_completeness", 0.5),
        domain_authority=data.get("domain_authority", 0.5),
        technical_depth=data.get("technical_depth", 0.5),
        data_completeness=data.get("data_completeness", 0.5),
    )
    market = score_market_axis(
        tam_size_b=data.get("tam_size_b", 1.0),
        market_growth_pct=data.get("market_growth_pct", 10),
        competitor_density=data.get("competitor_density", 0.5),
        regulatory_risk=data.get("regulatory_risk", 0.0),
        timing_signal=data.get("timing_signal", 0.5),
    )
    idea = score_idea_vs_market_axis(
        unique_insight_strength=data.get("unique_insight", 0.5),
        technical_moat=data.get("technical_moat", 0.5),
        traction_evidence=data.get("traction_evidence", 0.0),
        gtm_clarity=data.get("gtm_clarity", 0.5),
        pricing_validation=data.get("pricing_validation", 0.5),
        avg_trust_score=data.get("avg_trust_score", 0.5),
    )
    
    thesis_alignment = 0
    if "thesis" in data and "startup" in data:
        thesis_alignment = compute_thesis_alignment(
            thesis=data["thesis"],
            startup_sector=data["startup"].get("sector", ""),
            startup_stage=data["startup"].get("stage", ""),
            startup_geography=data["startup"].get("geography", ""),
            founder_tags=data.get("founder_tags", []),
        )
    
    return {
        "founder": founder,
        "market": market,
        "idea_vs_market": idea,
        "thesis_alignment": thesis_alignment,
    }


@router.post("/trust-score")
async def calculate_trust(data: dict):
    """Compute per-claim Trust Score."""
    result = compute_trust_score(
        source=data.get("source", "deck"),
        extraction_confidence=data.get("extraction_confidence", 0.9),
        corroboration_count=data.get("corroboration_count", 0),
        freshness_days=data.get("freshness_days", 30),
        has_contradiction=data.get("has_contradiction", False),
        contradiction_severity=data.get("contradiction_severity", 0),
    )
    return result


@router.post("/detect-contradictions")
async def detect_claim_contradictions(data: dict):
    """Detect contradictions between claims."""
    claims = data.get("claims", [])
    contradictions = detect_contradictions(claims)
    return {"contradictions": contradictions, "count": len(contradictions)}
