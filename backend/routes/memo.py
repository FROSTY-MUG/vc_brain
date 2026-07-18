# =============================================
# VC Brain — Memo Routes
# =============================================
from fastapi import APIRouter
from services.memo import generate_memo

router = APIRouter()

@router.post("/generate")
async def generate_investment_memo(data: dict):
    """Generate a full evidence-backed investment memo."""
    memo = generate_memo(
        startup=data.get("startup", {}),
        founders=data.get("founders", []),
        founder_scores=data.get("founder_scores", []),
        claims=data.get("claims", []),
        opportunity_scores=data.get("opportunity_scores", {}),
        thesis=data.get("thesis"),
    )
    return memo
