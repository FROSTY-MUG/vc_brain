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
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import List

load_dotenv()

class MemoRecommendation(BaseModel):
    action: str = Field(description="'deploy' | 'diligence' | 'watch' | 'pass'")
    confidence: str = Field(description="'HIGH' | 'MEDIUM' | 'LOW'")
    reasoning: str = Field(description="string explaining the decision")
    open_questions: List[str] = Field(description="array of outstanding questions for next meeting")

class MemoSWOT(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]

class InvestmentMemo(BaseModel):
    company_snapshot: str = Field(description="One paragraph 'in a nutshell', include market sizing signal if available")
    investment_hypotheses: List[str] = Field(description="Array of 'why we want to invest' bullets with citations")
    swot: MemoSWOT = Field(description="Strengths, weaknesses, opportunities, threats. Evidence-backed bullets.")
    team_and_history: str = Field(description="Founder background, exec team pedigree, timeline")
    problem_and_product: str = Field(description="Core problem in plain language, step-by-step product solving it")
    technology_and_defensibility: str = Field(description="What's proprietary, data moat, architecture choices")
    market_sizing: str = Field(description="Top-down AND/OR bottom-up TAM/SAM/SOM. Flag missing data as 'not provided'.")
    competition: str = Field(description="Named competitor clusters and differentiation.")
    traction_and_kpis: str = Field(description="Customer count, ARR, growth. Explicitly flag missing KPIs.")
    financials_and_round: str = Field(description="P&L, round size. If missing, explicitly write 'Financials: not disclosed - standard for this stage' or similar.")
    cap_table: str = Field(description="Ownership details. Usually missing, explicitly write 'Cap table: not disclosed.'")
    due_diligence_log: str = Field(description="What was checked, what's open/pending.")
    exit_perspective: str = Field(description="Plausible exit paths.")
    recommendation: MemoRecommendation = Field(description="Decision output")

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
If ANY information is missing, unavailable, or intentionally withheld (particularly Financials & round structure, Cap table, Customer references, Due diligence interviews), it MUST be explicitly flagged — never silently omitted or guessed.
Use phrases like:
  "Cap table: not disclosed"
  "Customer references: unavailable at this stage"
  "Historical P&L: not provided — requested"
  "Round size: not confirmed"
A memo that clearly marks its own gaps is MORE trustworthy than one that fills them invisibly.

Output exactly according to the schema provided.
"""


def generate_memo(extraction: dict, research: dict, validation: dict, screening: dict) -> dict:
    """
    Generates a full 14-section investment memo with citations and gap-flagging.
    Called by both the pipeline (auto) and the on-demand route.
    """
    try:
        llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
        llm_with_tools = llm.with_structured_output(InvestmentMemo)
        
        prompt = f"{MEMO_PROMPT}\n\nPITCH DECK EXTRACTION:\n{json.dumps(extraction, indent=2)[:6000]}\n\nWEB RESEARCH:\n{json.dumps(research, indent=2)[:12000]}\n\nVALIDATION:\n{json.dumps(validation, indent=2)[:4000]}\n\nSCREENING:\n{json.dumps(screening, indent=2)[:3000]}"
        
        res = llm_with_tools.invoke(prompt)
        memo = res.model_dump()
        return memo

    except json.JSONDecodeError as e:
        return {
            "error": f"Failed to parse memo JSON: {e}",
            "raw": result_text if 'result_text' in locals() else "",
            "recommendation": {"action": "diligence", "confidence": "LOW", "reasoning": "Memo generation failed — manual review required.", "open_questions": []}
        }
    except Exception as e:
        return {
            "error": f"Memo generation failed: {str(e)}",
            "recommendation": {"action": "diligence", "confidence": "LOW", "reasoning": "Memo generation failed — manual review required.", "open_questions": []}
        }
