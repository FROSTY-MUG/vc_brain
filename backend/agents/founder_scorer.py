# =============================================
# VC Brain — Agent 6: Persistent Founder Scorer
# =============================================
# Calculates the Persistent Founder Score
# that lives in Memory and never resets.
# =============================================
import os
import json
from utils.llm import get_llm_client, get_model_name
from dotenv import load_dotenv

load_dotenv()
client = get_llm_client()

FOUNDER_SCORE_PROMPT = """You are a VC AI. Evaluate a founder's raw track record (from web research) and generate a persistent 'Founder Score'.

This score is independent of the current startup. It evaluates the PERSON.
1. Execution Velocity (0-100)
2. Domain Expertise (0-100)
3. Resilience History (0-100)

If this is a "Cold Start" (first time founder, no github, no funding history), you MUST explicitly state how you handle it (e.g. looking at academic rigor, hackathons, or raw hustle shown in side projects) and set 'is_cold_start' to true.

Output strictly formatted JSON:
{
  "overall_score": 85.5,
  "execution_velocity": 80.0,
  "domain_expertise": 90.0,
  "resilience_history": 85.0,
  "confidence": 0.8,
  "data_completeness": 0.7,
  "trend": "rising",
  "trend_delta": 2.5,
  "is_cold_start": false
}
"""

def score_founder(founder_research: dict) -> dict:
    """
    Evaluates a founder and returns the persistent founder score metrics.
    """
    response = client.chat.completions.create(
        model=get_model_name("gpt-4o"),
        messages=[
            {"role": "system", "content": FOUNDER_SCORE_PROMPT},
            {"role": "user", "content": f"Founder Data:\n{json.dumps(founder_research, indent=2)}"}
        ],
        temperature=0.1,
        response_format={"type": "json_object"}
    )
    
    result_text = response.choices[0].message.content
    try:
        return json.loads(result_text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse founder score data", "raw": result_text}

def score_founders(founders: list, research_data: dict) -> list:
    """
    Wrapper for pipeline.py: scores each founder individually using research_data.
    Returns a list of score dicts, each augmented with the founder's name.
    """
    founders_research = research_data.get("founders_research", []) if isinstance(research_data, dict) else []
    scores = []
    for founder in founders:
        name = founder.get("name", "") if isinstance(founder, dict) else str(founder)
        # Find matching research entry
        founder_research = next(
            (r for r in founders_research if r.get("name", "").lower() == name.lower()),
            {"name": name}
        )
        try:
            score = score_founder(founder_research)
        except Exception as e:
            print(f"Founder scoring failed for {name}: {e}")
            score = {
                "overall_score": 50,
                "execution_velocity": 50,
                "domain_expertise": 50,
                "resilience_history": 50,
                "confidence": 0.5,
                "data_completeness": 0.3,
                "trend": "stable",
                "trend_delta": 0.0,
                "is_cold_start": True
            }
        score["name"] = name
        scores.append(score)
    return scores

