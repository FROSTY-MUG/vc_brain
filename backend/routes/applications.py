# =============================================
# VC Brain — Application Routes (LangGraph)
# =============================================
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks
from typing import Optional
from utils.pdf_parser import extract_text_from_pdf_bytes
from agents.pipeline import run_application_pipeline
import asyncio

router = APIRouter()

# In-memory store for hackathon demo
_applications = {}
_jobs = {} # store background jobs state

def process_application_background(app_id: str, raw_text: str):
    """Runs the LangGraph pipeline in the background."""
    try:
        _jobs[app_id] = "Running LLM extraction..."
        print(f"[{app_id}] Starting LangGraph pipeline")
        
        # This will call GPT-4o and Tavily
        result = run_application_pipeline(raw_text)
        
        # Update application state
        app = _applications.get(app_id)
        if app:
            app["status"] = "diligence"
            app["extracted_claims"] = result.get("extracted_claims", [])
            app["web_research"] = result.get("web_research", {})
            app["validated_claims"] = result.get("validated_claims", [])
            app["startup_info"] = result.get("startup_info", {})
            app["founders"] = result.get("founders", [])
            
        _jobs[app_id] = "Completed"
        print(f"[{app_id}] Pipeline completed")
    except Exception as e:
        print(f"[{app_id}] Pipeline failed: {e}")
        _jobs[app_id] = f"Error: {str(e)}"
        if app_id in _applications:
             _applications[app_id]["status"] = "failed"


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
    app_id = f"app_{len(_applications) + 1:03d}"
    
    # Extract PDF text synchronously to fail fast if broken
    pdf_bytes = await deck.read()
    raw_text = extract_text_from_pdf_bytes(pdf_bytes)
    
    application = {
        "id": app_id,
        "company_name": company_name,
        "deck_filename": deck.filename,
        "status": "screening",
        "source_type": "inbound",
        "raw_text": raw_text[:5000] # Store preview
    }
    _applications[app_id] = application
    _jobs[app_id] = "Pending"
    
    # Run the expensive LangGraph extraction & search in the background
    background_tasks.add_task(process_application_background, app_id, raw_text)
    
    return {
        "status": "accepted",
        "application_id": app_id,
        "message": f"Application received. AI Agents are now extracting and validating claims.",
    }


@router.get("/{app_id}")
async def get_application(app_id: str):
    app = _applications.get(app_id)
    if app:
        return {"application": app, "job_status": _jobs.get(app_id)}
    return {"error": "Application not found"}


@router.get("/")
async def list_applications():
    return list(_applications.values())
