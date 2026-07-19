# =============================================
# VC Brain — Collab Routes (with real API data)
# =============================================
from fastapi import APIRouter, BackgroundTasks
import db
import threading
import time
from services.data_seeder import fetch_all_founders_and_startups

router = APIRouter()

# In-memory cache for collab data (seed + live)
_collab_cache: list = []
_cache_loaded = False
_cache_lock = threading.Lock()

SEED_POSTS = [
    {"id": "seed_collab_1", "author": "Marcus Johnson", "role": "founder", "type": "Co-Founder Search",
     "content": "Building an AI-powered contract review SaaS. Looking for a technical co-founder with NLP experience. MVP done, 3 paying customers.", "sector": "LegalTech", "skills": ["NLP", "Python", "B2B SaaS"], "contact": "marcus@contractai.io", "source": "direct", "avatar_letter": "M", "avatar_color": "from-purple-600 to-indigo-600", "timestamp": "2h ago"},
    {"id": "seed_collab_2", "author": "Sarah Chen", "role": "founder", "type": "Technical Partner",
     "content": "Ex-Google PM. Working on a no-code AI data pipeline tool. Need a backend engineer with distributed systems background. Pre-seed funding in place.", "sector": "Developer Tools", "skills": ["Go", "Kafka", "Data Engineering"], "contact": "schen@datapipe.ai", "source": "direct", "avatar_letter": "S", "avatar_color": "from-emerald-600 to-teal-600", "timestamp": "5h ago"},
    {"id": "seed_collab_3", "author": "Raj Patel", "role": "founder", "type": "Go-to-Market",
     "content": "Built an AI-powered sales copilot that integrates with Salesforce & HubSpot. Seeking GTM partner with enterprise sales experience.", "sector": "Enterprise SaaS", "skills": ["Sales", "Marketing", "CRM"], "contact": "raj@salescopilot.io", "source": "direct", "avatar_letter": "R", "avatar_color": "from-amber-600 to-orange-600", "timestamp": "1d ago"},
    {"id": "seed_collab_4", "author": "Aiko Tanaka", "role": "founder", "type": "Open Source Contributor",
     "content": "Maintainer of an open source LLM evaluation framework with 2k GitHub stars. Looking for contributors and potential co-founders for the commercial arm.", "sector": "AI Infrastructure", "skills": ["Python", "LLMs", "Benchmarking"], "contact": "https://github.com/aiko-tanaka", "source": "github", "avatar_letter": "A", "avatar_color": "from-blue-600 to-cyan-600", "timestamp": "2d ago"},
    {"id": "seed_collab_5", "author": "Lena Fischer", "role": "founder", "type": "Advisor",
     "content": "Climate tech founder raising seed round. Looking for advisors with climate policy or carbon market experience. SAFE terms ready.", "sector": "Climate Tech", "skills": ["Carbon Markets", "Policy", "Fundraising"], "contact": "lena@carbontrace.io", "source": "direct", "avatar_letter": "L", "avatar_color": "from-green-600 to-emerald-600", "timestamp": "3d ago"},
    {"id": "seed_collab_6", "author": "James Okafor", "role": "founder", "type": "Co-Founder Search",
     "content": "Prev software engineer at Stripe. Building fintech infrastructure for emerging markets. Looking for business co-founder with banking/payments domain expertise.", "sector": "Fintech", "skills": ["Finance", "Payments", "Emerging Markets"], "contact": "james@finbridge.co", "source": "direct", "avatar_letter": "J", "avatar_color": "from-rose-600 to-pink-600", "timestamp": "3d ago"},
    {"id": "seed_collab_7", "author": "Neha Gupta", "role": "founder", "type": "Technical Partner",
     "content": "I'm a doctor building an AI diagnostic assistant. Need a CTO-level technical partner with LLM/RAG experience. Clinical pilots underway at 2 hospitals.", "sector": "HealthTech", "skills": ["RAG", "Healthcare AI", "HIPAA"], "contact": "neha@diagno.health", "source": "direct", "avatar_letter": "N", "avatar_color": "from-violet-600 to-purple-600", "timestamp": "4d ago"},
    {"id": "seed_collab_8", "author": "Carlos Mendez", "role": "founder", "type": "Marketing Partner",
     "content": "Launched EdTech platform for coding education in LatAm. 500+ students, seeking marketing partner to scale to US market.", "sector": "EdTech", "skills": ["Growth", "Content Marketing", "EdTech"], "contact": "carlos@codelatam.co", "source": "direct", "avatar_letter": "C", "avatar_color": "from-sky-600 to-blue-600", "timestamp": "5d ago"},
]

