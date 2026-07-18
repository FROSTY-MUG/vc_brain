# =============================================
# VC Brain — Trust Score Engine
# =============================================
# Trust Score is PER CLAIM, not per company.
#
# Formula:
#   TrustScore = min(100,
#     (ExtractionConfidence * 20) +
#     (SourceReliability * 25) +
#     (CorroborationBonus) +
#     (FreshnessBonus) -
#     (ContradictionPenalty)
#   )
#
# Source Reliability Weights:
#   - First-party (pitch deck, founder statement): 0.40-0.55
#   - Semi-verified (LinkedIn, personal website): 0.60-0.75
#   - Third-party verified (GitHub API, Crunchbase, App Store): 0.85-0.99
#   - Official records (patents, SEC filings): 0.95-1.0

from typing import Optional

# Source reliability presets
SOURCE_WEIGHTS = {
    "deck": 0.50,
    "founder_statement": 0.45,
    "linkedin": 0.70,
    "linkedin_profile": 0.70,
    "personal_website": 0.60,
    "github_api": 0.95,
    "github": 0.95,
    "crunchbase": 0.90,
    "app_store": 0.92,
    "play_store": 0.92,
    "trustpilot": 0.80,
    "similarweb": 0.85,
    "sec_filing": 0.98,
    "patent_office": 0.97,
    "arxiv": 0.88,
    "news_article": 0.65,
    "techcrunch": 0.75,
}

def get_source_reliability(source: str) -> float:
    """Look up reliability weight for a given source."""
    source_lower = source.lower().replace(" ", "_")
    # Try direct match
    if source_lower in SOURCE_WEIGHTS:
        return SOURCE_WEIGHTS[source_lower]
    # Try prefix match (e.g. "deck_slide_4" -> "deck")
    for key in SOURCE_WEIGHTS:
        if source_lower.startswith(key):
            return SOURCE_WEIGHTS[key]
    # Default: unknown source gets low reliability
    return 0.40


def compute_trust_score(
    source: str,
    extraction_confidence: float = 0.90,
    corroboration_count: int = 0,
    freshness_days: int = 30,
    has_contradiction: bool = False,
    contradiction_severity: float = 0.0,  # 0.0 - 1.0
) -> dict:
    """
    Compute the per-claim Trust Score.
    
    Returns:
        dict with score, reasoning components, and contradiction flag.
    """
    source_reliability = get_source_reliability(source)
    
    # Component scores
    extraction_component = extraction_confidence * 20       # max 20
    reliability_component = source_reliability * 25          # max 25
    
    # Corroboration: +15 for first corroboration, +8 for second, +5 for each after
    if corroboration_count == 0:
        corroboration_bonus = 0
    elif corroboration_count == 1:
        corroboration_bonus = 15
    elif corroboration_count == 2:
        corroboration_bonus = 23
    else:
        corroboration_bonus = min(35, 23 + (corroboration_count - 2) * 5)
    
    # Freshness: max 15 points, decays over 90 days
    if freshness_days <= 7:
        freshness_bonus = 15
    elif freshness_days <= 30:
        freshness_bonus = 12
    elif freshness_days <= 60:
        freshness_bonus = 8
    elif freshness_days <= 90:
        freshness_bonus = 4
    else:
        freshness_bonus = 0
    
    # Contradiction penalty: -30 to -50 depending on severity
    if has_contradiction:
        contradiction_penalty = 30 + (contradiction_severity * 20)
    else:
        contradiction_penalty = 0
    
    raw_score = (
        extraction_component +
        reliability_component +
        corroboration_bonus +
        freshness_bonus -
        contradiction_penalty
    )
    
    score = round(max(0, min(100, raw_score)), 1)
    
    return {
        "score": score,
        "contradiction_flag": has_contradiction,
        "source_reliability": round(source_reliability, 2),
        "corroboration_count": corroboration_count,
        "freshness_days": freshness_days,
        "extraction_confidence": round(extraction_confidence, 2),
        "components": {
            "extraction": round(extraction_component, 1),
            "reliability": round(reliability_component, 1),
            "corroboration": round(corroboration_bonus, 1),
            "freshness": round(freshness_bonus, 1),
            "contradiction_penalty": round(contradiction_penalty, 1),
        },
    }


def detect_contradictions(claims: list[dict]) -> list[dict]:
    """
    Simple contradiction detector.
    Checks for logical inconsistencies between claims.
    
    In production, this would use an LLM. For the hackathon,
    we use rule-based heuristics.
    """
    contradictions = []
    
    revenue_claims = [c for c in claims if c.get("claim_type") in ("revenue", "growth")]
    user_claims = [c for c in claims if c.get("claim_type") in ("users", "traction")]
    
    # Rule: If MRR and customer count exist, check if ARPU is reasonable
    mrr_claim = None
    customer_claim = None
    for c in claims:
        if c.get("claim_type") == "revenue" and c.get("extracted_value"):
            try:
                val = c["extracted_value"].replace("$", "").replace(",", "").replace("K", "000").replace("M", "000000")
                mrr_claim = {"claim": c, "value": float(val)}
            except ValueError:
                pass
        if c.get("claim_type") == "users" and c.get("extracted_value"):
            try:
                val = c["extracted_value"].replace(",", "")
                customer_claim = {"claim": c, "value": float(val)}
            except ValueError:
                pass
    
    if mrr_claim and customer_claim and customer_claim["value"] > 0:
        implied_arpu = mrr_claim["value"] / customer_claim["value"]
        if implied_arpu > 10000 or implied_arpu < 1:
            contradictions.append({
                "type": "arpu_inconsistency",
                "claim_ids": [mrr_claim["claim"]["id"], customer_claim["claim"]["id"]],
                "reasoning": f"Implied ARPU of ${implied_arpu:.2f} is outside reasonable range. Revenue of ${mrr_claim['value']:.0f} / {customer_claim['value']:.0f} customers doesn't add up.",
                "severity": 0.8,
            })
    
    return contradictions
