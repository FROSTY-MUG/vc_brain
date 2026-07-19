# =============================================
# VC Brain — Sourcing Routes (Outbound Sourcing & Autocomplete)
# =============================================
import os
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from openai import OpenAI
import db
from services.sourcing_scanners import (
    scan_github,
    scan_arxiv,
    scan_product_hunt,
    scan_devpost,
    autocomplete_crunchbase
)
import requests
from agents.pipeline import run_application_pipeline
import httpx
import asyncio
import threading
import time
from datetime import datetime
from .realtime import manager

router = APIRouter()
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy"))

# ── Seed Signals (shown immediately, never empty) ──
SEED_SIGNALS = [
    {"id": "seed_gh_1", "source": "github", "signal_type": "trending_repository", "title": "openai/swarm", "description": "Educational framework for lightweight multi-agent orchestration. 17k stars in 2 weeks.", "url": "https://github.com/openai/swarm", "strength": 97.0, "founder_name": "openai", "discovered_at": datetime.utcnow().isoformat()},
    {"id": "seed_gh_2", "source": "github", "signal_type": "trending_repository", "title": "browser-use/browser-use", "description": "Make LLMs control browsers. 12k+ stars. Creator shipping fast.", "url": "https://github.com/browser-use/browser-use", "strength": 94.0, "founder_name": "browser-use", "discovered_at": datetime.utcnow().isoformat()},
    {"id": "seed_gh_3", "source": "github", "signal_type": "trending_repository", "title": "andrewyng/translation-agent", "description": "Agentic translation workflow. Andrew Ng project with 7k stars.", "url": "https://github.com/andrewyng/translation-agent", "strength": 91.0, "founder_name": "andrewyng", "discovered_at": datetime.utcnow().isoformat()},
    {"id": "seed_gh_4", "source": "github", "signal_type": "trending_repository", "title": "Significant-Gravitas/AutoGPT", "description": "Pioneering autonomous AI agent infrastructure. Commercial spinout in progress.", "url": "https://github.com/Significant-Gravitas/AutoGPT", "strength": 89.0, "founder_name": "Significant-Gravitas", "discovered_at": datetime.utcnow().isoformat()},
    {"id": "seed_ph_1", "source": "producthunt", "signal_type": "product_launch", "title": "Cursor AI", "description": "AI-native code editor. Product of the Day. Raised $60M Series A.", "url": "https://cursor.sh", "strength": 96.0, "founder_name": "Arvid Lunnemark", "discovered_at": datetime.utcnow().isoformat()},
    {"id": "seed_ph_2", "source": "producthunt", "signal_type": "product_launch", "title": "Perplexity AI", "description": "AI search engine. Top PH launch. $73M Series B.", "url": "https://perplexity.ai", "strength": 95.0, "founder_name": "Aravind Srinivas", "discovered_at": datetime.utcnow().isoformat()},
    {"id": "seed_dp_1", "source": "devpost", "signal_type": "hackathon_winner", "title": "MediScan AI", "description": "First-place winner at Health AI Hackathon 2024. Real-time medical imaging analysis with 95% diagnostic accuracy.", "url": "https://devpost.com/software/mediscan-ai", "strength": 92.0, "founder_name": "Alex Rivera", "discovered_at": datetime.utcnow().isoformat()},
    {"id": "seed_dp_2", "source": "devpost", "signal_type": "hackathon_winner", "title": "CodeLens", "description": "AI-powered real-time code review agent. Winner of DevHacks 2025. GitHub integration live.", "url": "https://devpost.com/software/codelens", "strength": 88.0, "founder_name": "Priya Mehta", "discovered_at": datetime.utcnow().isoformat()},
    {"id": "seed_hn_1", "source": "twitter", "signal_type": "social_signal", "title": "Ask HN: Raising $500K seed, building AI contract review", "description": "YC W24 reject now with 5 customers and $8k MRR. Looking for angels in LegalTech.", "url": "https://news.ycombinator.com/item?id=40123456", "strength": 87.0, "founder_name": "throwaway_legaltech", "discovered_at": datetime.utcnow().isoformat()},
    {"id": "seed_ax_1", "source": "arxiv", "signal_type": "academic_breakthrough", "title": "MemGPT: Towards LLMs as Operating Systems", "description": "Novel memory architecture for LLMs enabling persistent context. Authors spinning out with $2M pre-seed.", "url": "https://arxiv.org/abs/2310.08560", "strength": 90.0, "founder_name": "Charles Packer", "discovered_at": datetime.utcnow().isoformat()},
    {"id": "seed_gh_5", "source": "github", "signal_type": "trending_repository", "title": "meta-llama/llama", "description": "Llama model weights. Ecosystem of startups building on top actively fundraising.", "url": "https://github.com/meta-llama/llama", "strength": 85.0, "founder_name": "meta-llama", "discovered_at": datetime.utcnow().isoformat()},
    {"id": "seed_ph_3", "source": "producthunt", "signal_type": "product_launch", "title": "Vercel AI SDK", "description": "Unified AI SDK for TypeScript. 10k stars in first week. Growing ecosystem of products.", "url": "https://sdk.vercel.ai", "strength": 88.0, "founder_name": "Guillermo Rauch", "discovered_at": datetime.utcnow().isoformat()},
]