def _load_cache_in_background():
    global _collab_cache, _cache_loaded
    with _cache_lock:
        if not _cache_loaded:
            _collab_cache = list(SEED_POSTS)  # seed immediately
            _cache_loaded = True
    
    while True:
        try:
            live_data = fetch_all_founders_and_startups()
            formatted = []
            for item in live_data:
                formatted.append({
                    "id": item["id"],
                    "author": item["name"],
                    "role": "founder",
                    "type": "Co-Founder Search",
                    "content": item["description"],
                    "sector": item["sector"],
                    "skills": item.get("skills", []),
                    "contact": item.get("contact", item.get("url", "")),
                    "source": item["source"],
                    "avatar_letter": item["name"][0].upper() if item["name"] else "?",
                    "avatar_color": "from-indigo-600 to-blue-600",
                    "github_url": item.get("github_url", ""),
                    "url": item.get("url", ""),
                    "timestamp": "live",
                    "stars": item.get("stars", 0),
                })
            with _cache_lock:
                # Merge: keep seeds, deduplicate live by id
                existing_ids = {p["id"] for p in _collab_cache}
                for p in formatted:
                    if p["id"] not in existing_ids:
                        _collab_cache.append(p)
                        existing_ids.add(p["id"])
        except Exception as e:
            print(f"[Collab Background Refresh] Error: {e}")
        
        time.sleep(300)  # Refresh every 5 minutes

# Start background thread on import
_bg_thread = threading.Thread(target=_load_cache_in_background, daemon=True)
_bg_thread.start()


@router.get("/")
async def get_collab_posts():
    """Returns seed + live API data from cache."""
    with _cache_lock:
        return list(_collab_cache)


@router.get("/discover")
async def discover_collab_posts():
    """Force a fresh fetch from all APIs."""
    try:
        live_data = fetch_all_founders_and_startups()
        formatted = []
        for item in live_data:
            formatted.append({
                "id": item["id"],
                "author": item["name"],
                "role": "founder",
                "type": "Co-Founder Search",
                "content": item["description"],
                "sector": item["sector"],
                "skills": item.get("skills", []),
                "contact": item.get("contact", item.get("url", "")),
                "source": item["source"],
                "avatar_letter": item["name"][0].upper() if item["name"] else "?",
                "avatar_color": "from-indigo-600 to-blue-600",
                "github_url": item.get("github_url", ""),
                "url": item.get("url", ""),
                "timestamp": "live",
                "stars": item.get("stars", 0),
            })
        # Merge into cache
        with _cache_lock:
            existing_ids = {p["id"] for p in _collab_cache}
            added = 0
            for p in formatted:
                if p["id"] not in existing_ids:
                    _collab_cache.append(p)
                    existing_ids.add(p["id"])
                    added += 1
        return {"status": "ok", "new_added": added, "total": len(_collab_cache)}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@router.post("/")
async def create_collab_post(data: dict):
    """Create a user post in the collab board."""
    new_post = db.insert_collab_post(
        data.get("author"), data.get("role"), data.get("type"), data.get("content")
    )
    with _cache_lock:
        _collab_cache.insert(0, {**data, "id": new_post.get("id", str(len(_collab_cache))), "timestamp": "Just now"})
    return new_post
