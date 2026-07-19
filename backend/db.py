# =============================================
# VC Brain — Supabase Database Client with In-Memory Fallback
# =============================================
import os
import uuid
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

_client: Client | None = None
_use_in_memory = False

# ── In-Memory Database Storage ──
_in_memory_db = {
    "startups": [],
    "founders": [],
    "founder_startups": [],
    "applications": [],
    "claims": [],
    "trust_scores": [],
    "evidence_links": [],
    "opportunity_scores": [],
    "memos": [],
    "outbound_signals": [],
    "outreach_events": [],
    "users": [],
    "founder_scores": [],
    "theses": [],
    "sourcing_channels": [
        {"id": "github", "name": "GitHub Trending", "type": "code", "signals_generated": 0, "deals_funded": 0, "quality_score": 50, "active": True},
        {"id": "producthunt", "name": "ProductHunt Launches", "type": "launch", "signals_generated": 0, "deals_funded": 0, "quality_score": 50, "active": True},
        {"id": "devpost", "name": "Devpost Hackathons", "type": "hackathon", "signals_generated": 0, "deals_funded": 0, "quality_score": 50, "active": True},
        {"id": "arxiv", "name": "arXiv Papers", "type": "research", "signals_generated": 0, "deals_funded": 0, "quality_score": 50, "active": True}
    ],
    "deals": [],
    "collab_posts": [],
    "investors": [],
    "kpis": [],
    "messages": []
}


# ── Seed Data Helper ──
def _seed_in_memory_db():
    if _in_memory_db["startups"]:
        return
        
    s1_id = "test-startup-id-1"
    _in_memory_db["startups"].append({
        "id": s1_id,
        "name": "Electron AI",
        "website": "https://electron.ai",
        "sector": "AI Infrastructure",
        "stage": "Seed",
        "geography": "Berlin",
        "created_at": datetime.utcnow().isoformat()
    })

    app_id = "test-app-id-1"
    _in_memory_db["applications"].append({
        "id": app_id,
        "startup_id": s1_id,
        "source_type": "inbound",
        "raw_text": "Electron AI builds...",
        "deck_url": "https://pitchdeck.com/electron-ai",
        "status": "diligence",
        "submitted_at": datetime.utcnow().isoformat()
    })
    
    _in_memory_db["opportunity_scores"].append({
        "id": str(uuid.uuid4()),
        "application_id": app_id,
        "founder_score": 85,
        "market_score": 90,
        "idea_score": 75,
        "recommendation": "deploy",
        "confidence": 0.88,
        "reasoning": "Strong founder background with deep domain expertise. Market is growing rapidly."
    })
    
    _in_memory_db["memos"].append({
        "id": str(uuid.uuid4()),
        "application_id": app_id,
        "content_json": {
            "company_snapshot": "Next-generation distributed training infrastructure for AI.",
            "investment_hypotheses": [
                "Elite technical founder building in a critical infrastructure layer.",
                "Early prototype shows 3x faster training on 100B parameter models."
            ],
            "swot": {
                "strengths": [
                    {"statement": "Elite technical founder", "factors": ["Ex-Google"], "conflicts": []},
                    {"statement": "3x performance improvement", "factors": ["Verified metrics"], "conflicts": []}
                ],
                "weaknesses": [
                    {"statement": "Solo founder", "factors": ["No commercial co-founder"], "conflicts": []}
                ],
                "opportunities": [
                    {"statement": "Explosive growth in LLM training", "factors": ["High demand"], "conflicts": []}
                ],
                "threats": [
                    {"statement": "Hyperscalers", "factors": ["AWS, GCP"], "conflicts": []}
                ]
            },
            "team_and_history": "Alex Rivera scaled ML infrastructure at Google.",
            "problem_and_product": "AI models are becoming too large to train efficiently. Electron AI solves this with distributed training.",
            "technology_and_defensibility": "Proprietary network routing algorithm for GPU clusters.",
            "market_sizing": "AI infrastructure is expanding rapidly (40% CAGR).",
            "competition": "Several well-funded competitors including hyperscalers.",
            "traction_and_kpis": "Early prototype shows 3x faster training.",
            "financials_and_round": "Not disclosed.",
            "cap_table": "Not disclosed.",
            "due_diligence_log": "Checked technical viability. Open: Commercial strategy.",
            "exit_perspective": "Acquisition by major cloud provider.",
            "recommendation": {
                "action": "deploy",
                "confidence": "HIGH",
                "reasoning": "Strong technical founder building in a critical infrastructure layer.",
                "open_questions": ["What is the go-to-market strategy?"]
            }
        },
        "created_at": datetime.utcnow().isoformat()
    })


