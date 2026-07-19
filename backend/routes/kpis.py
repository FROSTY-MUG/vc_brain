from fastapi import APIRouter
from datetime import datetime, timedelta
import db

router = APIRouter()

@router.get("/")
def get_kpis():
    apps = db.get_all_applications()
    founders = db.get_all_founders()
    signals = db.get_all_outbound_signals()
    
    # 1. Applications this week
    now = datetime.utcnow()
    one_week_ago = now - timedelta(days=7)
    one_month_ago = now - timedelta(days=30)
    
    apps_this_week = 0
    diligence_count = 0
    market_scores = []
    
    for app in apps:
        if app.get("submitted_at"):
            try:
                sub_date = datetime.fromisoformat(app["submitted_at"])
                if sub_date >= one_week_ago:
                    apps_this_week += 1
            except Exception:
                pass
        
        if app.get("status") == "diligence":
            diligence_count += 1
            
        opp_scores = db.get_scores_for_app(app["id"]) if isinstance(app, dict) else {}
        if opp_scores and opp_scores.get("market_score"):
            market_scores.append(opp_scores["market_score"])
            
    # 2. Avg founder score
    founder_scores = []
    for f in founders:
        scores = f.get("founder_scores", [])
        if scores and len(scores) > 0 and scores[0].get("overall_score"):
            founder_scores.append(scores[0]["overall_score"])
            
    avg_founder = sum(founder_scores) / len(founder_scores) if founder_scores else 0
    avg_market = sum(market_scores) / len(market_scores) if market_scores else 0
    
    # 3. Sourced this month
    sourced_this_month = 0
    for sig in signals:
        if sig.get("discovered_at"):
            try:
                disc_date = datetime.fromisoformat(sig["discovered_at"])
                if disc_date >= one_month_ago:
                    sourced_this_month += 1
            except Exception:
                pass
                
    kpis = [
        {"id": "k1", "label": "Applications This Week", "value": str(apps_this_week), "delta": "", "deltaDir": "flat", "sub": "vs last week", "color": "text-amber-400"},
        {"id": "k2", "label": "Avg Founder Score", "value": f"{int(avg_founder)}/100", "delta": "", "deltaDir": "flat", "sub": "across all apps", "color": "text-blue-400"},
        {"id": "k3", "label": "Avg Market Score", "value": f"{int(avg_market)}/100", "delta": "", "deltaDir": "flat", "sub": "trending", "color": "text-green-400"},
        {"id": "k5", "label": "Diligence Pipeline", "value": str(diligence_count), "delta": "", "deltaDir": "flat", "sub": "active deals", "color": "text-cyan-400"},
        {"id": "k6", "label": "Sourced This Month", "value": str(sourced_this_month), "delta": "", "deltaDir": "flat", "sub": "outbound signals", "color": "text-emerald-400"},
    ]
    return kpis
