from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import db

router = APIRouter()

class ProfileUpdate(BaseModel):
    email: str
    name: str
    avatar_url: str = ""
    role: str = "investor"
    onboarded: bool = True

@router.get("/{email}")
def get_user_profile(email: str):
    user = db.get_user_by_email(email)
    if not user:
        return {"onboarded": False, "role": "investor"}
    return user

@router.post("/")
def update_user_profile(data: ProfileUpdate):
    user = db.upsert_user(
        email=data.email,
        name=data.name,
        avatar_url=data.avatar_url,
        role=data.role,
        onboarded=data.onboarded
    )
    return {"status": "success", "user": user}

@router.get("/search/")
def search_users(q: str = ""):
    users = db.get_all_users()
    if q:
        q_lower = q.lower()
        users = [
            u for u in users 
            if q_lower in u.get("name", "").lower() or q_lower in u.get("email", "").lower()
        ]
    return users