# Initialize Supabase client or fall back
try:
    if SUPABASE_URL and SUPABASE_KEY and not SUPABASE_KEY.startswith("sb_secret_"):
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
        # Verify connectivity
        _client.table("users").select("id").limit(1).execute()
        print("Connected to Supabase successfully.")
    else:
        raise ValueError("Using placeholder credentials or incomplete configuration.")
except Exception as e:
    _use_in_memory = True
    print(f"Supabase connection could not be established ({e}). Falling back to In-Memory Database.")
    _seed_in_memory_db()

def get_supabase() -> Client:
    global _client, _use_in_memory
    if _client is None and not _use_in_memory:
        try:
            _client = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception:
            _use_in_memory = True
    return _client


# ── CRUD Helpers ──

def insert_startup(name: str, website: str = "", sector: str = "", stage: str = "", geography: str = "") -> dict:
    if _use_in_memory:
        new_startup = {
            "id": str(uuid.uuid4()),
            "name": name,
            "website": website,
            "sector": sector,
            "stage": stage,
            "geography": geography,
            "created_at": datetime.utcnow().isoformat()
        }
        _in_memory_db["startups"].append(new_startup)
        return new_startup
        
    sb = get_supabase()
    result = sb.table("startups").insert({
        "name": name, "website": website, "sector": sector,
        "stage": stage, "geography": geography
    }).execute()
    return result.data[0] if result.data else {}

def insert_founder(name: str, email: str = "", linkedin_url: str = "", github_url: str = "", twitter_url: str = "", bio: str = "", location: str = "") -> dict:
    if _use_in_memory:
        new_founder = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "linkedin_url": linkedin_url,
            "github_url": github_url,
            "twitter_url": twitter_url,
            "bio": bio,
            "location": location,
            "created_at": datetime.utcnow().isoformat()
        }
        _in_memory_db["founders"].append(new_founder)
        return new_founder

    sb = get_supabase()
    result = sb.table("founders").insert({
        "name": name, "email": email, "linkedin_url": linkedin_url,
        "github_url": github_url, "twitter_url": twitter_url,
        "bio": bio, "location": location
    }).execute()
    return result.data[0] if result.data else {}

def link_founder_startup(founder_id: str, startup_id: str, role: str = "founder"):
    if _use_in_memory:
        _in_memory_db["founder_startups"].append({
            "founder_id": founder_id,
            "startup_id": startup_id,
            "role": role
        })
        return
        
    sb = get_supabase()
    sb.table("founder_startups").insert({
        "founder_id": founder_id, "startup_id": startup_id, "role": role
    }).execute()

def insert_application(startup_id: str, source_type: str = "inbound", raw_text: str = "", deck_url: str = "") -> dict:
    if _use_in_memory:
        new_app = {
            "id": str(uuid.uuid4()),
            "startup_id": startup_id,
            "source_type": source_type,
            "raw_text": raw_text,
            "deck_url": deck_url,
            "status": "screening",
            "submitted_at": datetime.utcnow().isoformat()
        }
        _in_memory_db["applications"].append(new_app)
        return new_app
        
    sb = get_supabase()
    result = sb.table("applications").insert({
        "startup_id": startup_id, "source_type": source_type,
        "raw_text": raw_text, "deck_url": deck_url, "status": "screening"
    }).execute()
    return result.data[0] if result.data else {}

def update_application_status(app_id: str, status: str):
    if _use_in_memory:
        for app in _in_memory_db["applications"]:
            if app["id"] == app_id:
                app["status"] = status
                break
        return
        
    sb = get_supabase()
    sb.table("applications").update({"status": status}).eq("id", app_id).execute()

