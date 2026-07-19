# =============================================
# VC Brain — Backend Configuration
# =============================================
# Central place to choose which LLM backend powers the whole app.
#
# Options for LLM_PROVIDER:
#   "openai" — GPT-4o via OPENAI_API_KEY (best quality, costs credits)
#   "ollama" — local Ollama (qwen2.5) at http://localhost:11434 (free, needs `ollama run qwen2.5`)
#   "mock"   — no LLM at all; deterministic canned answers (offline demo / frontend dev)
#   "auto"   — use openai if a real OPENAI_API_KEY is set, otherwise ollama
#
# Set it here, or override via LLM_PROVIDER in backend/.env (env var wins).
import os
from dotenv import load_dotenv

load_dotenv()

DEFAULT_PROVIDER = "auto"

_VALID = ("openai", "ollama", "mock", "auto")


def get_provider() -> str:
    """Resolve the active provider to 'openai', 'ollama', or 'mock'."""
    choice = os.getenv("LLM_PROVIDER", "").strip().lower() or DEFAULT_PROVIDER
    if choice not in _VALID:
        print(f"[config] Unknown LLM_PROVIDER '{choice}', falling back to 'auto'")
        choice = "auto"
    if choice == "auto":
        api_key = os.getenv("OPENAI_API_KEY", "")
        return "openai" if api_key and api_key != "dummy" else "ollama"
    return choice
