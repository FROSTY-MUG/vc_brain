# =============================================
# VC Brain — Sourcing Routes (Outbound)
# =============================================
from fastapi import APIRouter

router = APIRouter()

@router.get("/outbound/signals")
async def get_outbound_signals():
    """Get discovered outbound signals from GitHub, arXiv, Product Hunt, etc."""
    # In production: queries the outbound_signals table
    return {"signals": [], "total": 0}

@router.post("/outbound/scan")
async def trigger_outbound_scan(data: dict):
    """Trigger an outbound scan for a specific source."""
    source = data.get("source", "github")
    return {
        "status": "scanning",
        "source": source,
        "message": f"Outbound scan initiated for {source}. Results will appear in the Sourcing Terminal.",
    }

@router.post("/outreach/draft")
async def create_outreach_draft(data: dict):
    """Create a draft outreach message for a discovered founder."""
    founder_name = data.get("founder_name", "Founder")
    signal = data.get("signal_context", "")
    
    draft = (
        f"Hi {founder_name},\n\n"
        f"I came across your work ({signal}) and was impressed by what you're building. "
        f"We're actively investing in this space and would love to learn more about your plans.\n\n"
        f"Would you be open to a 15-minute conversation?\n\n"
        f"Best,\nSarah Chen\nConviction VC"
    )
    
    return {"draft": draft, "founder_name": founder_name, "status": "drafted"}