def append_cot_log(app_id: str, entry: dict):
    if _use_in_memory:
        for app in _in_memory_db["applications"]:
            if app["id"] == app_id:
                if not app.get("cot_log"):
                    app["cot_log"] = []
                if isinstance(app["cot_log"], str):
                    import json
                    try:
                        app["cot_log"] = json.loads(app["cot_log"])
                    except:
                        app["cot_log"] = []
                app["cot_log"].append(entry)
                break
        return
        
    sb = get_supabase()
    # Fetch, append, update (JSONB append requires SQL, so we do it client side for simplicity)
    result = sb.table("applications").select("cot_log").eq("id", app_id).execute()
    if result.data:
        current_log = result.data[0].get("cot_log") or []
        if isinstance(current_log, str):
            import json
            try:
                current_log = json.loads(current_log)
            except:
                current_log = []
        current_log.append(entry)
        sb.table("applications").update({"cot_log": current_log}).eq("id", app_id).execute()

def convert_application_to_deal(app_id: str) -> dict:
    app = get_application(app_id)
    if not app:
        return {"error": "Application not found"}
        
    source = app.get("source_type", "inbound")
    
    # Update app status
    update_application_status(app_id, "Funded")
    
    # Increment channel conversions
    if _use_in_memory:
        for ch in _in_memory_db["sourcing_channels"]:
            if ch["id"] == source:
                ch["deals_funded"] += 1
                break
    else:
        try:
            sb = get_supabase()
            ch_res = sb.table("sourcing_channels").select("deals_funded").eq("id", source).execute()
            if ch_res.data:
                deals = ch_res.data[0].get("deals_funded", 0) + 1
                sb.table("sourcing_channels").update({"deals_funded": deals}).eq("id", source).execute()
        except Exception:
            pass
            
    return {"status": "success", "app_id": app_id, "channel": source}

def insert_claim(application_id: str, claim_type: str, statement: str, source: str) -> dict:
    if _use_in_memory:
        new_claim = {
            "id": str(uuid.uuid4()),
            "application_id": application_id,
            "claim_type": claim_type,
            "statement": statement,
            "source": source
        }
        _in_memory_db["claims"].append(new_claim)
        return new_claim
        
    sb = get_supabase()
    result = sb.table("claims").insert({
        "application_id": application_id, "claim_type": claim_type,
        "statement": statement, "source": source
    }).execute()
    return result.data[0] if result.data else {}

def insert_trust_score(claim_id: str, score: float, reasoning: str) -> dict:
    if _use_in_memory:
        new_ts = {
            "id": str(uuid.uuid4()),
            "claim_id": claim_id,
            "score": score,
            "reasoning": reasoning
        }
        _in_memory_db["trust_scores"].append(new_ts)
        return new_ts
        
    sb = get_supabase()
    result = sb.table("trust_scores").insert({
        "claim_id": claim_id, "score": score, "reasoning": reasoning
    }).execute()
    return result.data[0] if result.data else {}

def insert_evidence_link(claim_id: str, source_url: str, excerpt: str, reliability_weight: float = 0.7) -> dict:
    if _use_in_memory:
        new_el = {
            "id": str(uuid.uuid4()),
            "claim_id": claim_id,
            "source_url": source_url,
            "excerpt": excerpt,
            "reliability_weight": reliability_weight
        }
        _in_memory_db["evidence_links"].append(new_el)
        return new_el
        
    sb = get_supabase()
    result = sb.table("evidence_links").insert({
        "claim_id": claim_id, "source_url": source_url,
        "excerpt": excerpt, "reliability_weight": reliability_weight
    }).execute()
    return result.data[0] if result.data else {}

def insert_opportunity_scores(application_id: str, scores: dict) -> dict:
    if _use_in_memory:
        new_scores = {
            "id": str(uuid.uuid4()),
            "application_id": application_id,
            **scores
        }
        _in_memory_db["opportunity_scores"] = [x for x in _in_memory_db["opportunity_scores"] if x["application_id"] != application_id]
        _in_memory_db["opportunity_scores"].append(new_scores)
        return new_scores
        
    sb = get_supabase()
    result = sb.table("opportunity_scores").insert({
        "application_id": application_id, **scores
    }).execute()
    return result.data[0] if result.data else {}

