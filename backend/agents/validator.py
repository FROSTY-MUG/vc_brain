# =============================================
# VC Brain — Agent 3: Validation (Trust Score) Agent
# =============================================
# Cross-references extracted claims against web research
# to generate a per-claim Trust Score.
# =============================================
import os
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import List

load_dotenv()

class ValidationResult(BaseModel):
    score: int = Field(description="The overall trust score (0-100)")
    extraction_confidence: float = Field(description="How clear was the claim in the deck? (0.0 - 1.0)")
    source_reliability: float = Field(description="Is the corroborating source trustworthy? (e.g. GitHub=0.9, Random blog=0.3) (0.0 - 1.0)")
    corroboration_count: int = Field(description="How many independent sources confirm this?")
    freshness_days: int = Field(description="Approximate age of the evidence in days (use 0 if unknown)")
    contradiction_flag: bool = Field(description="True if the web research actively contradicts the claim")
    reasoning: str = Field(description="Plain English explanation of why it received this score and any contradictions found. Explicitly note Truth-gaps.")

class ValidationList(BaseModel):
    validations: List[ValidationResult]

VALIDATOR_PROMPT = """You are a VC diligence AI performing a strict Truth-Gap Check. Your job is to calculate a 'Trust Score' for claims made in a pitch deck by comparing them to independent web research.

You will be given:
1. A list of claims extracted from a pitch deck.
2. Web research data gathered from GitHub, LinkedIn, News, ProductHunt, etc.

For EACH claim, output a validation result exactly matching the structured schema.
If there is a gap or contradiction between the claim and the research, set `contradiction_flag` to true and explicitly state the Truth-gap in the reasoning.
"""

def validate_claims(claims: list, research_data: dict) -> dict:
    """
    Validates a list of claims against web research data using structured outputs.
    Returns a dictionary mapped by claim statement.
    """
    if not claims:
        return {}
        
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    llm_with_tools = llm.with_structured_output(ValidationList)
    prompt = f"{VALIDATOR_PROMPT}\n\nClaims:\n{json.dumps(claims, indent=2)}\n\nResearch Data:\n{json.dumps(research_data, indent=2)[:30000]}"
    
    try:
        result = llm_with_tools.invoke(prompt)
        output = {}
        for claim, val in zip(claims, result.validations):
            output[claim.get("statement", str(claim))] = val.model_dump()
        return output
    except Exception as e:
        return {"error": f"Failed to parse validation data: {e}", "raw": str(e)}
