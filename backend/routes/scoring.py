from fastapi import APIRouter
import db

router = APIRouter()

@router.get("/{app_id}")
def get_scores(app_id: str):
    return db.get_scores_for_app(app_id)
