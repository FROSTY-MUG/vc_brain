# =============================================
# VC Brain — Multi-Agent LangGraph Pipeline
# =============================================
# Orchestrates 6 AI agents in sequence:
#   1. Extractor     — claims from PDF text
#   2. Sourcer       — web research (GitHub, Tavily, etc.)
#   3. Validator     — per-claim trust scoring
#   4. FounderScorer — persistent founder score
#   5. Screener      — 3-axis opportunity scoring
#   6. MemoWriter    — full 14-section investment memo
# Each node writes results to DB as it completes.
# =============================================
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
import asyncio
import json
import db

# ── Lazy imports to avoid circular deps at graph compile time ──
def _extractor():
    from agents.extractor import extract_claims
    return extract_claims

def _sourcer():
    from agents.sourcer import research_founders_and_company
    return research_founders_and_company

def _validator():
    from agents.validator import validate_claims
    return validate_claims

def _founder_scorer():
    from agents.founder_scorer import score_founders
    return score_founders

def _screener():
    from agents.screener import run_screener
    return run_screener

def _memo_writer():
    from agents.memo_writer import generate_memo
    return generate_memo


# ── Shared workflow state ──
class WorkflowState(TypedDict):
    application_id: str
    raw_text: str
    founder_links: Dict[str, Any]       # supplied URLs from the upload form
    # Per-node outputs
    extraction: Dict[str, Any]
    research: Dict[str, Any]
    validation: Dict[str, Any]
    founder_scores: List[Dict[str, Any]]
    screening: Dict[str, Any]
    final_memo: Dict[str, Any]


# ─────────────────────────────────────────
# Node 1 — Extractor
# Reads raw PDF text → structured claims
# ─────────────────────────────────────────
def extractor_node(state: WorkflowState) -> Dict[str, Any]:
    app_id = state["application_id"]
    print(f"[{app_id}] [1/6] Extractor running…")
    try:
        extraction = _extractor()(state["raw_text"])
    except Exception as e:
        print(f"[{app_id}] Extractor failed: {e}")
        extraction = {"company_name": "Unknown", "founders": [], "claims": [], "error": str(e)}

    # Persist each extracted claim to DB
    for claim in extraction.get("claims", []):
        try:
            db.insert_claim(
                application_id=app_id,
                claim_type=claim.get("claim_type", "general"),
                statement=claim.get("statement", ""),
                source=claim.get("source", "Deck"),
            )
        except Exception:
            pass

    print(f"[{app_id}] [1/6] Extractor done — {len(extraction.get('claims', []))} claims extracted")
    return {"extraction": extraction}


# ─────────────────────────────────────────
# Node 2 — Sourcer
# Real web research for company + founders
# ─────────────────────────────────────────
def sourcer_node(state: WorkflowState) -> Dict[str, Any]:
    app_id = state["application_id"]
    extraction = state.get("extraction", {})
    print(f"[{app_id}] [2/6] Sourcer running…")

    company_name = extraction.get("company_name", "Unknown")

    # Merge founder info from extraction with supplied links from the upload form
    founders_from_deck = extraction.get("founders", [])
    founder_links = state.get("founder_links", {}) or {}

    # Annotate the first founder with the URLs provided at upload time (if any)
    if founders_from_deck and isinstance(founders_from_deck[0], dict):
        founders_from_deck[0].setdefault("github_url", founder_links.get("github_url", ""))
        founders_from_deck[0].setdefault("linkedin_url", founder_links.get("linkedin_url", ""))
    elif founder_links.get("name"):
        founders_from_deck = [{
            "name": founder_links.get("name", ""),
            "github_url": founder_links.get("github_url", ""),
            "linkedin_url": founder_links.get("linkedin_url", ""),
        }]

    try:
        research = _sourcer()(founders_from_deck, company_name)
    except Exception as e:
        print(f"[{app_id}] Sourcer failed: {e}")
        research = {"company_research": {}, "founders_research": [], "error": str(e)}

    # Persist research summary as source_detail on the application
    try:
        db.update_application_status(app_id, "research_complete")
    except Exception:
        pass

    print(f"[{app_id}] [2/6] Sourcer done")
    return {"research": research}


# ─────────────────────────────────────────
# Node 3 — Validator
# Per-claim trust scoring vs web research
# ─────────────────────────────────────────
def validator_node(state: WorkflowState) -> Dict[str, Any]:
    app_id = state["application_id"]
    print(f"[{app_id}] [3/6] Validator running…")

    claims = state.get("extraction", {}).get("claims", [])
    research = state.get("research", {})

    try:
        validation = _validator()(claims, research)
    except Exception as e:
        print(f"[{app_id}] Validator failed: {e}")
        validation = {"error": str(e)}

    # Persist trust scores
    claims_in_db = db.get_claims_for_app(app_id)
    for claim_row in (claims_in_db or []):
        statement = claim_row.get("statement", "")
        val_result = validation.get(statement)
        if val_result and isinstance(val_result, dict):
            try:
                db.insert_trust_score(
                    claim_id=claim_row["id"],
                    score=val_result.get("score", 0),
                    reasoning=val_result.get("reasoning", ""),
                )
            except Exception:
                pass

    print(f"[{app_id}] [3/6] Validator done")
    return {"validation": validation}


# ─────────────────────────────────────────
# Node 4 — Founder Scorer
# Persistent person-level scoring
# ─────────────────────────────────────────
def founder_scorer_node(state: WorkflowState) -> Dict[str, Any]:
    app_id = state["application_id"]
    print(f"[{app_id}] [4/6] FounderScorer running…")

    founders = state.get("extraction", {}).get("founders", [])
    research = state.get("research", {})

    try:
        founder_scores = _founder_scorer()(founders, research)
    except Exception as e:
        print(f"[{app_id}] FounderScorer failed: {e}")
        founder_scores = []

    print(f"[{app_id}] [4/6] FounderScorer done — {len(founder_scores)} founders scored")
    return {"founder_scores": founder_scores}


