# =============================================
# VC Brain — 3-Axis Screening Engine
# =============================================
# Three INDEPENDENT axes. They are NEVER averaged.
#
# 1. Founder Axis — Can this team execute anything?
# 2. Market Axis  — Is the structural tailwind real?
# 3. Idea vs Market — Does this product capture this market?
#
# Each axis returns: score (0-100), confidence (0-1), trend, signals[]

from typing import Optional

def score_founder_axis(
    founder_score: float,
    team_completeness: float = 0.5,  # 0-1: do they have CTO, etc.
    domain_authority: float = 0.5,    # 0-1: are they known in the space?
    technical_depth: float = 0.5,     # 0-1: can they build vs outsource?
    data_completeness: float = 0.5,
) -> dict:
    """
    Founder Axis: Would you back this team regardless of their idea?
    
    Heavily weighted toward the persistent Founder Score.
    """
    raw = (
        founder_score * 0.50 +
        team_completeness * 100 * 0.15 +
        domain_authority * 100 * 0.15 +
        technical_depth * 100 * 0.20
    )
    score = round(min(100, max(0, raw)), 1)
    confidence = round(min(0.99, data_completeness * 0.9), 2)
    
    signals = []
    if founder_score >= 85: signals.append(f"Outlier founder score: {founder_score}")
    if founder_score < 50: signals.append(f"Below-average founder score: {founder_score}")
    if team_completeness < 0.5: signals.append("Incomplete founding team")
    if team_completeness >= 0.8: signals.append("Strong, complete founding team")
    if technical_depth >= 0.7: signals.append("Deep technical capability")
    if technical_depth < 0.3: signals.append("Limited technical depth — execution risk")
    
    return {"score": score, "confidence": confidence, "trend": "stable", "signals": signals}


def score_market_axis(
    tam_size_b: float = 0.0,       # TAM in billions USD
    market_growth_pct: float = 0.0, # annual growth %
    competitor_density: float = 0.5, # 0-1: lower = less competition
    regulatory_risk: float = 0.0,    # 0-1: higher = more risk
    timing_signal: float = 0.5,      # 0-1: is the market ready now?
) -> dict:
    """
    Market Axis: Is there a big, growing wave to ride?
    
    Independent of who is building or what they're building.
    """
    tam_score = min(30, tam_size_b * 3)  # $10B+ gets max
    growth_score = min(25, market_growth_pct * 0.8)  # 30%+ gets max
    competition_score = (1 - competitor_density) * 20  # less competition = better
    regulatory_penalty = regulatory_risk * 10
    timing_score = timing_signal * 25
    
    raw = tam_score + growth_score + competition_score + timing_score - regulatory_penalty
    score = round(min(100, max(0, raw)), 1)
    
    signals = []
    if tam_size_b >= 10: signals.append(f"Large TAM: ${tam_size_b}B+")
    if tam_size_b < 1: signals.append(f"Small TAM: ${tam_size_b}B — niche market risk")
    if market_growth_pct >= 20: signals.append(f"Fast-growing market: {market_growth_pct}% CAGR")
    if competitor_density > 0.7: signals.append("Crowded competitive landscape")
    if competitor_density < 0.3: signals.append("Blue ocean — limited competition")
    if regulatory_risk > 0.5: signals.append("Significant regulatory headwinds")
    if timing_signal > 0.7: signals.append("Strong market timing")
    
    return {"score": score, "confidence": 0.80, "trend": "stable", "signals": signals}


def score_idea_vs_market_axis(
    unique_insight_strength: float = 0.5,  # 0-1
    technical_moat: float = 0.5,           # 0-1
    traction_evidence: float = 0.0,        # 0-1 (from trust-verified claims)
    gtm_clarity: float = 0.5,              # 0-1
    pricing_validation: float = 0.5,       # 0-1
    avg_trust_score: float = 0.5,          # average trust of traction claims
) -> dict:
    """
    Idea vs Market Axis: Does THIS product capture THIS market?
    
    This axis explicitly uses Trust Score-verified traction data.
    """
    insight_score = unique_insight_strength * 25
    moat_score = technical_moat * 20
    traction_score = traction_evidence * 25
    gtm_score = gtm_clarity * 15
    pricing_score = pricing_validation * 15
    
    # Penalize if traction claims have low trust
    trust_penalty = max(0, (0.5 - avg_trust_score) * 20)
    
    raw = insight_score + moat_score + traction_score + gtm_score + pricing_score - trust_penalty
    score = round(min(100, max(0, raw)), 1)
    
    confidence = round(min(0.99, (avg_trust_score * 0.5 + 0.4)), 2)
    
    signals = []
    if unique_insight_strength >= 0.7: signals.append("Strong unique insight / contrarian thesis")
    if technical_moat >= 0.7: signals.append("Defensible technical moat")
    if traction_evidence >= 0.6: signals.append("Meaningful traction evidence (trust-verified)")
    if traction_evidence < 0.2: signals.append("Minimal traction — pre-revenue or unverified")
    if avg_trust_score < 0.4: signals.append("⚠ Low trust in traction claims — verify independently")
    if gtm_clarity >= 0.7: signals.append("Clear go-to-market strategy")
    
    return {"score": score, "confidence": confidence, "trend": "stable", "signals": signals}


def compute_thesis_alignment(
    thesis: dict,
    startup_sector: str,
    startup_stage: str,
    startup_geography: str,
    founder_tags: list[str],
) -> float:
    """
    Score how well this opportunity aligns with the investor's thesis.
    Returns 0-100.
    """
    alignment = 0.0
    max_points = 0.0
    
    # Sector match (30 points)
    max_points += 30
    if thesis.get("sectors"):
        for sector in thesis["sectors"]:
            if sector.lower() in startup_sector.lower() or startup_sector.lower() in sector.lower():
                alignment += 30
                break
    
    # Stage match (20 points)
    max_points += 20
    if thesis.get("stages"):
        if startup_stage.lower() in [s.lower() for s in thesis["stages"]]:
            alignment += 20
    
    # Geography match (20 points)
    max_points += 20
    if thesis.get("geographies"):
        for geo in thesis["geographies"]:
            if geo.lower() in startup_geography.lower() or startup_geography.lower() in geo.lower():
                alignment += 20
                break
    
    # Keyword match (30 points)
    max_points += 30
    if thesis.get("keywords"):
        tag_string = " ".join(founder_tags).lower()
        matched = sum(1 for kw in thesis["keywords"] if kw.lower() in tag_string)
        keyword_score = min(30, (matched / max(1, len(thesis["keywords"]))) * 30)
        alignment += keyword_score
    
    return round((alignment / max(1, max_points)) * 100, 1)
