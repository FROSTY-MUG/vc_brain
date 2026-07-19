# =============================================
# VC Brain — Agent 4: 3-Axis Screener Agent
# =============================================
# Scores Founder, Market, and Idea independently
# based on extracted claims and web research.
# =============================================
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SCREENER_PROMPT = """You are an elite VC screening AI. 
Evaluate a startup opportunity based on pitch deck claims and web research.
You must output exactly 3 independent scores (0-100) on three axes:
1. Founder: Evaluate execution velocity, domain expertise, resilience, and handle cold-starts implicitly if there is no track record (look for potential/grit).
2. Market: Evaluate TAM/SAM/SOM, growth rate, competitive landscape, SWOT.
3. Idea vs Market: Evaluate product-market fit signals, pivot potential, defensibility.

Do NOT average these scores.
For each axis, output:
- score (0-100)
- trend ('rising', 'stable', or 'declining')
- confidence (0-1) based on data availability
- signals (list of strings): 2-3 short bullet points justifying the score.

Also output an overall 'recommendation' based on thesis alignment: 'deploy', 'diligence', 'watch', or 'pass'.

Output as strictly formatted JSON:
{
  "founder": {
    "score": 0,
    "trend": "stable",
    "confidence": 0.0,
    "signals": ["..."]
  },
  "market": {
    "score": 0,
    "trend": "stable",
    "confidence": 0.0,
    "signals": ["..."]
  },
  "idea": {
    "score": 0,
    "trend": "stable",
    "confidence": 0.0,
    "signals": ["..."]
  },
  "recommendation": "diligence"
}
"""

def screen_opportunity(extraction_data: dict, research_data: dict) -> dict:
    """
    Evaluates an opportunity across 3 independent axes.
    """
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SCREENER_PROMPT},
            {"role": "user", "content": f"Extraction Data:\n{json.dumps(extraction_data, indent=2)}\n\nResearch Data:\n{json.dumps(research_data, indent=2)[:30000]}"}
        ],
        temperature=0.1,
        response_format={"type": "json_object"}
    )
    
    result_text = response.choices[0].message.content
    try:
        return json.loads(result_text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse screener data", "raw": result_text}

def run_screener(claims: list, web_research: dict, founder_scores: list, startup_info: dict) -> dict:
    """
    Wrapper for pipeline.py: maps the 4-arg call into screen_opportunity.
    Bundles claims + startup_info as extraction_data, passes web_research through.
    Falls back to a default scoring dict if the LLM call fails.
    """
    extraction_data = {
        "claims": claims,
        "startup_info": startup_info,
        "founder_scores": founder_scores
    }
    try:
        result = screen_opportunity(extraction_data, web_research)
        # Normalise key name: screener returns 'idea' but pipeline stores 'idea_vs_market'
        if "idea" in result and "idea_vs_market" not in result:
            result["idea_vs_market"] = result.pop("idea")
        return result
    except Exception as e:
        print(f"run_screener fallback triggered: {e}")
        return {
            "founder": {"score": 60, "trend": "stable", "confidence": 0.5, "signals": ["fallback_score"]},
            "market":  {"score": 60, "trend": "stable", "confidence": 0.5, "signals": ["fallback_score"]},
            "idea_vs_market": {"score": 60, "trend": "stable", "confidence": 0.5, "signals": ["fallback_score"]},
            "recommendation": "diligence"
        }

