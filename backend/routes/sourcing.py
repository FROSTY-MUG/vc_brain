# =============================================
# VC Brain — Sourcing Routes (Outbound Sourcing & Autocomplete)
# =============================================
import os
from fastapi import APIRouter, HTTPException, Query
from utils.llm import get_llm_client, get_model_name
import db
from services.sourcing_scanners import (
    scan_github,
    scan_arxiv,
    scan_product_hunt,
    scan_devpost,
    autocomplete_crunchbase
)

router = APIRouter()

openai_client = get_llm_client()

@router.get("/outbound/signals")
async def get_outbound_signals():
    """Get discovered outbound signals from GitHub, arXiv, Product Hunt, etc."""
    try:
        signals = db.get_all_outbound_signals()
        return {"signals": signals, "total": len(signals)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/outbound/scan")
async def trigger_outbound_scan(data: dict):
    """Trigger an outbound scan for a specific source and save results to the database."""
    source = data.get("source", "github").lower()
    
    signals_scanned = []
    try:
        if source == "github":
            signals_scanned = scan_github()
        elif source == "arxiv":
            signals_scanned = scan_arxiv()
        elif source == "producthunt":
            signals_scanned = scan_product_hunt()
        elif source == "hackathon" or source == "devpost":
            signals_scanned = scan_devpost()
        elif source == "all":
            signals_scanned.extend(scan_github())
            signals_scanned.extend(scan_arxiv())
            signals_scanned.extend(scan_product_hunt())
            signals_scanned.extend(scan_devpost())
        else:
            raise HTTPException(status_code=400, detail=f"Unknown source: {source}")
        
        # Save scanned signals to database
        saved_signals = []
        for sig in signals_scanned:
            saved = db.insert_outbound_signal(
                source=sig["source"],
                signal_type=sig["signal_type"],
                title=sig["title"],
                description=sig["description"],
                url=sig["url"],
                strength=sig["strength"],
                founder_id=None # Initially unlinked
            )
            # Carry over local founder_name for UI display
            saved["founder_name"] = sig.get("founder_name", "Unknown Founder")
            saved_signals.append(saved)
            
        return {
            "status": "success",
            "source": source,
            "count": len(saved_signals),
            "signals": saved_signals
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Outbound scan failed: {str(e)}")

@router.post("/outbound/import")
async def import_signal_to_pipeline(data: dict):
    """
    Import an outbound signal into the CRM pipeline.
    Creates startup, founder, and application records.
    """
    signal_id = data.get("signal_id")
    # In-memory database or real Supabase lookups
    # Let's find the signal in our signals list
    signals = db.get_all_outbound_signals()
    target_sig = None
    for s in signals:
        if s.get("id") == signal_id:
            target_sig = s
            break
            
    if not target_sig:
        raise HTTPException(status_code=404, detail="Signal not found.")
        
    try:
        # 1. Insert startup
        startup_name = target_sig["title"].split("/")[-1] if "/" in target_sig["title"] else target_sig["title"]
        startup_website = target_sig["url"]
        startup_sector = "AI Infrastructure" if target_sig["source"] in ["github", "arxiv"] else "Developer Tools"
        
        startup = db.insert_startup(
            name=startup_name,
            website=startup_website,
            sector=startup_sector,
            stage="Seed",
            geography="Unknown"
        )
        startup_id = startup.get("id")
        
        # 2. Insert founder
        founder_name = data.get("founder_name") or target_sig.get("founder_name") or "Founder"
        founder = db.insert_founder(
            name=founder_name,
            email=f"{founder_name.lower().replace(' ', '')}@example.com",
            linkedin_url="",
            github_url=target_sig["url"] if target_sig["source"] == "github" else "",
            twitter_url="",
            bio=f"Discovered via {target_sig['source']} outbound signal: {target_sig['description']}",
            location="Remote"
        )
        founder_id = founder.get("id")
        
        # Link founder and startup
        db.link_founder_startup(founder_id, startup_id)
        
        # 3. Create application
        source_tag = f"outbound_{target_sig['source']}"
        application = db.insert_application(
            startup_id=startup_id,
            source_type=source_tag,
            raw_text=target_sig["description"],
            deck_url=""
        )
        app_id = application.get("id")
        
        # Seed placeholder score for imported applications
        db.insert_opportunity_scores(app_id, {
            "founder_score": int(target_sig["strength"]),
            "founder_confidence": 0.8,
            "founder_trend": "stable",
            "founder_signals": ["high_signal_outbound"],
            "market_score": 80,
            "market_confidence": 0.7,
            "market_trend": "stable",
            "market_signals": ["outbound_discovered"],
            "idea_score": int(target_sig["strength"]),
            "idea_confidence": 0.75,
            "idea_trend": "stable",
            "idea_signals": ["technical_breakthrough"],
            "thesis_alignment": 85,
            "recommendation": "diligence"
        })
        
        # Update signal with founder_id link
        # (In our mock DB, we can just update it in place)
        target_sig["founder_id"] = founder_id
        
        return {
            "status": "imported",
            "application_id": app_id,
            "startup_id": startup_id,
            "founder_id": founder_id,
            "message": f"Successfully imported {startup_name} to inbound pipeline."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import to CRM failed: {str(e)}")

@router.post("/outreach/draft")
async def create_outreach_draft(data: dict):
    """Create a draft outreach message using GPT-4o based on a discovered signal."""
    founder_name = data.get("founder_name", "Founder")
    project_name = data.get("project_name", "your project")
    platform = data.get("platform", "web")
    description = data.get("description", "")
    
    prompt = f"""You are Sarah Chen, a partner at Conviction VC. Write a highly personalized, warm, and professional cold outreach email to a founder.
    
    Context:
    - Founder Name: {founder_name}
    - Project/Company Name: {project_name}
    - Found on platform: {platform}
    - Description of project: {description}
    - Investment Thesis: We invest in early-stage, technical founders building local agentic workflows, edge AI runtimes, and developer infrastructure.
    
    Guidelines:
    - Reference specific details from the project description to show you actually reviewed it.
    - Mention why you think it aligns with our investment thesis.
    - Keep the email under 120 words.
    - End with a low-friction call to action (e.g. asking for a 15-minute chat).
    - Sign off as Sarah Chen, Partner at Conviction VC.
    """
    
    try:
        response = openai_client.chat.completions.create(
            model=get_model_name("gpt-4o"),
            messages=[
                {"role": "system", "content": "You are a top-tier venture capitalist specializing in technical developer outreach."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=250
        )
        draft = response.choices[0].message.content.strip()
        return {"draft": draft, "founder_name": founder_name, "status": "drafted"}
    except Exception as e:
        # Fallback draft if OpenAI API key is unavailable
        fallback_draft = (
            f"Hi {founder_name},\n\n"
            f"I came across {project_name} on {platform} and was incredibly impressed by the implementation. "
            f"The concept of \"{description[:60]}...\" aligns directly with our investment thesis at Conviction. "
            f"We are actively backing early-stage technical founders building edge-optimized agentic infrastructure.\n\n"
            f"Would you be open to a 10-15 minute conversation next week to share what you're building?\n\n"
            f"Best,\nSarah Chen\nPartner, Conviction VC"
        )
        return {"draft": fallback_draft, "founder_name": founder_name, "status": "drafted_fallback"}

@router.get("/crunchbase/autocomplete")
async def get_crunchbase_autocomplete(query: str = Query(..., min_length=1)):
    """Search Crunchbase organization autocomplete database."""
    try:
        results = autocomplete_crunchbase(query)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
