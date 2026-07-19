from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Form
from typing import Optional
from utils.pdf_parser import extract_text_from_pdf_bytes
from agents.pipeline import run_application_pipeline
import db

router = APIRouter()

# In-memory store for hackathon demo jobs status only
_jobs = {} # store background jobs state

def process_application_background(app_id: str, raw_text: str):
    """Runs the LangGraph pipeline in the background."""
    try:
        _jobs[app_id] = "Running LLM extraction..."
        print(f"[{app_id}] Starting LangGraph pipeline")
        
        # This will call GPT-4o and Tavily, and write to DB
        result = run_application_pipeline(raw_text, app_id)
        
        _jobs[app_id] = "Completed"
        print(f"[{app_id}] Pipeline completed")
    except Exception as e:
        print(f"[{app_id}] Pipeline failed: {e}")
        _jobs[app_id] = f"Error: {str(e)}"
        db.update_application_status(app_id, "failed")


@router.post("/upload")
async def upload_application(
    background_tasks: BackgroundTasks,
    company_name: str = Form(...),
    deck: UploadFile = File(...),
):
    """
    Inbound application endpoint.
    Accepts a real PDF, extracts text via PyMuPDF, and triggers the LangGraph agent pipeline.
    """
    # Extract PDF text synchronously to fail fast if broken
    pdf_bytes = await deck.read()
    raw_text = extract_text_from_pdf_bytes(pdf_bytes)
    
    # Write to Supabase to get an ID
    startup = db.insert_startup(company_name)
    startup_id = startup.get("id")
    
    # We create a placeholder founder, the extraction will enrich it later
    # For now just use the startup name as a placeholder founder name
    founder = db.insert_founder(f"Founder of {company_name}")
    founder_id = founder.get("id")
    
    db.link_founder_startup(founder_id, startup_id)
    
    application = db.insert_application(startup_id, source_type="inbound", raw_text=raw_text[:5000], deck_url=deck.filename)
    app_id = application.get("id")
    
    _jobs[app_id] = "Pending"
    
    # Run the expensive LangGraph extraction & search in the background
    background_tasks.add_task(process_application_background, app_id, raw_text)
    
    return {
        "status": "accepted",
        "application_id": app_id,
        "message": f"Application received. AI Agents are now extracting and validating claims.",
    }


@router.get("/{app_id}")
async def fetch_application(app_id: str):
    app = db.get_application(app_id)
    if app:
        return {"application": app, "job_status": _jobs.get(app_id)}
    return {"error": "Application not found"}


@router.get("/")
async def list_applications():
    return db.get_all_applications()
