# =============================================
# VC Brain — Agent 3: Validation (Trust Score) Agent
# =============================================
# Cross-references extracted claims against web research
# to generate a per-claim Trust Score.
# =============================================
import os
import json
from utils.llm import get_llm_client, get_model_name
from dotenv import load_dotenv

load_dotenv()
client = get_llm_client()

VALIDATOR_PROMPT = """You are a VC diligence AI. Your job is to calculate a 'Trust Score' for claims made in a pitch deck by comparing them to independent web research.

You will be given:
1. A list of claims extracted from a pitch deck.
2. Web research data gathered from GitHub, LinkedIn, News, etc.

For EACH claim, output a validation result with:
- score (0-100): The overall trust score
- extraction_confidence (0-1): How clear was the claim in the deck?
- source_reliability (0-1): Is the corroborating source trustworthy? (e.g. GitHub=0.9, Random blog=0.3)
- corroboration_count (int): How many independent sources confirm this?
- freshness_days (int): Approximate age of the evidence in days (use 0 if unknown)
- contradiction_flag (boolean): Does the web research actively contradict the claim?
- reasoning (string): Plain English explanation of why it received this score and any contradictions found.

Output strictly as a JSON object where the keys are the exact claim 'statement' strings, and the values are the validation result objects.
{
  "Claim statement exactly as provided": {
    "score": 85,
    "extraction_confidence": 1.0,
    "source_reliability": 0.9,
    "corroboration_count": 1,
    "freshness_days": 30,
    "contradiction_flag": false,
    "reasoning": "..."
  }
}
"""

def validate_claims(claims: list, research_data: dict) -> dict:
    """
    Validates a list of claims against web research data.
    """
    if not claims:
        return {}
        
    response = client.chat.completions.create(
        model=get_model_name("gpt-4o"),
        messages=[
            {"role": "system", "content": VALIDATOR_PROMPT},
            {"role": "user", "content": f"Claims:\n{json.dumps(claims, indent=2)}\n\nResearch Data:\n{json.dumps(research_data, indent=2)[:30000]}"}
        ],
        temperature=0.1,
        response_format={"type": "json_object"}
    )
    
    result_text = response.choices[0].message.content
    try:
        return json.loads(result_text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse validation data", "raw": result_text}
