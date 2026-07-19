# =============================================
# VC Brain — Thesis Routes
# =============================================
from fastapi import APIRouter
from models import ThesisCreate

import db

router = APIRouter()

@router.post("/")
async def create_thesis(thesis: dict):
    """Create or update an investor's thesis configuration."""
    user_id = thesis.get("userId")
    if not user_id:
        return {"error": "userId is required"}
    
    # Remove userId from thesis data payload if you want, or just store it
    thesis_data = thesis.copy()
    
    return db.upsert_thesis(user_id, thesis_data)

@router.get("/{user_id}")
async def get_thesis(user_id: str):
    res = db.get_thesis_by_user(user_id)
    if res:
        return res
    return {"error": "Thesis not found"}