def insert_memo(application_id: str, content_json: dict, recommendation: str) -> dict:
    if _use_in_memory:
        new_memo = {
            "id": str(uuid.uuid4()),
            "application_id": application_id,
            "content_json": content_json,
            "recommendation": recommendation,
            "generated_at": datetime.utcnow().isoformat()
        }
        _in_memory_db["memos"] = [x for x in _in_memory_db["memos"] if x["application_id"] != application_id]
        _in_memory_db["memos"].append(new_memo)
        return new_memo
        
    sb = get_supabase()
    result = sb.table("memos").insert({
        "application_id": application_id,
        "content_json": content_json,
        "recommendation": recommendation
    }).execute()
    return result.data[0] if result.data else {}

def insert_outbound_signal(source: str, signal_type: str, title: str, description: str, url: str, strength: float, founder_id: str = None) -> dict:
    if _use_in_memory:
        new_signal = {
            "id": str(uuid.uuid4()),
            "source": source,
            "signal_type": signal_type,
            "title": title,
            "description": description,
            "url": url,
            "strength": strength,
            "founder_id": founder_id,
            "discovered_at": datetime.utcnow().isoformat()
        }
        _in_memory_db["outbound_signals"].append(new_signal)
        return new_signal
        
    sb = get_supabase()
    data = {
        "source": source, "signal_type": signal_type, "title": title,
        "description": description, "url": url, "strength": strength
    }
    if founder_id:
        data["founder_id"] = founder_id
    result = sb.table("outbound_signals").insert(data).execute()
    return result.data[0] if result.data else {}

def insert_founder_score(founder_id: str, scores: dict) -> dict:
    if _use_in_memory:
        new_scores = {
            "id": str(uuid.uuid4()),
            "founder_id": founder_id,
            **scores,
            "created_at": datetime.utcnow().isoformat()
        }
        _in_memory_db["founder_scores"].append(new_scores)
        return new_scores
        
    sb = get_supabase()
    result = sb.table("founder_scores").insert({
        "founder_id": founder_id, **scores
    }).execute()
    return result.data[0] if result.data else {}

def upsert_founder_score(founder_id: str, scores: dict) -> dict:
    if _use_in_memory:
        # Delete old
        _in_memory_db["founder_scores"] = [s for s in _in_memory_db["founder_scores"] if s.get("founder_id") != founder_id]
        # Insert new
        return insert_founder_score(founder_id, scores)
        
    sb = get_supabase()
    # Supabase uses upsert on unique constraints. Or just delete and insert.
    sb.table("founder_scores").delete().eq("founder_id", founder_id).execute()
    result = sb.table("founder_scores").insert({
        "founder_id": founder_id, **scores
    }).execute()
    return result.data[0] if result.data else {}

# ── User Profile Helpers ──
def get_user_by_email(email: str) -> dict:
    if _use_in_memory:
        for u in _in_memory_db["users"]:
            if u["email"] == email:
                return u
        return {}
        
    sb = get_supabase()
    result = sb.table("users").select("*").eq("email", email).execute()
    return result.data[0] if result.data else {}

def upsert_user(email: str, name: str, avatar_url: str, role: str = "investor", onboarded: bool = False) -> dict:
    if _use_in_memory:
        existing = get_user_by_email(email)
        if existing:
            existing["name"] = name
            existing["avatar_url"] = avatar_url
            existing["role"] = role
            existing["onboarded"] = onboarded
            return existing
        else:
            new_user = {
                "email": email,
                "name": name,
                "avatar_url": avatar_url,
                "role": role,
                "onboarded": onboarded
            }
            _in_memory_db["users"].append(new_user)
            return new_user

    sb = get_supabase()
    existing = get_user_by_email(email)
    if existing:
        result = sb.table("users").update({
            "name": name, "avatar_url": avatar_url, "role": role, "onboarded": onboarded
        }).eq("email", email).execute()
    else:
        result = sb.table("users").insert({
            "email": email, "name": name, "avatar_url": avatar_url, "role": role, "onboarded": onboarded
        }).execute()
    return result.data[0] if result.data else {}

