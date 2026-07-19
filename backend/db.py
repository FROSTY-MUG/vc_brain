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
    "founder_scores": []
}


# ── Seed Data Helper ──
def _seed_in_memory_db():
    # 1. Seed Users
    _in_memory_db["users"].append({
        "email": "investor@conviction.vc",
        "name": "Sarah Chen",
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        "role": "investor",
        "onboarded": True
    })
    
    # 2. Seed Startup 1
    s1_id = str(uuid.uuid4())
    _in_memory_db["startups"].append({
        "id": s1_id,
        "name": "Electron AI",
        "website": "https://electron.ai",
        "sector": "AI Infrastructure",
        "stage": "Seed",
        "geography": "Berlin",
        "created_at": datetime.utcnow().isoformat()
    })
    
    # 3. Seed Founder 1
    f1_id = str(uuid.uuid4())
    _in_memory_db["founders"].append({
        "id": f1_id,
        "name": "Alex Rivera",
        "email": "alex@electron.ai",
        "linkedin_url": "https://linkedin.com/in/alex-rivera-ai",
        "github_url": "https://github.com/alexrivera",
        "twitter_url": "https://twitter.com/alexrivera",
        "bio": "Ex-Google Brain researcher, PhD in Physics from Munich. Expert in local agent execution.",
        "location": "Berlin",
        "created_at": datetime.utcnow().isoformat()
    })
    
    _in_memory_db["founder_startups"].append({
        "founder_id": f1_id,
        "startup_id": s1_id,
        "role": "founder"
    })
    
    _in_memory_db["founder_scores"].append({
        "founder_id": f1_id,
        "overall_score": 88,
        "execution_velocity": 92,
        "domain_expertise": 95,
        "resilience_history": 78,
        "network_centrality": 81,
        "updated_at": datetime.utcnow().isoformat()
    })

    # Trust scores for Founder 1 (claim-level evidence)
    _in_memory_db["trust_scores"].append({
        "id": str(uuid.uuid4()),
        "founder_id": f1_id,
        "claim": "Ex-Google Brain researcher with PhD in Physics",
        "score": 91,
        "extraction_confidence": 0.97,
        "source_reliability": 0.95,
        "corroboration_count": 3,
        "freshness_days": 12,
        "contradiction_flag": False,
        "reasoning": "LinkedIn confirms Google Brain tenure. Google Scholar profile shows 4 publications aligned with claims. PhD verified via university page.",
        "evidence_url": "https://linkedin.com/in/alex-rivera-ai",
        "created_at": datetime.utcnow().isoformat()
    })
    _in_memory_db["trust_scores"].append({
        "id": str(uuid.uuid4()),
        "founder_id": f1_id,
        "claim": "4x latency improvement over vanilla transformers",
        "score": 78,
        "extraction_confidence": 0.88,
        "source_reliability": 0.85,
        "corroboration_count": 1,
        "freshness_days": 30,
        "contradiction_flag": False,
        "reasoning": "GitHub repo shows benchmarks but no external independent replication yet. Claim is technically plausible given the quantized kernel approach.",
        "evidence_url": "https://github.com/alexrivera/electron-runtime",
        "created_at": datetime.utcnow().isoformat()
    })
    
    # 4. Seed Application 1
    a1_id = str(uuid.uuid4())
    _in_memory_db["applications"].append({
        "id": a1_id,
        "startup_id": s1_id,
        "source_type": "inbound",
        "raw_text": "We are building Electron AI, a high-performance framework for deploying local agentic models on edge devices. Our runtime optimizes latency by 4x compared to vanilla transformers, using a custom quantized kernel written in C++.",
        "deck_url": "electron_pitch_deck.pdf",
        "status": "diligence",
        "submitted_at": datetime.utcnow().isoformat()
    })
    
    # 5. Seed Opportunity Scores 1
    _in_memory_db["opportunity_scores"].append({
        "application_id": a1_id,
        "founder_score": 88,
        "founder_confidence": 0.9,
        "founder_trend": "up",
        "founder_signals": ["top_tier_researcher", "second_time_founder"],
        "market_score": 85,
        "market_confidence": 0.8,
        "market_trend": "stable",
        "market_signals": ["growing_edge_ai", "enterprise_interest"],
        "idea_score": 90,
        "idea_confidence": 0.85,
        "idea_trend": "up",
        "idea_signals": ["4x_latency_advantage", "quantized_kernels"],
        "thesis_alignment": 92,
        "recommendation": "diligence"
    })
    
    # 6. Seed Memo 1
    _in_memory_db["memos"].append({
        "application_id": a1_id,
        "content_json": {
            "summary": "Electron AI is building local agentic runtime with 4x performance. Highly technical founder (ex-Google Brain). Strong thesis alignment.",
            "recommendation": {
                "action": "diligence",
                "reason": "Outstanding technical qualifications and clear product differentiation in the hot Edge AI runtime space."
            }
        },
        "recommendation": "diligence",
        "generated_at": datetime.utcnow().isoformat()
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
            "founder_id": founder_id,
            **scores,
            "updated_at": datetime.utcnow().isoformat()
        }
        _in_memory_db["founder_scores"] = [x for x in _in_memory_db["founder_scores"] if x["founder_id"] != founder_id]
        _in_memory_db["founder_scores"].append(new_scores)
        return new_scores
        
    sb = get_supabase()
    result = sb.table("founder_scores").upsert({
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
            res.append(app_copy)
        res.sort(key=lambda x: x.get("submitted_at", ""), reverse=True)
        return res
        
    sb = get_supabase()
    result = sb.table("applications").select("*, startups(*)").order("submitted_at", desc=True).execute()
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
            f_copy["founder_scores"] = [fs for fs in _in_memory_db["founder_scores"] if fs["founder_id"] == f["id"]]
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
                f_copy["founder_scores"] = [fs for fs in _in_memory_db["founder_scores"] if fs["founder_id"] == founder_id]
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
