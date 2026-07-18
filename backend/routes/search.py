# =============================================
# VC Brain — Search Routes (NL Reasoning)
# =============================================
from fastapi import APIRouter
from models import SearchQuery

router = APIRouter()

@router.post("/")
async def search_founders(query: SearchQuery):
    """
    Multi-attribute natural language search.
    
    Supports queries like:
    "technical founder, Berlin, AI infra, enterprise traction, no prior VC backing"
    
    In production: decomposes query → metadata filters + semantic search via pgvector.
    For hackathon: returns structured decomposition + demo results.
    """
    # Query decomposition (in production: LLM does this)
    decomposed = {
        "raw_query": query.query,
        "extracted_filters": {
            "location": None,
            "sector": None,
            "stage": None,
            "founder_type": None,
        },
        "semantic_component": query.query,
    }
    
    # Simple keyword extraction for demo
    q_lower = query.query.lower()
    if "berlin" in q_lower: decomposed["extracted_filters"]["location"] = "Berlin"
    if "sf" in q_lower or "san francisco" in q_lower: decomposed["extracted_filters"]["location"] = "San Francisco"
    if "ai" in q_lower: decomposed["extracted_filters"]["sector"] = "AI"
    if "fintech" in q_lower: decomposed["extracted_filters"]["sector"] = "Fintech"
    if "seed" in q_lower: decomposed["extracted_filters"]["stage"] = "seed"
    if "technical" in q_lower: decomposed["extracted_filters"]["founder_type"] = "technical"
    
    return {
        "query": query.query,
        "decomposition": decomposed,
        "results": [],
        "total": 0,
        "message": "Search endpoint ready. Connect pgvector for semantic results.",
    }