# ── Thesis Helpers ──
def upsert_thesis(user_id: str, thesis_data: dict) -> dict:
    if _use_in_memory:
        for t in _in_memory_db["theses"]:
            if t["user_id"] == user_id:
                t.update(thesis_data)
                return t
        new_thesis = {"id": str(uuid.uuid4()), "user_id": user_id, **thesis_data}
        _in_memory_db["theses"].append(new_thesis)
        return new_thesis

    sb = get_supabase()
    # Try updating first
    res = sb.table("theses").select("id").eq("user_id", user_id).execute()
    if res.data:
        res = sb.table("theses").update(thesis_data).eq("user_id", user_id).execute()
    else:
        res = sb.table("theses").insert({"user_id": user_id, **thesis_data}).execute()
    return res.data[0] if res.data else {}

def get_thesis_by_user(user_id: str) -> dict:
    if _use_in_memory:
        for t in _in_memory_db["theses"]:
            if t["user_id"] == user_id:
                return t
        return {}

    sb = get_supabase()
    res = sb.table("theses").select("*").eq("user_id", user_id).execute()
    return res.data[0] if res.data else {}

# ── Message / Pitch Helpers ──
def insert_pitch(founder_id: str, investor_id: str, message: str) -> dict:
    if _use_in_memory:
        new_event = {
            "id": str(uuid.uuid4()),
            "founder_id": founder_id,
            "channel": investor_id,
            "message": message,
            "status": "sent",
            "created_at": datetime.utcnow().isoformat()
        }
        _in_memory_db["outreach_events"].append(new_event)
        return new_event
        
    sb = get_supabase()
    result = sb.table("outreach_events").insert({
        "founder_id": founder_id,
        "channel": investor_id, # investor user id
        "message": message,
        "status": "sent"
    }).execute()
    return result.data[0] if result.data else {}

def update_pitch_status(pitch_id: str, status: str) -> dict:
    if _use_in_memory:
        for event in _in_memory_db["outreach_events"]:
            if event["id"] == pitch_id:
                event["status"] = status
                return event
        return {}
        
    sb = get_supabase()
    result = sb.table("outreach_events").update({
        "status": status
    }).eq("id", pitch_id).execute()
    return result.data[0] if result.data else {}

def get_pitches_for_investor(investor_id: str) -> list:
    if _use_in_memory:
        pitches = []
        for pitch in _in_memory_db["outreach_events"]:
            if pitch["channel"] == investor_id:
                p_copy = pitch.copy()
                p_copy["founders"] = next((f for f in _in_memory_db["founders"] if f["id"] == pitch["founder_id"]), None)
                pitches.append(p_copy)
        return pitches
        
    sb = get_supabase()
    result = sb.table("outreach_events").select("*, founders(*)").eq("channel", investor_id).execute()
    return result.data or []

def get_pitches_for_founder(founder_id: str) -> list:
    if _use_in_memory:
        return [p for p in _in_memory_db["outreach_events"] if p["founder_id"] == founder_id]
        
    sb = get_supabase()
    result = sb.table("outreach_events").select("*").eq("founder_id", founder_id).execute()
    return result.data or []

# ── Read Helpers ──

def get_all_applications() -> list:
    if _use_in_memory:
        res = []
        for app in _in_memory_db["applications"]:
            app_copy = app.copy()
            app_copy["startups"] = next((s for s in _in_memory_db["startups"] if s["id"] == app["startup_id"]), None)
            app_copy["opportunity_scores"] = next((o for o in _in_memory_db["opportunity_scores"] if o["application_id"] == app["id"]), None)
            app_copy["memos"] = next((m for m in _in_memory_db["memos"] if m["application_id"] == app["id"]), None)
            res.append(app_copy)
        res.sort(key=lambda x: x.get("submitted_at", ""), reverse=True)
        return res
        
    sb = get_supabase()
    result = sb.table("applications").select("*, startups(*), opportunity_scores(*), memos(*)").order("submitted_at", desc=True).execute()
    return result.data or []

def get_application(app_id: str) -> dict:
    if _use_in_memory:
        for app in _in_memory_db["applications"]:
            if app["id"] == app_id:
                app_copy = app.copy()
                app_copy["startups"] = next((s for s in _in_memory_db["startups"] if s["id"] == app["startup_id"]), None)
                app_copy["opportunity_scores"] = next((o for o in _in_memory_db["opportunity_scores"] if o["application_id"] == app_id), None)
                app_copy["memos"] = next((m for m in _in_memory_db["memos"] if m["application_id"] == app_id), None)
                return app_copy
        return {}
        
    sb = get_supabase()
    result = sb.table("applications").select("*, startups(*), opportunity_scores(*), memos(*)").eq("id", app_id).execute()
    return result.data[0] if result.data else {}

