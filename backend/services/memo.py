# =============================================
# VC Brain — Memo Generation Engine
# =============================================
# Generates evidence-backed investment memos.
# Rules:
#   - Never fabricate unavailable data
#   - Explicitly mark missing fields as "MISSING"
#   - Every major claim must cite evidence
#   - Surface trust and uncertainty
#   - End with clear recommendation + open questions

import json
from datetime import datetime

MEMO_TEMPLATE = {
    "company_snapshot": "",
    "investment_hypotheses": [],
    "swot": {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []},
    "problem_and_product": "",
    "traction_and_kpis": {"content": "", "data_status": "missing", "citations": []},
    "team_and_history": {"content": "", "data_status": "missing", "citations": []},
    "technology_and_defensibility": {"content": "", "data_status": "missing", "citations": []},
    "market_sizing": {"content": "", "data_status": "missing", "citations": []},
    "competition": {"content": "", "data_status": "missing", "citations": []},
    "trust_summary": {"verified_claims": 0, "contradictions": 0, "avg_trust_score": 0, "flags": []},
    "recommendation": {"action": "diligence", "confidence": "LOW", "reasoning": ""},
    "open_questions": [],
    "generated_at": "",
}


def generate_memo(
    startup: dict,
    founders: list[dict],
    founder_scores: list[dict],
    claims: list[dict],
    opportunity_scores: dict,
    thesis: dict = None,
) -> dict:
    """
    Generate a structured investment memo from all available data.
    
    In production this would call an LLM. For the hackathon MVP,
    we use structured template filling with real data.
    """
    memo = json.loads(json.dumps(MEMO_TEMPLATE))  # deep copy
    
    # ── Company Snapshot ──
    founder_names = ", ".join([f.get("name", "Unknown") for f in founders])
    memo["company_snapshot"] = (
        f"{startup.get('name', 'Unknown Company')} is a {startup.get('stage', 'early-stage')} "
        f"{startup.get('sector', 'technology')} company based in {startup.get('geography', 'Unknown')}. "
        f"Founded by {founder_names}."
    )
    
    # ── Investment Hypotheses ──
    hypotheses = []
    for fs in founder_scores:
        if fs.get("overall_score", 0) >= 80:
            hypotheses.append(f"Founder has an exceptional score of {fs['overall_score']}/100, indicating outlier execution capability.")
        if fs.get("is_cold_start"):
            hypotheses.append("Cold-start founder with limited history but high velocity signals — classic hidden gem profile.")
    
    if opportunity_scores.get("market", {}).get("score", 0) >= 80:
        hypotheses.append("Market conditions are highly favorable with strong structural tailwinds.")
    if opportunity_scores.get("thesis_alignment", 0) >= 80:
        hypotheses.append(f"High thesis alignment ({opportunity_scores['thesis_alignment']}%) — fits the fund's investment criteria well.")
    
    memo["investment_hypotheses"] = hypotheses if hypotheses else ["Insufficient data to form strong hypotheses. Requires deeper diligence."]
    
    # ── SWOT ──
    strengths = []
    weaknesses = []
    opportunities = []
    threats = []
    
    for fs in founder_scores:
        if fs.get("overall_score", 0) >= 80:
            strengths.append(f"Strong founder score: {fs['overall_score']}/100")
        if fs.get("overall_score", 0) < 50:
            weaknesses.append(f"Weak founder score: {fs['overall_score']}/100")
    
    verified = [c for c in claims if c.get("trust_score", {}).get("score", 0) >= 70]
    contradicted = [c for c in claims if c.get("trust_score", {}).get("contradiction_flag", False)]
    
    if verified:
        strengths.append(f"{len(verified)} claims independently verified")
    if contradicted:
        weaknesses.append(f"{len(contradicted)} claims have contradictions — high data risk")
    
    for signal in opportunity_scores.get("market", {}).get("signals", []):
        if any(pos in signal.lower() for pos in ["growing", "large", "strong"]):
            opportunities.append(signal)
        if any(neg in signal.lower() for neg in ["crowded", "regulatory", "risk"]):
            threats.append(signal)
    
    memo["swot"] = {
        "strengths": strengths or ["Insufficient data"],
        "weaknesses": weaknesses or ["Insufficient data"],
        "opportunities": opportunities or ["Insufficient data"],
        "threats": threats or ["Insufficient data"],
    }
    
    # ── Traction & KPIs ──
    traction_claims = [c for c in claims if c.get("claim_type") in ("revenue", "growth", "users", "traction")]
    if traction_claims:
        traction_lines = []
        citations = set()
        for tc in traction_claims:
            trust = tc.get("trust_score", {})
            flag = " ⚠️ CONTRADICTION" if trust.get("contradiction_flag") else ""
            traction_lines.append(f"{tc['statement']} (Trust: {trust.get('score', 0)}/100{flag})")
            citations.add(tc.get("source", "Unknown"))
        memo["traction_and_kpis"] = {
            "content": " | ".join(traction_lines),
            "data_status": "available" if len(traction_claims) >= 3 else "partial",
            "citations": list(citations),
        }
    
    # ── Team & History ──
    if founders:
        team_lines = []
        citations = set()
        for f in founders:
            team_lines.append(f"{f.get('name', 'Unknown')} — {f.get('bio', 'No bio available')}")
            if f.get("linkedin_url"): citations.add("LinkedIn")
        team_claims = [c for c in claims if c.get("claim_type") == "team_background"]
        for tc in team_claims:
            trust = tc.get("trust_score", {})
            team_lines.append(f"Claim: {tc['statement']} (Trust: {trust.get('score', 0)}/100)")
            citations.add(tc.get("source", "Unknown"))
        memo["team_and_history"] = {
            "content": " | ".join(team_lines),
            "data_status": "available" if team_claims else "partial",
            "citations": list(citations),
        }
    
    # ── Trust Summary ──
    all_trust = [c.get("trust_score", {}).get("score", 0) for c in claims]
    avg_trust = sum(all_trust) / max(1, len(all_trust))
    flags = []
    for c in contradicted:
        flags.append(f"CONTRADICTION: {c['statement']} — {c.get('trust_score', {}).get('reasoning', '')}")
    
    unverified = [c for c in claims if c.get("trust_score", {}).get("score", 0) < 40]
    if unverified:
        flags.append(f"{len(unverified)} claims have trust score below 40 — require manual verification")
    
    memo["trust_summary"] = {
        "verified_claims": len(verified),
        "contradictions": len(contradicted),
        "avg_trust_score": round(avg_trust, 1),
        "flags": flags,
    }
    
    # ── Recommendation ──
    founder_axis = opportunity_scores.get("founder", {}).get("score", 0)
    market_axis = opportunity_scores.get("market", {}).get("score", 0)
    idea_axis = opportunity_scores.get("idea_vs_market", {}).get("score", 0)
    
    if contradicted:
        action = "diligence"
        confidence = "LOW"
        reasoning = f"Cannot recommend deployment due to {len(contradicted)} unresolved contradictions in claims. Requires manual verification before proceeding."
    elif founder_axis >= 80 and market_axis >= 70 and avg_trust >= 60:
        action = "deploy"
        confidence = "HIGH" if avg_trust >= 75 else "MEDIUM"
        reasoning = (
            f"Strong founder ({founder_axis}/100) in a favorable market ({market_axis}/100). "
            f"Avg trust score of {avg_trust:.0f}/100. "
            f"Thesis alignment: {opportunity_scores.get('thesis_alignment', 0)}%. "
            f"Recommend deploying within 24 hours."
        )
    elif founder_axis >= 80:
        action = "diligence"
        confidence = "MEDIUM"
        reasoning = f"Exceptional founder ({founder_axis}/100) warrants deeper investigation despite market/idea concerns."
    else:
        action = "pass"
        confidence = "HIGH"
        reasoning = f"Founder score ({founder_axis}/100) and thesis alignment ({opportunity_scores.get('thesis_alignment', 0)}%) do not meet deployment threshold."
    
    memo["recommendation"] = {"action": action, "confidence": confidence, "reasoning": reasoning}
    
    # ── Open Questions ──
    questions = []
    missing_sections = [k for k, v in memo.items() if isinstance(v, dict) and v.get("data_status") == "missing"]
    if missing_sections:
        questions.append(f"Missing data in sections: {', '.join(missing_sections)}. Request additional documentation.")
    for c in contradicted:
        questions.append(f"Verify: {c['statement']} — evidence contradicts this claim.")
    if not any(c.get("claim_type") == "revenue" for c in claims):
        questions.append("Revenue data not provided. Request bank statements or Stripe dashboard.")
    
    questions.append("What is the current burn rate and cash runway?")
    questions.append("What are the key assumptions in the financial model?")
    
    memo["open_questions"] = questions
    memo["generated_at"] = datetime.utcnow().isoformat() + "Z"
    
    return memo
