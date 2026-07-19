from fastapi import APIRouter
from pydantic import BaseModel
import db

router = APIRouter()

class SendMessagePayload(BaseModel):
    sender_email: str
    recipient_email: str
    content: str

@router.get("/users")
def list_users():
    return db.get_all_users()

@router.get("/conversations/{user_email}")
def list_conversations(user_email: str):
    return db.get_conversations(user_email)

@router.get("/conversation/{user_email}/{other_email}")
def get_conversation(user_email: str, other_email: str):
    return db.get_conversation_messages(user_email, other_email)

@router.post("/send")
def send_message(payload: SendMessagePayload):
    return db.insert_conversation_message(payload.sender_email, payload.recipient_email, payload.content)

@router.get("/unread/{user_email}")
def get_unread(user_email: str):
    # Just a stub for now, as we haven't implemented full read receipts in the helpers
    # but we could filter messages sent to user_email where read=False
    return {"count": 0}
