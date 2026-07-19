# =============================================
# VC Brain — Agent 5: Investment Memo Agent
# =============================================
# Generates an evidence-backed investment memo
# based on extraction, research, and screening.
# =============================================
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MEMO_PROMPT = """You are a top-tier VC Associate. Write a final investment memo.

You have access to:
1. Pitch deck extraction data
2. Web research data (GitHub, LinkedIn, News)
3. Validation results (Trust Scores for claims)
4. 3-Axis Screening Scores

Requirement 1 (Agentic Traceability): EVERY factual claim in the memo MUST cite its source inline. 
Example: "The team has 3 years of AI experience [Source: LinkedIn - John Doe] and $1M ARR [Source: Deck - Traction Slide]."

Requirement 2: Do NOT fabricate data. If any information is missing, unavailable, or intentionally left out (particularly Financials & round structure, Cap table, or Customer references), it MUST be explicitly flagged in the memo (e.g., "Cap table: not disclosed" or "Customer references: unavailable at this stage") rather than silently omitted or guessed. A memo that clearly marks its own gaps is more trustworthy.

Sections required in JSON:
- "company_snapshot": One paragraph "in a nutshell".
- "investment_hypotheses": "Why we want to invest" bullets.
- "swot": Strengths, weaknesses, opportunities, risks.
- "team_history": Founder backgrounds and pedigree.
- "problem_product": The core problem and solution.
- "tech_defensibility": Data moat, architecture.
- "market_sizing": TAM/SAM/SOM.
- "competition": Named competitors.
- "traction_kpis": Revenue, usage, metrics.
- "financials_round": P&L, round size, next round.
- "cap_table": Pre/post ownership, ESOP.
- "due_diligence_log": What was checked, what's open.
- "exit_perspective": Plausible exit paths.
- "recommendation": "deploy", "diligence", or "pass".

Output strictly as a JSON object with these keys mapping to strings (or arrays of strings where appropriate). No markdown fences.
"""

def generate_memo(extraction: dict, research: dict, validation: dict, screening: dict) -> dict:
    """
    Generates a full investment memo.
    """
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": MEMO_PROMPT},
            {"role": "user", "content": f"Extraction:\n{json.dumps(extraction)}\n\nResearch:\n{json.dumps(research)[:15000]}\n\nValidation:\n{json.dumps(validation)}\n\nScreening:\n{json.dumps(screening)}"}
        ],
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    
    result_text = response.choices[0].message.content
    try:
        return json.loads(result_text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse memo data", "raw": result_text}
