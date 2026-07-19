# =============================================
# VC Brain — Agent 5: Investment Memo Agent
# =============================================
# Generates a full 14-section evidence-backed
# investment memo per Appendix 1 requirements.
# Rules:
#   1. Agentic Traceability: every claim cites
#      its exact source (deck slide, web signal,
#      interview excerpt).
#   2. Gap-Flagging: never fabricate missing data.
#      Confidential sections (cap table, financials)
#      MUST be explicitly marked "not disclosed"
#      or "unavailable at this stage".
# =============================================
import os
import json
from utils.llm import get_llm_client, get_model_name
from dotenv import load_dotenv

load_dotenv()
client = get_llm_client()

MEMO_PROMPT = """You are a top-tier VC Associate at a $100M early-stage fund.
Write a complete, evidence-backed investment memo following Appendix 1 standards.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 1 — AGENTIC TRACEABILITY
Every factual claim in the memo MUST cite its source inline using [Source: ...] notation.
Examples:
  "The team has 3 years of AI experience [Source: LinkedIn — John Doe]"
  "$1M ARR [Source: Deck — Traction Slide]"
  "Market growing at 34% CAGR [Source: Web — Gartner 2024]"
  "2 GitHub repos with 500+ stars [Source: GitHub API — alexrivera]"

RULE 2 — GAP-FLAGGING (CRITICAL)
If ANY information is missing, unavailable, or intentionally withheld (particularly
Financials & round structure, Cap table, Customer references, Due diligence interviews),
it MUST be explicitly flagged — never silently omitted or guessed.
Use phrases like:
  "Cap table: not disclosed"
  "Customer references: unavailable at this stage"
  "Historical P&L: not provided — requested"
  "Round size: not confirmed"
A memo that clearly marks its own gaps is MORE trustworthy than one that fills them invisibly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED SECTIONS (output as JSON):

1. company_snapshot — One paragraph "in a nutshell": market size, structural problem,
   why it's urgent, how the product solves it. Must include market sizing signal if available.

2. investment_hypotheses — Array of "why we want to invest" bullets. Must cover:
   team quality, market wedge, stickiness/retention mechanics, traction signal,
   defensibility, expansion path. Each bullet must cite evidence.

3. swot — Object with: strengths[], weaknesses[], opportunities[], threats[].
   Instead of simple strings, each array must contain objects with:
   - statement: short, evidence-backed bullet string. Never generic.
   - factors: array of strings explaining the key due diligence factors that led to this (e.g., "Founder background", "Market growth")
   - conflicts: array of strings explicitly detailing if any due diligence factors conflict regarding this point. Empty array if none.

4. team_and_history — Founder background, exec team pedigree, company timeline
   from founding to today. Address any red flags (e.g. single-founder) explicitly.

5. problem_and_product — Core problem(s) in plain language, then step-by-step
   product/process solving it.

6. technology_and_defensibility — What's proprietary vs. commoditizable,
   the data moat, model/architecture choices, why the advantage compounds over time.

7. market_sizing — Top-down AND/OR bottom-up TAM/SAM/SOM with assumptions stated explicitly.
   If unavailable: "Market sizing: not provided by founders — external estimates used."

8. competition — Named competitor clusters, how each differs from the company,
   who could become a threat later. Never "no competition exists."

9. traction_and_kpis — Customer count, ARR/revenue, growth trajectory,
   unit economics (CAC, sales cycle, churn), usage metrics (DAU, etc.).
   Flag missing KPIs explicitly.

10. financials_and_round — Historical + projected P&L (revenue, EBITDA, opex, COGS),
    round size, runway, next-round timing.
    These are almost always confidential — if not provided:
    "Financials: not disclosed — standard for this stage" or "Round size: not confirmed."

11. cap_table — Pre- and post-round ownership by party, dilution assumptions, VSOP/ESOP.
    Almost always confidential: "Cap table: not disclosed."

12. due_diligence_log — What was checked (commercial, people, financial, technical),
    what's open/pending. List each item as checked/open/pending.

13. exit_perspective — Plausible exit paths (strategic acquirers, IPO thesis, comparable exits).
    Include comparable multiples if available.

14. recommendation — Object with:
    - action: "deploy" | "diligence" | "watch" | "pass"
    - confidence: "HIGH" | "MEDIUM" | "LOW"
    - reasoning: string explaining the decision
    - open_questions: array of outstanding questions for next meeting

Output strictly as a JSON object with these 14 keys. No markdown fences.
All string fields may include inline [Source: ...] citations.
All missing data points must be flagged — never omit silently.
"""


def generate_memo(extraction: dict, research: dict, validation: dict, screening: dict) -> dict:
    """
    Generates a full 14-section investment memo with citations and gap-flagging.
    Called by both the pipeline (auto) and the on-demand route.
    """
    try:
        response = client.chat.completions.create(
            model=get_model_name("gpt-4o"),
            messages=[
                {"role": "system", "content": MEMO_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"PITCH DECK EXTRACTION:\n{json.dumps(extraction, indent=2)[:6000]}\n\n"
                        f"WEB RESEARCH (GitHub, LinkedIn, News, ProductHunt):\n{json.dumps(research, indent=2)[:12000]}\n\n"
                        f"VALIDATION (Trust Scores per claim):\n{json.dumps(validation, indent=2)[:4000]}\n\n"
                        f"SCREENING (3-Axis Scores: Founder / Market / Idea):\n{json.dumps(screening, indent=2)[:3000]}"
                    )
                }
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )

        result_text = response.choices[0].message.content
        memo = json.loads(result_text)

        # Ensure recommendation is a proper dict
        rec = memo.get("recommendation", {})
        if isinstance(rec, str):
            memo["recommendation"] = {"action": rec, "confidence": "LOW", "reasoning": rec, "open_questions": []}

        return memo

    except json.JSONDecodeError as e:
        error_swot = {
            "strengths": [{"statement": "Memo generation failed", "factors": [], "conflicts": []}],
            "weaknesses": [{"statement": "Memo generation failed", "factors": [], "conflicts": []}],
            "opportunities": [{"statement": "Memo generation failed", "factors": [], "conflicts": []}],
            "threats": [{"statement": "Memo generation failed", "factors": [], "conflicts": []}]
        }
        return {
            "error": f"Failed to parse memo JSON: {e}",
            "raw": result_text if 'result_text' in locals() else "",
            "swot": error_swot,
            "recommendation": {"action": "diligence", "confidence": "LOW", "reasoning": "Memo generation failed — manual review required.", "open_questions": []}
        }
    except Exception as e:
        error_swot = {
            "strengths": [{"statement": f"Error: {str(e)}", "factors": [], "conflicts": []}],
            "weaknesses": [{"statement": f"Error: {str(e)}", "factors": [], "conflicts": []}],
            "opportunities": [{"statement": f"Error: {str(e)}", "factors": [], "conflicts": []}],
            "threats": [{"statement": f"Error: {str(e)}", "factors": [], "conflicts": []}]
        }
        return {
            "error": f"Memo generation failed: {str(e)}",
            "swot": error_swot,
            "recommendation": {"action": "diligence", "confidence": "LOW", "reasoning": "Memo generation failed — manual review required.", "open_questions": []}
        }
