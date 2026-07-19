# =============================================
# VC Brain — FastAPI Backend Entry Point
# =============================================
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

app = FastAPI(
    title="VC Brain API",
    description="Conviction — The VC Operating System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://vc-brain-seven.vercel.app",
        "https://vc-brain.vercel.app",
        "https://vc-brain-backend-production-0edd.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(applications_router, prefix="/py-api/applications", tags=["Applications"])
app.include_router(founders_router,     prefix="/py-api/founders",     tags=["Founders"])
app.include_router(scoring_router,      prefix="/py-api/scoring",      tags=["Scoring"])
app.include_router(memo_router,         prefix="/py-api/memo",         tags=["Memo"])
app.include_router(thesis_router,       prefix="/py-api/thesis",       tags=["Thesis"])
app.include_router(sourcing_router,     prefix="/py-api/sourcing",     tags=["Sourcing"])
app.include_router(search_router,       prefix="/py-api/search",       tags=["Search"])
app.include_router(messages_router,     prefix="/py-api/messages",     tags=["Messages"])
app.include_router(collab_router,       prefix="/py-api/collab",       tags=["Collab"])
app.include_router(investors_router,    prefix="/py-api/investors",    tags=["Investors"])
app.include_router(kpis_router,         prefix="/py-api/kpis",         tags=["KPIs"])
app.include_router(profile_router,      prefix="/py-api/profile",      tags=["Profile"])
app.include_router(realtime_router)

@app.get("/py-api/health")
async def health():
    return {"status": "ok", "product": "Conviction VC Brain"}
