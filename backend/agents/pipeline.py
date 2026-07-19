import os
import json
import asyncio
from typing import List, Dict, Any, Optional, TypedDict
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END

from agents.sourcer import research_founders_and_company
from agents.founder_scorer import score_founders
from agents.screener import run_screener
from services.memo import generate_memo
import db

load_dotenv()

# ==========================================
# 1. State Definition
# ==========================================
class AgentState(TypedDict):
    app_id: str
    raw_text: str
    company_name: Optional[str]
    founders: Optional[List[dict]]
    extracted_claims: Optional[List[dict]]
    web_research: Optional[dict]
    validated_claims: Optional[List[dict]]
    startup_info: Optional[dict]
    founder_scores: Optional[List[dict]]
    opportunity_scores: Optional[dict]
    final_memo: Optional[dict]

# ==========================================
# 2. Pydantic Models for Extraction
# ==========================================
class Claim(BaseModel):
    claim_type: str = Field(description="e.g., 'revenue', 'users', 'market_size', 'team_background'")
    statement: str = Field(description="The exact claim made in the text")
    extracted_value: str = Field(description="The numeric or core value extracted")
    source: str = Field(description="Which slide or section it came from")

class ExtractionResult(BaseModel):
    company_name: str = Field(description="Name of the startup")
    founders: List[str] = Field(description="List of founder names")
    claims: List[Claim] = Field(description="List of extracted claims from the deck")
    sector: str = Field(description="Industry sector")
    geography: str = Field(description="Primary location")
    stage: str = Field(description="Funding stage")

class ValidationResult(BaseModel):
    trust_score: int = Field(description="0-100 score of how trustworthy this claim is based on web evidence")
    contradiction_flag: bool = Field(description="True if web evidence contradicts the claim")
    reasoning: str = Field(description="Reasoning for the score and flag")

class ValidationList(BaseModel):
    validations: List[ValidationResult]

# ==========================================
# 3. Nodes
# ==========================================
def extract_node(state: AgentState) -> AgentState:
    raw_text = state.get("raw_text", "")
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    llm_with_tools = llm.with_structured_output(ExtractionResult)
    
    prompt = f"Extract the company name, founders, and key claims from this pitch deck text.\n\nText:\n{raw_text[:8000]}"
    try:
        result = llm_with_tools.invoke(prompt)
        state["company_name"] = result.company_name
        state["founders"] = [{"name": f} for f in result.founders]
        state["extracted_claims"] = [c.model_dump() for c in result.claims]
        state["startup_info"] = {"sector": result.sector, "geography": result.geography, "stage": result.stage}
    except Exception as e:
        print(f"Extraction error: {e}")
        state["extracted_claims"] = []
    return state

def web_research_node(state: AgentState) -> AgentState:
    founders = state.get("founders", []) or []
    company_name = state.get("company_name", "Unknown Startup")
    research_data = research_founders_and_company(founders, company_name)
    founder_scores = score_founders(founders, research_data)
    state["web_research"] = research_data
    state["founder_scores"] = founder_scores
    return state

def validate_node(state: AgentState) -> AgentState:
    claims = state.get("extracted_claims", []) or []
    web_research = state.get("web_research", {}) or {}
    if not claims: 
        state["validated_claims"] = []
        return state
        
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    llm_with_tools = llm.with_structured_output(ValidationList)
    prompt = f"Validate claims against web research.\n\nClaims:\n{json.dumps(claims, indent=2)}\n\nResearch:\n{json.dumps(web_research, indent=2)[:4000]}"
    
    try:
        result = llm_with_tools.invoke(prompt)
        validated = []
        for claim, val in zip(claims, result.validations):
            c = claim.copy()
            c["trust_score"] = val.model_dump()
            validated.append(c)
        state["validated_claims"] = validated
    except Exception as e:
        print(f"Validation error: {e}")
        state["validated_claims"] = claims
    return state

def screen_node(state: AgentState) -> AgentState:
    claims = state.get("validated_claims", []) or []
    web_research = state.get("web_research", {}) or {}
    founder_scores = state.get("founder_scores", []) or []
    startup_info = state.get("startup_info", {}) or {}
    scores = run_screener(claims, web_research, founder_scores, startup_info)
    state["opportunity_scores"] = scores
    return state

