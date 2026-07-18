# =============================================
# VC Brain — Thesis Routes
# =============================================
from fastapi import APIRouter
from models import ThesisCreate

router = APIRouter()

# In-memory store for hackathon
_theses = {}

@router.post("/")
async def create_thesis(thesis: ThesisCreate):
    """Create or update an investor's thesis configuration."""
    thesis_id = f"thesis_{len(_theses) + 1:03d}"
    _theses[thesis_id] = {"id": thesis_id, **thesis.model_dump()}
    return _theses[thesis_id]

@router.get("/{thesis_id}")
async def get_thesis(thesis_id: str):
    if thesis_id in _theses:
        return _theses[thesis_id]
    return {"error": "Thesis not found"}

@router.get("/")
async def list_theses():
    return list(_theses.values())
