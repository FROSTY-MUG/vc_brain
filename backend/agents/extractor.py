# =============================================
# VC Brain — Agent 1: Claim Extraction Agent
# =============================================
# Reads raw PDF text and uses GPT-4o to extract
# structured claims with source attribution.
# =============================================
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EXTRACTION_PROMPT = """You are a venture capital analyst AI. You have been given the raw text extracted from a startup's pitch deck.

Your job is to extract EVERY factual claim made in the deck. Be thorough and precise.

For each claim, output:
- claim_type: one of [revenue, growth, users, team_background, market_size, tech_moat, patents, traction, funding, partnerships, product, competition]
- statement: the exact claim in plain English
- extracted_value: the specific number/metric if applicable (e.g., "$1.2M ARR", "40% MoM growth")
- source: which part of the deck this came from (e.g., "Deck - Team Slide", "Deck - Traction", "Deck - Market Size")

Also extract:
- company_name: the startup's name
- founders: list of founder names mentioned, with any titles/roles
- sector: the industry/sector
- stage: funding stage if mentioned
- geography: location if mentioned
- website: if mentioned
- problem_statement: the core problem being solved
- product_description: what the product does

Output as JSON with this exact structure:
{
  "company_name": "...",
  "founders": [{"name": "...", "role": "...", "background": "..."}],
  "sector": "...",
  "stage": "...",
  "geography": "...",
  "website": "...",
  "problem_statement": "...",
  "product_description": "...",
  "claims": [
    {
      "claim_type": "...",
      "statement": "...",
      "extracted_value": "...",
      "source": "..."
    }
  ]
}

Be exhaustive. Extract every single factual assertion. If something is implied but not stated, note it as implied.
If you cannot determine a field, use null.
Output ONLY valid JSON, no markdown fences."""

def extract_claims(raw_text: str) -> dict:
    """
    Takes raw PDF text and returns structured extraction via GPT-4o.
    """
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": EXTRACTION_PROMPT},
            {"role": "user", "content": f"Here is the pitch deck text:\n\n{raw_text[:12000]}"}
        ],
        temperature=0.1,
        max_tokens=4000,
        response_format={"type": "json_object"}
    )
    
    result_text = response.choices[0].message.content
    try:
        return json.loads(result_text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse extraction", "raw": result_text}