def get_claims_for_app(app_id: str) -> list:
    if _use_in_memory:
        res = []
        for claim in _in_memory_db["claims"]:
            if claim["application_id"] == app_id:
                claim_copy = claim.copy()
                claim_copy["trust_scores"] = [ts for ts in _in_memory_db["trust_scores"] if ts["claim_id"] == claim["id"]]
                claim_copy["evidence_links"] = [el for el in _in_memory_db["evidence_links"] if el["claim_id"] == claim["id"]]
                res.append(claim_copy)
        return res
        
    sb = get_supabase()
    result = sb.table("claims").select("*, trust_scores(*), evidence_links(*)").eq("application_id", app_id).execute()
    return result.data or []

def get_all_founders() -> list:
    if _use_in_memory:
        res = []
        for f in _in_memory_db["founders"]:
            f_copy = f.copy()
            f_copy["founder_scores"] = sorted([fs for fs in _in_memory_db["founder_scores"] if fs["founder_id"] == f["id"]], key=lambda x: x.get("created_at", ""), reverse=True)
            f_copy["trust_scores"] = [ts for ts in _in_memory_db["trust_scores"] if ts.get("founder_id") == f["id"]]
            # Attach startups via junction
            f_copy["startups"] = []
            for fs_rel in _in_memory_db["founder_startups"]:
                if fs_rel["founder_id"] == f["id"]:
                    st = next((s for s in _in_memory_db["startups"] if s["id"] == fs_rel["startup_id"]), None)
                    if st:
                        f_copy["startups"].append(st)
            res.append(f_copy)
        res.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return res
        
    sb = get_supabase()
    result = sb.table("founders").select("*, founder_scores(*), trust_scores(*)").order("created_at", desc=True).execute()
    return result.data or []

def get_founder(founder_id: str) -> dict:
    if _use_in_memory:
        for f in _in_memory_db["founders"]:
            if f["id"] == founder_id:
                f_copy = f.copy()
                f_copy["founder_scores"] = sorted([fs for fs in _in_memory_db["founder_scores"] if fs["founder_id"] == founder_id], key=lambda x: x.get("created_at", ""), reverse=True)
                f_copy["trust_scores"] = [ts for ts in _in_memory_db["trust_scores"] if ts.get("founder_id") == founder_id]
                linked = []
                f_copy["startups"] = []
                for fs_rel in _in_memory_db["founder_startups"]:
                    if fs_rel["founder_id"] == founder_id:
                        rel_copy = fs_rel.copy()
                        st = next((s for s in _in_memory_db["startups"] if s["id"] == fs_rel["startup_id"]), None)
                        rel_copy["startups"] = st
                        linked.append(rel_copy)
                        if st:
                            f_copy["startups"].append(st)
                f_copy["founder_startups"] = linked
                return f_copy
        return {}
        
    sb = get_supabase()
    result = sb.table("founders").select("*, founder_scores(*), trust_scores(*), founder_startups(*, startups(*))").eq("id", founder_id).execute()
    return result.data[0] if result.data else {}

def get_memo_for_app(app_id: str) -> dict:
    if _use_in_memory:
        for m in _in_memory_db["memos"]:
            if m["application_id"] == app_id:
                return m
        return {}
        
    sb = get_supabase()
    result = sb.table("memos").select("*").eq("application_id", app_id).execute()
    return result.data[0] if result.data else {}

def get_scores_for_app(app_id: str) -> dict:
    if _use_in_memory:
        for o in _in_memory_db["opportunity_scores"]:
            if o["application_id"] == app_id:
                return o
        return {}
        
    sb = get_supabase()
    result = sb.table("opportunity_scores").select("*").eq("application_id", app_id).execute()
    return result.data[0] if result.data else {}

def get_all_outbound_signals() -> list:
    if _use_in_memory:
        return _in_memory_db["outbound_signals"]
    sb = get_supabase()
    result = sb.table("outbound_signals").select("*").order("discovered_at", desc=True).execute()
    return result.data or []