def memo_node(state: AgentState) -> AgentState:
    memo = generate_memo(
        startup={"name": state.get("company_name"), **(state.get("startup_info", {}) or {})},
        founders=state.get("founders", []) or [],
        founder_scores=state.get("founder_scores", []) or [],
        claims=state.get("validated_claims", []) or [],
        opportunity_scores=state.get("opportunity_scores", {}) or {}
    )
    # Update recommendation from memo
    opp = state.get("opportunity_scores", {}) or {}
    opp["recommendation"] = memo.get("recommendation", {}).get("action", "diligence")
    state["final_memo"] = memo
    state["opportunity_scores"] = opp
    return state

def db_write_node(state: AgentState) -> AgentState:
    app_id = state.get("app_id")
    if not app_id: return state
    
    try:
        for claim in state.get("validated_claims", []) or []:
            c_res = db.insert_claim(app_id, claim.get("claim_type",""), claim.get("statement",""), claim.get("source",""))
            if c_res and "id" in c_res:
                ts = claim.get("trust_score", {}) or {}
                db.insert_trust_score(c_res["id"], ts.get("trust_score", 50), ts.get("reasoning", ""))
                
        opp_scores = state.get("opportunity_scores", {}) or {}
        db.insert_opportunity_scores(app_id, {
            "founder_score": opp_scores.get("founder", {}).get("score", 50),
            "founder_confidence": opp_scores.get("founder", {}).get("confidence", 0.5),
            "founder_trend": opp_scores.get("founder", {}).get("trend", "stable"),
            "founder_signals": opp_scores.get("founder", {}).get("signals", []),
            "market_score": opp_scores.get("market", {}).get("score", 50),
            "market_confidence": opp_scores.get("market", {}).get("confidence", 0.5),
            "market_trend": opp_scores.get("market", {}).get("trend", "stable"),
            "market_signals": opp_scores.get("market", {}).get("signals", []),
            "idea_score": opp_scores.get("idea_vs_market", {}).get("score", 50),
            "idea_confidence": opp_scores.get("idea_vs_market", {}).get("confidence", 0.5),
            "idea_trend": opp_scores.get("idea_vs_market", {}).get("trend", "stable"),
            "idea_signals": opp_scores.get("idea_vs_market", {}).get("signals", []),
            "thesis_alignment": opp_scores.get("thesis_alignment", 50),
            "recommendation": opp_scores.get("recommendation", "diligence")
        })
        
        memo_data = state.get("final_memo", {}) or {}
        rec = memo_data.get("recommendation", {}).get("action", "diligence")
        db.insert_memo(app_id, memo_data, rec)
        
        # Update App status and store web_research
        sb = db.get_supabase()
        sb.table("applications").update({
            "status": "diligence",
            "source_detail": json.dumps(state.get("web_research", {}) or {})
        }).eq("id", app_id).execute()
        
    except Exception as e:
        print(f"DB Write error: {e}")
        
    return state

# ==========================================
# 4. Build Graph
# ==========================================
def build_pipeline():
    workflow = StateGraph(AgentState)
    workflow.add_node("extract", extract_node)
    workflow.add_node("research", web_research_node)
    workflow.add_node("validate", validate_node)
    workflow.add_node("screen", screen_node)
    workflow.add_node("memo", memo_node)
    workflow.add_node("db_write", db_write_node)
    
    workflow.add_edge(START, "extract")
    workflow.add_edge("extract", "research")
    workflow.add_edge("research", "validate")
    workflow.add_edge("validate", "screen")
    workflow.add_edge("screen", "memo")
    workflow.add_edge("memo", "db_write")
    workflow.add_edge("db_write", END)
    
    return workflow.compile()

app_pipeline = build_pipeline()

def run_application_pipeline(raw_text: str, app_id: str):
    initial_state = {
        "app_id": app_id, 
        "raw_text": raw_text,
        "company_name": None,
        "founders": None,
        "extracted_claims": None,
        "web_research": None,
        "validated_claims": None,
        "startup_info": None,
        "founder_scores": None,
        "opportunity_scores": None,
        "final_memo": None
    }
    return app_pipeline.invoke(initial_state)
