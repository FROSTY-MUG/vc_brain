# =============================================
# VC Brain — Founder Routes
# =============================================
from fastapi import APIRouter
from models import FounderCreate

router = APIRouter()

@router.get("/")
async def list_founders():
    """List all founders in the system."""
    # Return demo data — in production this queries PostgreSQL
    return {"founders": [], "total": 0}

@router.get("/{founder_id}")
async def get_founder(founder_id: str):
    """Get a founder's full profile including persistent score and history."""
    return {"founder_id": founder_id, "message": "Founder profile endpoint"}

@router.post("/")
async def create_founder(founder: FounderCreate):
    """Register a new founder in the system."""
    return {"status": "created", "founder": founder.model_dump()}

@router.get("/{founder_id}/score")
async def get_founder_score(founder_id: str):
    """Get the persistent Founder Score (never resets across companies)."""
    return {"founder_id": founder_id, "message": "Founder score endpoint"}