# ── Collab Helpers ──
def get_all_collab_posts() -> list:
    if _use_in_memory:
        return sorted(_in_memory_db["collab_posts"], key=lambda x: x.get("timestamp", ""), reverse=True)
    sb = get_supabase()
    res = sb.table("collab_posts").select("*").order("timestamp", desc=True).execute()
    return res.data or []

def insert_collab_post(post: dict) -> dict:
    if _use_in_memory:
        post["id"] = str(uuid.uuid4())
        post["timestamp"] = datetime.utcnow().isoformat()
        _in_memory_db["collab_posts"].append(post)
        return post
    sb = get_supabase()
    res = sb.table("collab_posts").insert(post).execute()
    return res.data[0] if res.data else {}

# ── Investors Helpers ──
def get_all_investors() -> list:
    if _use_in_memory:
        return _in_memory_db["investors"]
    sb = get_supabase()
    res = sb.table("investors").select("*").execute()
    return res.data or []

# ── KPIs Helpers ──
def get_all_kpis() -> list:
    if _use_in_memory:
        return _in_memory_db["kpis"]
    sb = get_supabase()
    res = sb.table("kpis").select("*").execute()
    return res.data or []


# ── KPIs Helpers ──
def get_all_kpis() -> list:
    if _use_in_memory:
        return _in_memory_db["kpis"]
    sb = get_supabase()
    res = sb.table("kpis").select("*").execute()
    return res.data or []

# ── Chat/Messages Helpers ──
def get_all_users() -> list:
    if _use_in_memory:
        return _in_memory_db["users"]
    sb = get_supabase()
    res = sb.table("users").select("*").execute()
    return res.data or []

def get_conversations(user_email: str) -> list:
    if _use_in_memory:
        convos = {}
        for m in _in_memory_db["messages"]:
            if m.get("sender_email") == user_email or m.get("recipient_email") == user_email:
                other = m["recipient_email"] if m["sender_email"] == user_email else m["sender_email"]
                if other not in convos or m["sent_at"] > convos[other]["last_message_at"]:
                    convos[other] = {
                        "other_email": other,
                        "last_message": m["content"],
                        "last_message_at": m["sent_at"]
                    }
        return list(convos.values())
        
    sb = get_supabase()
    # Simple query to get all messages for user, we will group them in memory
    res = sb.table("messages").select("*").or_(f"sender_email.eq.{user_email},recipient_email.eq.{user_email}").order("sent_at", desc=True).execute()
    messages = res.data or []
    convos = {}
    for m in messages:
        other = m["recipient_email"] if m["sender_email"] == user_email else m["sender_email"]
        if other not in convos:
            convos[other] = {
                "other_email": other,
                "last_message": m["content"],
                "last_message_at": m["sent_at"]
            }
    return list(convos.values())

def get_conversation_messages(user1_email: str, user2_email: str) -> list:
    if _use_in_memory:
        msgs = [m for m in _in_memory_db["messages"] if 
                (m.get("sender_email") == user1_email and m.get("recipient_email") == user2_email) or 
                (m.get("sender_email") == user2_email and m.get("recipient_email") == user1_email)]
        return sorted(msgs, key=lambda x: x["sent_at"])
        
    sb = get_supabase()
    res = sb.table("messages").select("*").or_(
        f"and(sender_email.eq.{user1_email},recipient_email.eq.{user2_email}),and(sender_email.eq.{user2_email},recipient_email.eq.{user1_email})"
    ).order("sent_at", desc=False).execute()
    return res.data or []

def insert_conversation_message(sender_email: str, recipient_email: str, content: str) -> dict:
    new_msg = {
        "id": str(uuid.uuid4()),
        "sender_email": sender_email,
        "recipient_email": recipient_email,
        "content": content,
        "sent_at": datetime.utcnow().isoformat(),
        "read": False
    }
    if _use_in_memory:
        if "messages" not in _in_memory_db:
            _in_memory_db["messages"] = []
        _in_memory_db["messages"].append(new_msg)
        return new_msg
        
    sb = get_supabase()
    res = sb.table("messages").insert(new_msg).execute()
    return res.data[0] if res.data else {}