# ── Background auto-scan to keep signals fresh ──
_scan_running = False

def _background_scan_loop():
    global _scan_running
    _scan_running = True
    time.sleep(15)  # wait for server to fully boot first
    while True:
        try:
            from services.sourcing_scanners import scan_github, scan_arxiv
            signals = scan_github()
            signals += scan_arxiv(query="llm startup agent")
            for sig in signals:
                db.insert_outbound_signal(
                    source=sig["source"], signal_type=sig["signal_type"],
                    title=sig["title"], description=sig["description"],
                    url=sig["url"], strength=sig["strength"], founder_id=None
                )
            print(f"[Auto Scan] Added {len(signals)} fresh signals")
        except Exception as e:
            print(f"[Auto Scan Error] {e}")
        time.sleep(600)  # re-scan every 10 minutes

_bg = threading.Thread(target=_background_scan_loop, daemon=True)
_bg.start()

@router.get("/outbound/signals")
async def get_outbound_signals():
    """Get discovered outbound signals — seeds + live DB data."""
    try:
        db_signals = db.get_all_outbound_signals()
        # Merge seeds with DB signals, deduplicate by id/url
        existing_urls = {s.get("url", "") for s in db_signals}
        merged = list(db_signals)
        for seed in SEED_SIGNALS:
            if seed["url"] not in existing_urls:
                merged.append(seed)
        return {"signals": merged, "total": len(merged)}
    except Exception as e:
        return {"signals": SEED_SIGNALS, "total": len(SEED_SIGNALS)}

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
            # Update network intelligence graph for this channel
            db.increment_channel_signal(source)
            
        return {
            "status": "success",
            "source": source,
            "count": len(saved_signals),
            "signals": saved_signals
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Outbound scan failed: {str(e)}")

@router.post("/outbound/import")
async def import_signal_to_pipeline(data: dict, background_tasks: BackgroundTasks):
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
        
        # Trigger the main LangGraph pipeline asynchronously to properly score this inbound
        background_tasks.add_task(run_application_pipeline, target_sig["description"], app_id)
        
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
    investor_name = data.get("investor_name", "Sarah Chen")
    fund_name = data.get("fund_name", "Conviction VC")
    
    prompt = f"""You are {investor_name}, a partner at {fund_name}. Write a highly personalized, warm, and professional cold outreach email to a founder.
    
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
    - Sign off as {investor_name}, Partner at {fund_name}.
    """
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
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
            f"The concept of \"{description[:60]}...\" aligns directly with our investment thesis at {fund_name}. "
            f"We are actively backing early-stage technical founders building edge-optimized agentic infrastructure.\n\n"
            f"Would you be open to a 10-15 minute conversation next week to share what you're building?\n\n"
            f"Best,\n{investor_name}\nPartner, {fund_name}"
        )
        return {"draft": fallback_draft, "founder_name": founder_name, "status": "drafted_fallback"}

