import os
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import PromptTemplate
from langgraph.graph import StateGraph, START, END

load_dotenv()

# ==========================================
# 1. State Definition
# ==========================================
class AgentState(dict):
    """
    State keys:
    - raw_text: str (from PDF)
    - company_name: str
    - founders: list[dict]
    - extracted_claims: list[dict]
    - web_research: dict
    - validated_claims: list[dict]
    - final_memo: dict
    """
    pass

# ==========================================
# 2. Pydantic Models for Extraction
# ==========================================
class Claim(BaseModel):
    claim_type: str = Field(description="e.g., 'revenue', 'users', 'market_size', 'team_background'")
    statement: str = Field(description="The exact claim made in the text")
    extracted_value: str = Field(description="The numeric or core value extracted")

class ExtractionResult(BaseModel):
    company_name: str = Field(description="Name of the startup")
    founders: List[str] = Field(description="List of founder names")
    claims: List[Claim] = Field(description="List of extracted claims from the deck")
    sector: str = Field(description="Industry sector")
    geography: str = Field(description="Primary location")

class ValidationResult(BaseModel):
    claim_statement: str
    trust_score: int = Field(description="0-100 score of how trustworthy this claim is based on web evidence")
    contradiction_flag: bool = Field(description="True if web evidence contradicts the claim")
    reasoning: str = Field(description="Reasoning for the score and flag")

class ValidationList(BaseModel):
    validations: List[ValidationResult]

# ==========================================
# 3. Nodes
# ==========================================
def extract_node(state: dict) -> dict:
    """Extracts structured claims from the raw PDF text."""
    raw_text = state.get("raw_text", "")
    
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    llm_with_tools = llm.with_structured_output(ExtractionResult)
    
    prompt = f"""
    You are a VC analyst. Extract the company name, founders, and key claims from this pitch deck text.
    Extract claims related to: revenue, user count, growth, market size, and team pedigree.
    
    Pitch Deck Text:
    {raw_text[:8000]} # Limit to 8k chars for cost/speed
    """
    
    try:
        result = llm_with_tools.invoke(prompt)
        return {
            "company_name": result.company_name,
            "founders": [{"name": f} for f in result.founders],
            "extracted_claims": [c.model_dump() for c in result.claims],
            "startup_info": {"sector": result.sector, "geography": result.geography}
        }
    except Exception as e:
        print(f"Extraction error: {e}")
        return {"extracted_claims": []}


def web_research_node(state: dict) -> dict:
    """Uses Tavily to search for the founders and company."""
    founders = state.get("founders", [])
    company_name = state.get("company_name", "Unknown Startup")
    
    search_tool = TavilySearchResults(max_results=3)
    research_data = {}
    
    for founder in founders:
        name = founder.get("name")
        if name:
            # Search for founder background
            query = f"{name} {company_name} founder linkedin OR hackathon OR github"
            try:
                results = search_tool.invoke({"query": query})
                research_data[name] = results
            except Exception as e:
                print(f"Search error for {name}: {e}")
                
    # Search for company news
    try:
        company_results = search_tool.invoke({"query": f"{company_name} startup news launch funding"})
        research_data["company"] = company_results
    except Exception as e:
        pass
        
    return {"web_research": research_data}


def validate_node(state: dict) -> dict:
    """Cross-references deck claims with web research."""
    claims = state.get("extracted_claims", [])
    web_research = state.get("web_research", {})
    
    if not claims:
        return {"validated_claims": []}
        
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    llm_with_tools = llm.with_structured_output(ValidationList)
    
    prompt = f"""
    You are a VC diligence agent. Validate the following pitch deck claims against the web research.
    If the web research contradicts the claim (e.g., they claim $1M ARR but just launched yesterday), flag it.
    If the web research supports it, give a high trust score (80-100).
    If there is no web evidence either way, give a moderate trust score (40-60).
    
    Claims:
    {json.dumps(claims, indent=2)}
    
    Web Research:
    {json.dumps(web_research, indent=2)}
    """
    
    try:
        result = llm_with_tools.invoke(prompt)
        validated = []
        for claim, val in zip(claims, result.validations):
            validated.append({
                "id": f"claim_{hash(claim['statement']) % 10000}",
                "claim_type": claim.get("claim_type", "unknown"),
                "statement": claim.get("statement", ""),
                "extracted_value": claim.get("extracted_value", ""),
                "source": "Pitch Deck",
                "trust_score": {
                    "score": val.trust_score,
                    "contradiction_flag": val.contradiction_flag,
                    "reasoning": val.reasoning
                }
            })
        return {"validated_claims": validated}
    except Exception as e:
        print(f"Validation error: {e}")
        return {"validated_claims": claims} # Fallback


# ==========================================
# 4. Build Graph
# ==========================================
def build_pipeline():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("extract", extract_node)
    workflow.add_node("research", web_research_node)
    workflow.add_node("validate", validate_node)
    
    workflow.add_edge(START, "extract")
    workflow.add_edge("extract", "research")
    workflow.add_edge("research", "validate")
    workflow.add_edge("validate", END)
    
    return workflow.compile()

app_pipeline = build_pipeline()

def run_application_pipeline(raw_text: str):
    """Entry point for the FastAPI route."""
    initial_state = {"raw_text": raw_text}
    result = app_pipeline.invoke(initial_state)
    return result
