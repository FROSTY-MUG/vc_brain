from fastapi import APIRouter, HTTPException
import db
from agents.memo_writer import generate_memo

router = APIRouter()

@router.get("/{app_id}")
def get_memo(app_id: str):
    return db.get_memo_for_app(app_id)

@router.post("/generate/{app_id}")
def generate_memo_on_demand(app_id: str):
    app = db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    scores = db.get_scores_for_app(app_id)
    claims = db.get_claims_for_app(app_id)
    startup = app.get("startups", {}) or {}

    memo = generate_memo(
        extraction={"company_name": startup.get("name"), "startup_info": startup, "claims": claims},
        research={},
        validation=claims,
        screening=scores
    )

    rec = memo.get("recommendation", {})
    rec_action = rec.get("action", "diligence") if isinstance(rec, dict) else "diligence"
    result = db.insert_memo(app_id, memo, rec_action)
    return {"message": "Memo generated successfully", "memo": result}
