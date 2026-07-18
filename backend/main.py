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

app = FastAPI(
    title="VC Brain API",
    description="Conviction — The VC Operating System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

@app.get("/api/health")
async def health():
    return {"status": "ok", "product": "Conviction VC Brain"}
