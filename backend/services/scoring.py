# =============================================
# VC Brain — Founder Score Engine
# =============================================
# The Founder Score is PERSISTENT — it follows the founder across startups.
# It never resets when a founder starts a new company.
#
# Formula:
#   If cold-start (no prior history):
#     Score = (ExecutionVelocity * 0.6) + (DomainExpertise * 0.4)
#     Confidence = max(0.4, data_completeness * 0.8)
#
#   If established:
#     Score = (ExecutionVelocity * 0.35) + (DomainExpertise * 0.30) + (ResilienceHistory * 0.35)
#     Confidence = data_completeness * 0.95
#
# Anti-bias:
#   - Pedigree signals (university, FAANG) are capped at +5 points max
#   - Name, gender, and location are stripped before scoring
#   - Velocity (rate of output) is weighted highest to favor doers over talkers

import math
from typing import Optional

PEDIGREE_CAP = 5.0

def compute_execution_velocity(
    github_commits_90d: int = 0,
    projects_shipped: int = 0,
    days_since_last_ship: int = 365,
    contributions_trend: float = 0.0  # positive = accelerating
) -> float:
    """Score 0-100 measuring how fast the founder ships."""
    commit_score = min(40, github_commits_90d * 0.15)
    ship_score = min(30, projects_shipped * 10)
    recency_score = max(0, 20 - (days_since_last_ship / 18.25))  # decays over 1yr
    trend_bonus = min(10, max(0, contributions_trend * 5))
    return min(100, commit_score + ship_score + recency_score + trend_bonus)

def compute_domain_expertise(
    years_in_domain: int = 0,
    papers_published: int = 0,
    patents: int = 0,
    technical_depth_signal: float = 0.0,  # from LLM analysis of bio/code
    pedigree_bonus: float = 0.0  # Stanford/FAANG etc — CAPPED
) -> float:
    """Score 0-100 measuring how deep the founder's domain knowledge is."""
    years_score = min(30, years_in_domain * 4)
    papers_score = min(25, papers_published * 2.5)
    patents_score = min(15, patents * 5)
    depth_score = min(20, technical_depth_signal * 20)
    pedigree = min(PEDIGREE_CAP, pedigree_bonus)
    # Cap at 5 to prevent Stanford bias
    return min(100, years_score + papers_score + patents_score + depth_score + pedigree)

def compute_resilience_history(
    previous_startups: int = 0,
    exits: int = 0,
    exit_value_usd: float = 0,
    years_as_founder: int = 0,
    failure_recovery: bool = False  # did they bounce back from a failed startup?
) -> float:
    """Score 0-100 measuring founder's track record and grit."""
    startup_score = min(25, previous_startups * 12.5)
    exit_score = min(30, exits * 15)
    value_score = min(20, math.log10(max(1, exit_value_usd)) * 2.5)
    years_score = min(15, years_as_founder * 3)
    recovery_bonus = 10 if failure_recovery else 0
    return min(100, startup_score + exit_score + value_score + years_score + recovery_bonus)

def compute_data_completeness(
    has_linkedin: bool = False,
    has_github: bool = False,
    has_bio: bool = False,
    has_work_history: bool = False,
    has_education: bool = False,
    has_prior_startups: bool = False,
) -> float:
    """0-1 measuring how much data we have on this founder."""
    signals = [has_linkedin, has_github, has_bio, has_work_history, has_education, has_prior_startups]
    return sum(signals) / len(signals)

def compute_founder_score(
    execution_velocity: float,
    domain_expertise: float,
    resilience_history: float,
    data_completeness: float,
    is_cold_start: bool,
    previous_score: Optional[float] = None,
) -> dict:
    """
    Compute the persistent Founder Score.
    Returns dict with score, confidence, trend info.
    """
    if is_cold_start:
        raw_score = (execution_velocity * 0.6) + (domain_expertise * 0.4)
        confidence = max(0.4, data_completeness * 0.8)
    else:
        raw_score = (
            execution_velocity * 0.35 +
            domain_expertise * 0.30 +
            resilience_history * 0.35
        )
        confidence = min(0.99, data_completeness * 0.95)

    score = round(min(100, max(0, raw_score)), 1)

    # Trend
    if previous_score is not None:
        delta = score - previous_score
        if delta > 2:
            trend = "rising"
        elif delta < -2:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "stable"
        delta = 0.0

    return {
        "overall_score": score,
        "execution_velocity": round(execution_velocity, 1),
        "domain_expertise": round(domain_expertise, 1),
        "resilience_history": round(resilience_history, 1),
        "confidence": round(confidence, 2),
        "data_completeness": round(data_completeness, 2),
        "trend": trend,
        "trend_delta": round(delta, 1),
        "is_cold_start": is_cold_start,
    }