@router.post("/enrich-founder")
async def enrich_founder(data: dict):
    """Use Tavily to fetch LinkedIn-style public profile data for a founder"""
    name = data.get("name")
    company = data.get("company", "")
    if not name:
        raise HTTPException(status_code=400, detail="Founder name is required for enrichment.")
        
    query = f"{name} {company} LinkedIn profile"
    
    if not TAVILY_API_KEY:
        # Fallback if no Tavily API key
        return {
            "name": name,
            "bio": f"Software Engineer/Founder. Previously built tech in {company or 'various startups'}.",
            "past_companies": ["Unknown VC-backed startup", "Big Tech Corp"],
            "source": "mock_fallback"
        }
        
    try:
        res = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": "basic",
                "include_answer": True,
                "max_results": 3
            },
            timeout=10
        )
        res.raise_for_status()
        tavily_data = res.json()
        
        answer = tavily_data.get("answer", "")
        # Very crude parsing of the answer string for demo purposes
        return {
            "name": name,
            "bio": answer[:200] + "..." if answer else f"Founder at {company}",
            "past_companies": ["Details extracted from search"],
            "source": "tavily_search"
        }
    except Exception as e:
        # Return fallback on error
        return {
            "name": name,
            "bio": f"Could not enrich using Tavily: {str(e)}",
            "past_companies": [],
            "source": "error"
        }

@router.get("/crunchbase/autocomplete")
async def get_crunchbase_autocomplete(query: str = Query(..., min_length=1)):
    """Search Crunchbase organization autocomplete database."""
    try:
        results = autocomplete_crunchbase(query)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/channels/intelligence")
async def get_channel_intelligence():
    """Returns a ranked list of sourcing channels based on dynamic conversion quality."""
    try:
        channels = db.get_sourcing_channels()
        intel_channels = []
        for ch in channels:
            sourced = ch.get("signals_generated", 0)
            funded = ch.get("deals_funded", 0)
            # Prevent zero-division on newly initialized outbound channels
            quality_score = (funded / sourced * 100.0) if sourced > 0 else 0.0
            intel_channels.append({
                "id": ch["id"],
                "name": ch["name"],
                "total_sourced": sourced,
                "conversions": funded,
                "dynamic_quality": round(quality_score, 1)
            })
        
        # Rank by quality DESC, then volume DESC
        intel_channels.sort(key=lambda x: (x["dynamic_quality"], x["total_sourced"]), reverse=True)
        return {"channels": intel_channels}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/channels/stats")
async def get_channel_stats():
    """Get sourcing network graph statistics."""
    try:
        channels = db.get_sourcing_channels()
        
        # Suggest underexplored channels: those with high quality but low signal volume
        # Or just logic for "Proactive Suggestion" based on similar successful models.
        suggestions = []
        for ch in channels:
            if ch.get("quality_score", 0) > 60 and ch.get("signals_generated", 0) < 10:
                suggestions.append({
                    "channel_name": f"{ch['name']} (Underexplored)",
                    "reason": "Historical high quality, low recent volume."
                })
        
        if not suggestions:
            suggestions.append({"channel_name": "Hack-Nation 7th Edition", "reason": "Based on the high conversion rate of previous hackathon cohorts."})
            suggestions.append({"channel_name": "Y Combinator S25 Dropouts", "reason": "High density of technical talent leaving programs early."})

        return {
            "channels": channels,
            "suggestions": suggestions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert-to-deal")
async def convert_to_deal(data: dict):
    """Marks a signal or founder as a funded deal, feeding back into the network intel model."""
    channel_id = data.get("source", "github").lower()
    startup_id = data.get("startup_id", "dummy_startup")
    founder_id = data.get("founder_id", "dummy_founder")
    
    try:
        deal = db.register_deal_feedback(channel_id, startup_id, founder_id)
        return {"status": "success", "message": "Deal registered successfully.", "deal": deal}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def scrape_target_footprint(url: str, client: httpx.AsyncClient) -> dict:
    headers = {"User-Agent": "VC-Brain-Scraper/2.0"}
    response = await client.get(url, headers=headers, timeout=3.0)
    if response.status_code == 200:
        return {"source_url": url, "raw_html_or_json": response.text[:5000]}
    return {"source_url": url, "error": "Unreachable"}

@router.post("/scan/global")
async def trigger_global_internet_scrape(background_tasks: BackgroundTasks):
    urls = [
        "https://news.ycombinator.com",
        "https://github.com/trending",
        "https://devpost.com/hackathons"
    ]
    
    async def run_scrape():
        async with httpx.AsyncClient(limits=httpx.Limits(max_connections=100)) as client:
            tasks = [scrape_target_footprint(url, client) for url in urls]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Instantly broadcast scraped intelligence raw payload over investor WebSockets
            await manager.broadcast_to_investors({
                "type": "RADAR_STREAM_UPDATE",
                "scraped_payloads": len(results),
                "timestamp": "Real-time"
            })
            
    background_tasks.add_task(run_scrape)
    return {"status": "Scrape operation offloaded to background network workers."}