# ─────────────────────────────────────────
# Node 5 — Screener
# 3-axis opportunity scoring
# ─────────────────────────────────────────
def screener_node(state: WorkflowState) -> Dict[str, Any]:
    app_id = state["application_id"]
    print(f"[{app_id}] [5/6] Screener running…")

    claims = state.get("extraction", {}).get("claims", [])
    research = state.get("research", {})
    founder_scores = state.get("founder_scores", [])
    startup_info = {
        "company_name": state.get("extraction", {}).get("company_name", ""),
        "sector": state.get("extraction", {}).get("sector", ""),
        "stage": state.get("extraction", {}).get("stage", ""),
    }

    try:
        screening = _screener()(claims, research, founder_scores, startup_info)
    except Exception as e:
        print(f"[{app_id}] Screener failed: {e}")
        screening = {
            "founder": {"score": 50, "trend": "stable", "confidence": 0.3, "signals": ["screening_failed"]},
            "market": {"score": 50, "trend": "stable", "confidence": 0.3, "signals": ["screening_failed"]},
            "idea_vs_market": {"score": 50, "trend": "stable", "confidence": 0.3, "signals": ["screening_failed"]},
            "recommendation": "diligence",
        }

    # Persist opportunity scores to DB
    try:
        founder_axis = screening.get("founder", {})
        market_axis = screening.get("market", {})
        idea_axis = screening.get("idea_vs_market", screening.get("idea", {}))
        db.insert_opportunity_scores(app_id, {
            "founder_score": founder_axis.get("score", 0),
            "market_score": market_axis.get("score", 0),
            "idea_score": idea_axis.get("score", 0),
            "recommendation": screening.get("recommendation", "diligence"),
            "thesis_alignment": idea_axis.get("score", 0),
            "founder_trend": founder_axis.get("trend", "stable"),
        })
    except Exception as e:
        print(f"[{app_id}] Failed to persist opportunity scores: {e}")

    print(f"[{app_id}] [5/6] Screener done — recommendation: {screening.get('recommendation')}")
    return {"screening": screening}


# ─────────────────────────────────────────
# Node 6 — Memo Writer
# Full 14-section investment memo
# ─────────────────────────────────────────
def memo_writer_node(state: WorkflowState) -> Dict[str, Any]:
    app_id = state["application_id"]
    print(f"[{app_id}] [6/6] MemoWriter running…")

    extraction = state.get("extraction", {})
    research = state.get("research", {})
    validation = state.get("validation", {})
    screening = state.get("screening", {})
    startup_info = db.get_application(app_id) or {}

    try:
        memo = _memo_writer()(
            extraction={"company_name": extraction.get("company_name"), "startup_info": startup_info, "claims": extraction.get("claims", [])},
            research=research,
            validation=validation,
            screening=screening,
        )
    except Exception as e:
        print(f"[{app_id}] MemoWriter failed: {e}")
        memo = {
            "error": str(e),
            "recommendation": {"action": "diligence", "confidence": "LOW", "reasoning": "Memo generation failed.", "open_questions": []},
        }

    # Persist memo + mark application complete
    try:
        rec = memo.get("recommendation", {})
        rec_action = rec.get("action", "diligence") if isinstance(rec, dict) else "diligence"
        db.insert_memo(app_id, memo, rec_action)
        db.update_application_status(app_id, "complete")
    except Exception as e:
        print(f"[{app_id}] Failed to persist memo: {e}")

    print(f"[{app_id}] [6/6] MemoWriter done — pipeline complete ✓")
    return {"final_memo": memo}


# ─────────────────────────────────────────
# Build the LangGraph Sequential Graph
# ─────────────────────────────────────────
workflow = StateGraph(WorkflowState)

workflow.add_node("extractor",      extractor_node)
workflow.add_node("sourcer",        sourcer_node)
workflow.add_node("validator",      validator_node)
workflow.add_node("founder_scorer", founder_scorer_node)
workflow.add_node("screener",       screener_node)
workflow.add_node("memo_writer",    memo_writer_node)

workflow.set_entry_point("extractor")
workflow.add_edge("extractor",      "sourcer")
workflow.add_edge("sourcer",        "validator")
workflow.add_edge("validator",      "founder_scorer")
workflow.add_edge("founder_scorer", "screener")
workflow.add_edge("screener",       "memo_writer")
workflow.add_edge("memo_writer",    END)

app_pipeline = workflow.compile()


def run_application_pipeline(raw_text: str, app_id: str, founder_links: Optional[Dict[str, Any]] = None):
    """
    Synchronous wrapper called by FastAPI background tasks.
    Invokes the full 6-agent LangGraph pipeline and persists all results to DB.
    """
    print(f"[{app_id}] Starting 6-agent LangGraph pipeline")
    db.update_application_status(app_id, "processing")

    initial_state: WorkflowState = {
        "application_id": app_id,
        "raw_text": raw_text,
        "founder_links": founder_links or {},
        "extraction": {},
        "research": {},
        "validation": {},
        "founder_scores": [],
        "screening": {},
        "final_memo": {},
    }

    try:
        result = app_pipeline.invoke(initial_state)
        return result
    except Exception as e:
        print(f"[{app_id}] Pipeline top-level failure: {e}")
        db.update_application_status(app_id, "failed")
        raise