# ── Messages Helpers ──
def get_all_messages() -> list:
    if _use_in_memory:
        return _in_memory_db["messages"]
    sb = get_supabase()
    res = sb.table("messages").select("*").execute()
    return res.data or []

def insert_message(message: dict) -> dict:
    if _use_in_memory:
        message["id"] = str(uuid.uuid4())
        message["sent_at"] = datetime.utcnow().isoformat()
        _in_memory_db["messages"].append(message)
        return message
    sb = get_supabase()
    res = sb.table("messages").insert(message).execute()
    return res.data[0] if res.data else {}


# ── Sourcing Network Intelligence ──

def get_sourcing_channels() -> list:
    if _use_in_memory:
        return _in_memory_db["sourcing_channels"]
    sb = get_supabase()
    try:
        result = sb.table("sourcing_channels").select("*").execute()
        return result.data or []
    except Exception:
        # Fallback if table doesn't exist in user's Supabase yet
        return _in_memory_db["sourcing_channels"]

def increment_channel_signal(channel_id: str):
    if _use_in_memory:
        for ch in _in_memory_db["sourcing_channels"]:
            if ch["id"] == channel_id:
                ch["signals_generated"] += 1
                return
    else:
        try:
            sb = get_supabase()
            # Fetch current
            res = sb.table("sourcing_channels").select("signals_generated").eq("id", channel_id).execute()
            if res.data:
                curr = res.data[0].get("signals_generated", 0)
                sb.table("sourcing_channels").update({"signals_generated": curr + 1}).eq("id", channel_id).execute()
        except Exception:
            pass

def register_deal_feedback(channel_id: str, startup_id: str, founder_id: str = None) -> dict:
    if _use_in_memory:
        deal = {
            "id": str(uuid.uuid4()),
            "channel_id": channel_id,
            "startup_id": startup_id,
            "founder_id": founder_id,
            "created_at": datetime.utcnow().isoformat()
        }
        _in_memory_db["deals"].append(deal)
        for ch in _in_memory_db["sourcing_channels"]:
            if ch["id"] == channel_id:
                ch["deals_funded"] += 1
                # Recalculate quality score: base 50, +20 per deal, -1 per empty signal
                ch["quality_score"] = min(100, max(0, 50 + (ch["deals_funded"] * 20) - (ch["signals_generated"] * 1)))
        return deal
    else:
        try:
            sb = get_supabase()
            deal = {
                "channel_id": channel_id,
                "startup_id": startup_id,
                "founder_id": founder_id
            }
            res = sb.table("deals").insert(deal).execute()
            
            # Update channel stats
            ch_res = sb.table("sourcing_channels").select("deals_funded", "signals_generated").eq("id", channel_id).execute()
            if ch_res.data:
                ch_data = ch_res.data[0]
                deals = ch_data.get("deals_funded", 0) + 1
                sigs = ch_data.get("signals_generated", 0)
                quality = min(100, max(0, 50 + (deals * 20) - (sigs * 1)))
                sb.table("sourcing_channels").update({"deals_funded": deals, "quality_score": quality}).eq("id", channel_id).execute()
            return res.data[0] if res.data else deal
        except Exception:
            return {}

import sqlite3
import time
from contextlib import contextmanager

DB_PATH = "vc_brain_storage.db"

@contextmanager
def get_db_connection():
    # Enforces absolute thread containment margins for handling high-frequency async workers
    conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")  # Write-Ahead Logging for non-blocking concurrent reads/writes
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS founder_scores_history (
            id TEXT PRIMARY KEY,
            founder_id TEXT,
            base_score INTEGER,
            confidence_margin INTEGER,
            justification TEXT,
            recorded_timestamp INTEGER
        );
    """)
    
    try:
        yield conn
    finally:
        conn.close()

def append_historical_founder_score(founder_id: str, base_score: int, margin: int, rationale: str):
    query = """
        INSERT INTO founder_scores_history (id, founder_id, base_score, confidence_margin, justification, recorded_timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """
    with get_db_connection() as conn:
        with conn:
            conn.execute(query, (
                str(uuid.uuid4()),  # Guarantee zero primary key collisions across execution frames
                founder_id,
                base_score,
                margin,
                rationale,
                int(time.time())
            ))
