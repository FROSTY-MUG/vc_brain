import os
from openai import OpenAI

def get_llm_client() -> OpenAI:
    """
    Returns an OpenAI client. 
    Falls back to a local Ollama instance if the API key is missing or set to 'dummy'.
    """
    api_key = os.getenv("OPENAI_API_KEY", "dummy")
    if api_key == "dummy" or not api_key:
        return OpenAI(
            base_url="http://localhost:11434/v1",
            api_key="ollama" # required but unused by Ollama
        )
    return OpenAI(api_key=api_key)

def get_langchain_llm(temperature=0):
    """
    Returns a LangChain ChatOpenAI instance.
    Falls back to Ollama if the API key is missing or set to 'dummy'.
    """
    from langchain_openai import ChatOpenAI
    
    api_key = os.getenv("OPENAI_API_KEY", "dummy")
    if api_key == "dummy" or not api_key:
        return ChatOpenAI(
            base_url="http://localhost:11434/v1",
            api_key="ollama",
            model="qwen2.5",
            temperature=temperature
        )
    return ChatOpenAI(model="gpt-4o", temperature=temperature, api_key=api_key)

def get_model_name(default_model="gpt-4o") -> str:
    """
    Returns the appropriate model name depending on the backend in use.
    If using Ollama fallback, it forces the qwen2.5 model.
    """
    api_key = os.getenv("OPENAI_API_KEY", "dummy")
    if api_key == "dummy" or not api_key:
        return "qwen2.5"
    return default_model
