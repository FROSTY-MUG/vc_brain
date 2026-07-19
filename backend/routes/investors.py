from fastapi import APIRouter
import db

router = APIRouter()

@router.get("/")
async def get_investors():
    return db.get_all_investors()
