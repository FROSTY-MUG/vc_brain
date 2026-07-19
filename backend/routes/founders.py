from fastapi import APIRouter, HTTPException
import db

router = APIRouter()

@router.get("/")
def list_founders():
    return db.get_all_founders()

@router.get("/{founder_id}")
def get_founder(founder_id: str):
    return db.get_founder(founder_id)

# ── User Profile Routes ──
@router.get("/profile/{email}")
def get_user_profile(email: str):
    user = db.get_user_by_email(email)
    if not user:
        return {"onboarded": False, "role": "investor"}
    return user

@router.post("/onboard")
def onboard_user(data: dict):
    email = data.get("email")
    name = data.get("name", "User")
    avatar_url = data.get("avatar_url", "")
    role = data.get("role", "investor")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    user = db.upsert_user(email, name, avatar_url, role, onboarded=True)
    
    # If founder, auto-provision a founder row associated with their email
    if role == "founder":
        existing_founders = [f for f in db.get_all_founders() if f.get("email") == email]
        if not existing_founders:
            db.insert_founder(name=name, email=email)
            
    return user

@router.post("/founder-project")
def update_founder_project(data: dict):
    email = data.get("email")
    company_name = data.get("company_name")
    bio = data.get("bio", "")
    location = data.get("location", "")
    website = data.get("website", "")
    sector = data.get("sector", "")
    stage = data.get("stage", "")
    geography = data.get("geography", "")
    
    if not email or not company_name:
        raise HTTPException(status_code=400, detail="Email and Company Name are required")
        
    # Get founder profile
    founders = [f for f in db.get_all_founders() if f.get("email") == email]
    if not founders:
        raise HTTPException(status_code=404, detail="Founder profile not found")
        
    founder = founders[0]
    founder_id = founder["id"]
    
    # Update founder bio and location in-memory or in Supabase
    if db._use_in_memory:
        for f in db._in_memory_db["founders"]:
            if f["id"] == founder_id:
                f["bio"] = bio
                f["location"] = location
                break
    else:
        sb = db.get_supabase()
        sb.table("founders").update({
            "bio": bio,
            "location": location
        }).eq("id", founder_id).execute()
    
    # Create or update startup
    startup = db.insert_startup(company_name, website, sector, stage, geography)
    if startup and "id" in startup:
        db.link_founder_startup(founder_id, startup["id"])
        
    return {"status": "success", "founder_id": founder_id}


# ── Sourcing Details / Citation Route ──
@router.get("/pitch-citations/{app_id}")
def get_pitch_citations(app_id: str):
    """
    Synthesizes and returns detail for why to invest, how much to invest,
    and structured citations (GitHub, LinkedIn, Twitter/X, Devpost etc.) for an app.
    """
    app = db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    claims = db.get_claims_for_app(app_id)
    scores = db.get_scores_for_app(app_id)
    
    # Analyze and formulate a detailed investment rationale
    why_invest = "Highly technical team showing early velocity. Web footprint validates open source alignment and active developer shipping trend."
    if scores:
        why_invest = f"Opportunity shows a strong {scores.get('founder_score', 0)} founder axis score and {scores.get('thesis_alignment', 0)}% thesis alignment. The team exhibits high domain expertise and rapid prototyping capabilities."
        
    suggested_amount = 100000
    if scores and scores.get("thesis_alignment", 0) > 80:
        suggested_amount = 150000
    elif scores and scores.get("thesis_alignment", 0) < 50:
        suggested_amount = 50000
        
    citations = []
    # Convert web research JSON dump to readable citation logs
    web_res = {}
    import json
    try:
        if app.get("source_detail"):
            web_res = json.loads(app["source_detail"])
    except:
        pass
        
    for key, val in web_res.items():
        if isinstance(val, dict):
            for source, content in val.items():
                if content:
                    citations.append({
                        "platform": source,
                        "reference": key,
                        "snippet": str(content)[:300]
                    })
                    
    return {
        "why_invest": why_invest,
        "suggested_amount": suggested_amount,
        "citations": citations
    }

# ── Messaging / Pitches Routes ──
@router.post("/pitch/send")
def send_funding_pitch(data: dict):
    email = data.get("email") # founder email
    investor_id = data.get("investor_id") # target investor user id
    message = data.get("message")
    
    if not email or not investor_id or not message:
        raise HTTPException(status_code=400, detail="Missing required parameters")
        
    founders = [f for f in db.get_all_founders() if f.get("email") == email]
    if not founders:
        raise HTTPException(status_code=404, detail="Founder not found")
        
    founder_id = founders[0]["id"]
    return db.insert_pitch(founder_id, investor_id, message)

@router.get("/pitch/investor/{investor_id}")
def fetch_investor_pitches(investor_id: str):
    return db.get_pitches_for_investor(investor_id)

@router.post("/pitch/respond")
def respond_to_pitch(data: dict):
    pitch_id = data.get("pitch_id")
    action = data.get("action") # 'accept' or 'deny'
    
    if not pitch_id or not action:
        raise HTTPException(status_code=400, detail="Missing pitch_id or action")
        
    status = "replied" if action == "accept" else "bounced"
    return db.update_pitch_status(pitch_id, status)
