from fastapi import APIRouter, HTTPException
import db
from agents.memo_writer import generate_memo

router = APIRouter()

@router.get("/{app_id}")
def get_memo(app_id: str):
    return db.get_memo_for_app(app_id)

@router.post("/generate/{app_id}")
def generate_memo_on_demand(app_id: str):
    # Fetch all data needed for the memo
    app = db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    scores = db.get_scores_for_app(app_id)
    claims = db.get_claims_for_app(app_id)
    
    # Normally we would fetch the raw research and extraction data, 
    # but since the pipeline runs automatically on upload, the memo 
    # might already be generated, or we can use the stored claims and scores.
    # For this hackathon, we will trigger the memo agent with the stored data.
    
    memo = generate_memo(
        extraction={"claims": claims},
        research={}, # Simplified for on-demand
        validation={}, 
        screening=scores
    )
    
    # Save memo
    result = db.insert_memo(app_id, memo, memo.get("recommendation", "diligence"))
    return {"message": "Memo generated successfully", "memo": result}
