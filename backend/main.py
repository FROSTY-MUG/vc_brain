from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.applications import router as applications_router
from routes.founders import router as founders_router
from routes.scoring import router as scoring_router
from routes.memo import router as memo_router
from routes.thesis import router as thesis_router
from routes.sourcing import router as sourcing_router
from routes.search import router as search_router
from routes.messages import router as messages_router
from routes.collab import router as collab_router
from routes.investors import router as investors_router
from routes.kpis import router as kpis_router
from routes.profile import router as profile_router
from routes.realtime import router as realtime_router
import os

app = FastAPI(
    title="VC Brain API",
    description="Conviction — The VC Operating System",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# ALLOWED_ORIGINS env var: comma-separated list of allowed origins.
# Defaults to localhost + Vercel wildcard pattern.
_extra = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
]
if _extra:
    ALLOWED_ORIGINS += [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",  # covers all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(applications_router, prefix="/api/applications", tags=["Applications"])
app.include_router(founders_router,     prefix="/api/founders",     tags=["Founders"])
app.include_router(scoring_router,      prefix="/api/scoring",      tags=["Scoring"])
app.include_router(memo_router,         prefix="/api/memo",         tags=["Memo"])
app.include_router(thesis_router,       prefix="/api/thesis",       tags=["Thesis"])
app.include_router(sourcing_router,     prefix="/api/sourcing",     tags=["Sourcing"])
app.include_router(search_router,       prefix="/api/search",       tags=["Search"])
app.include_router(messages_router,     prefix="/api/messages",     tags=["Messages"])
app.include_router(collab_router,       prefix="/api/collab",       tags=["Collab"])
app.include_router(investors_router,    prefix="/api/investors",    tags=["Investors"])
app.include_router(kpis_router,         prefix="/api/kpis",         tags=["KPIs"])
app.include_router(profile_router,      prefix="/api/profile",      tags=["Profile"])
app.include_router(realtime_router)

@app.get("/api/health")
async def health():
    return {"status": "ok", "product": "Conviction VC Brain"}
