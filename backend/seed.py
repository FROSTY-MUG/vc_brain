import db
import uuid
from datetime import datetime

def seed():
    print("Seeding in-memory DB...")
    app_id = str(uuid.uuid4())
    startup = db.insert_startup("Electron AI", "https://electron.ai", "AI Infrastructure", "Seed", "Berlin")
    founder = db.insert_founder("Alex Rivera", "alex@electron.ai", "https://linkedin.com/in/alex-rivera-ai", "https://github.com/alexrivera")
    db.link_founder_startup(founder["id"], startup["id"], "founder")
    
    app = db.insert_application(startup["id"], "inbound", "Electron AI is building the next generation of AI infrastructure.", "https://pitchdeck.com/electron-ai")
    db.update_application_status(app["id"], "completed")
    
    # Add opportunity score
    db._in_memory_db["opportunity_scores"].append({
        "id": str(uuid.uuid4()),
        "application_id": app["id"],
        "founder_score": 85,
        "market_score": 90,
        "idea_score": 75,
        "recommendation": "deploy",
        "confidence": 0.88,
        "reasoning": "Strong founder background with deep domain expertise. Market is growing rapidly."
    })
    
    # Add memo
    db._in_memory_db["memos"].append({
        "id": str(uuid.uuid4()),
        "application_id": app["id"],
        "content_json": {
            "company_name": "Electron AI",
            "sector": "AI Infrastructure",
            "one_liner": "Next-generation distributed training infrastructure for large language models.",
            "team_and_history": {
                "statement": "Alex Rivera has a strong track record, having previously scaled ML infrastructure at Google.",
                "factors": ["Ex-Google ML Engineer", "Strong GitHub activity"],
                "conflicts": []
            },
            "product_and_traction": {
                "statement": "Early prototype shows 3x faster training times compared to baseline.",
                "factors": ["Tested on 100B parameter model", "Open-source codebase gaining traction"],
                "conflicts": []
            },
            "market_and_competition": {
                "statement": "The AI infrastructure market is highly competitive but expanding rapidly.",
                "factors": ["Market growing at 40% CAGR"],
                "conflicts": ["Several well-funded competitors exist"]
            },
            "recommendation": {
                "action": "deploy",
                "confidence": "HIGH",
                "reasoning": "Strong technical founder building in a critical infrastructure layer with validated early performance metrics.",
                "open_questions": ["What is the go-to-market strategy?", "How will they defend against incumbent cloud providers?"]
            },
            "swot": {
                "strengths": [
                    {"statement": "Elite technical founder", "factors": ["Ex-Google", "Deep ML expertise"], "conflicts": []},
                    {"statement": "Demonstrated 3x performance improvement", "factors": ["Benchmark results verified"], "conflicts": []}
                ],
                "weaknesses": [
                    {"statement": "Solo founder", "factors": ["No commercial co-founder yet"], "conflicts": []}
                ],
                "opportunities": [
                    {"statement": "Explosive growth in LLM training demand", "factors": ["Every enterprise is training models"], "conflicts": []}
                ],
                "threats": [
                    {"statement": "Hyperscalers building proprietary solutions", "factors": ["AWS, GCP, Azure investing heavily"], "conflicts": []}
                ]
            }
        },
        "created_at": datetime.utcnow().isoformat()
    })
    print("Seed complete.")

if __name__ == "__main__":
    seed()
