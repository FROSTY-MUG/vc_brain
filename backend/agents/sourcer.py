# =============================================
# VC Brain — Agent 2: Web Research (Sourcer) Agent
# =============================================
# Fetches real-world data from GitHub, ProductHunt,
# and web search (Tavily) to avoid synthetic data.
# =============================================
import os
import json
import urllib.request
import urllib.parse
from openai import OpenAI
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy"))
tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY", "dummy"))

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
PRODUCTHUNT_CLIENT_ID = os.getenv("PRODUCTHUNT_CLIENT_ID")
PRODUCTHUNT_CLIENT_SECRET = os.getenv("PRODUCTHUNT_CLIENT_SECRET")
APIFY_DEVPOST_WEBHOOK = os.getenv("APIFY_DEVPOST_WEBHOOK")
X_BEARER_TOKEN = os.getenv("X_BEARER_TOKEN")
PHANTOMBUSTER_API_KEY = os.getenv("PHANTOMBUSTER_API_KEY")

def _fetch_github_user(username: str) -> str:
    """Fetch real user data and repos from GitHub API."""
    if not GITHUB_TOKEN or not username:
        return ""
    try:
        url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=3"
        req = urllib.request.Request(url, headers={
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "VCBrain-Agent"
        })
        with urllib.request.urlopen(req, timeout=10) as response:
            repos = json.loads(response.read().decode())
            parsed_repos = [{"name": r["name"], "description": r["description"], "url": r["html_url"], "stars": r["stargazers_count"]} for r in repos]
            return json.dumps(parsed_repos)
    except Exception as e:
        print(f"GitHub API fetch failed for {username}: {e}")
        return ""

def _fetch_producthunt_data(query: str) -> str:
    """Fetch real product hunt data using client token. (Simplified OAuth to Client Credentials)"""
    if not PRODUCTHUNT_CLIENT_ID or not PRODUCTHUNT_CLIENT_SECRET:
        return ""
    try:
        # Step 1: Get Access Token
        token_url = "https://api.producthunt.com/v2/oauth/token"
        data = urllib.parse.urlencode({
            "client_id": PRODUCTHUNT_CLIENT_ID,
            "client_secret": PRODUCTHUNT_CLIENT_SECRET,
            "grant_type": "client_credentials"
        }).encode()
        req = urllib.request.Request(token_url, data=data)
        with urllib.request.urlopen(req, timeout=10) as response:
            token_data = json.loads(response.read().decode())
            access_token = token_data.get("access_token")

        if not access_token: return ""

        # Step 2: Query GraphQL
        gql_url = "https://api.producthunt.com/v2/api/graphql"
        query_payload = {
            "query": """
            query {
                posts(first: 3, order: RANKING) {
                    edges {
                        node {
                            name
                            tagline
                            url
                            votesCount
                        }
                    }
                }
            }
            """
        }
        req_gql = urllib.request.Request(gql_url, data=json.dumps(query_payload).encode(), headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        })
        with urllib.request.urlopen(req_gql, timeout=10) as response:
            ph_data = json.loads(response.read().decode())
            return json.dumps(ph_data.get("data", {}).get("posts", {}))
    except Exception as e:
        print(f"ProductHunt fetch failed: {e}")
        return ""

def _fetch_twitter_data(query: str) -> str:
    """Fetch real Twitter data using X API v2 Bearer Token."""
    if not X_BEARER_TOKEN or not query:
        return ""
    try:
        # Simple recent search: only allowed keywords (avoiding complex operators for basic fetch)
        safe_query = urllib.parse.quote(query)
        url = f"https://api.twitter.com/2/tweets/search/recent?query={safe_query}&max_results=10&tweet.fields=created_at,public_metrics"
        req = urllib.request.Request(url, headers={
            "Authorization": f"Bearer {X_BEARER_TOKEN}",
            "User-Agent": "VCBrain-Agent"
        })
        with urllib.request.urlopen(req, timeout=10) as response:
            tw_data = json.loads(response.read().decode())
            return json.dumps(tw_data.get("data", []))
    except Exception as e:
        print(f"Twitter API fetch failed for {query}: {e}")
        return ""

def _fetch_linkedin_data_pb(profile_url: str) -> str:
    """Fetch LinkedIn profile data using PhantomBuster API."""
    if not PHANTOMBUSTER_API_KEY or not profile_url:
        return ""
    try:
        # NOTE: To fully launch a phantom, we need an agent ID. 
        # This is a generic API call structure for PhantomBuster.
        url = "https://api.phantombuster.com/api/v2/agents/launch"
        # Using a dummy agent ID for structural purposes since one wasn't provided
        payload = {
            "id": os.getenv("PHANTOMBUSTER_AGENT_ID", "default_linkedin_agent_id"),
            "argument": {"profileUrl": profile_url}
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={
            "X-Phantombuster-Key-1": PHANTOMBUSTER_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json"
        })
        with urllib.request.urlopen(req, timeout=10) as response:
            pb_data = json.loads(response.read().decode())
            return json.dumps(pb_data)
    except Exception as e:
        print(f"PhantomBuster API fetch failed: {e}")
        return ""

def _run_search(query: str) -> str:
    """Helper to run a Tavily search for LinkedIn/Twitter scraping."""
    try:
        response = tavily_client.search(
            query=query,
            search_depth="advanced",
            max_results=3,
            include_raw_content=True
        )
        
        results_text = []
        for r in response.get("results", []):
            content = r.get("raw_content") or r.get("content") or ""
            content = content[:1500]
            results_text.append(f"URL: {r.get('url')}\nTitle: {r.get('title')}\nContent: {content}")
            
        return "\n\n---\n\n".join(results_text)
    except Exception as e:
        print(f"Tavily search failed for query '{query}': {e}")
        return ""

def conduct_web_research(company_name: str, founders: list) -> dict:
    """Runs strict real-world data collection."""
    raw_search_data = {}
    
    # Real data from ProductHunt (Global top recent posts as market signal, or specific if we used search)
    raw_search_data["producthunt_market_signals"] = _fetch_producthunt_data(company_name)
    
    # Web search for specific company news/hackathons
    raw_search_data["company_news"] = _run_search(f"{company_name} startup news funding site:techcrunch.com OR site:bloomberg.com")
    raw_search_data["company_hackathon"] = _run_search(f"{company_name} devpost hackathon winner")
    
    # Founder searches
    founder_data = []
    for founder in founders:
        name = founder.get("name", "")
        if not name:
            continue
            
        # If we can guess github username from name (very naive, usually we'd search first)
        # We will use Tavily to find the github URL, then extract username
        gh_search = _run_search(f"{name} {company_name} github profile")
        
        # Naive username guess for API fetching
        gh_username = name.replace(" ", "").lower()
        real_gh_data = _fetch_github_user(gh_username)
        
        # For demo purposes, we guess a linkedin URL. In reality, it would be passed or searched.
        guessed_li_url = f"https://www.linkedin.com/in/{gh_username}"
        li_data = _fetch_linkedin_data_pb(guessed_li_url)
        
        # Fallback to web search if PB fails or needs more context
        if not li_data:
            li_data = _run_search(f"{name} {company_name} linkedin experience posts site:linkedin.com/in/")
            
        tw_data = _fetch_twitter_data(f"{name} {company_name}")
        
        founder_data.append({
            "name": name,
            "real_github_api_data": real_gh_data,
            "raw_github_search": gh_search,
            "raw_linkedin": li_data,
            "raw_twitter": tw_data
        })

    # Use GPT-4o to structure the strictly real data
    STRUCTURING_PROMPT = """You are an AI analyst. You are given REAL RAW web search and API results about a startup and its founders.
    Extract and structure the relevant information. DO NOT hallucinate. Use ONLY the provided data.
    
    For the company, extract:
    - news_summary: brief summary of any news
    - hackathon_wins: details of any hackathon wins
    - news_links: list of URLs to the news articles
    - producthunt_signals: any relevant product hunt data
    
    For each founder, extract:
    - name: their name
    - linkedin_summary: summary of their experience and background
    - linkedin_posts: list of any posts or articles they've written, with URLs
    - github_repos: list of repositories with names, descriptions, and URLs (Prioritize real_github_api_data)
    - twitter_data: summary of their twitter presence or notable tweets
    
    Output strictly as JSON matching this schema:
    {
      "company_research": {
         "news_summary": "...",
         "hackathon_wins": "...",
         "news_links": ["url1"],
         "producthunt_signals": "..."
      },
      "founders_research": [
         {
            "name": "...",
            "linkedin_summary": "...",
            "linkedin_posts": [{"content": "...", "url": "..."}],
            "github_repos": [{"name": "...", "description": "...", "url": "...", "stars": 0}],
            "twitter_data": "..."
         }
      ]
    }
    """
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": STRUCTURING_PROMPT},
            {"role": "user", "content": f"Company Name: {company_name}\n\nCompany Data:\n{json.dumps(raw_search_data)[:20000]}\n\nFounder Data:\n{json.dumps(founder_data)[:40000]}"}
        ],
        temperature=0.0,
        response_format={"type": "json_object"}
    )
    
    result_text = response.choices[0].message.content
    try:
        return json.loads(result_text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse research data", "raw": result_text}

def research_founders_and_company(founders: list, company_name: str) -> dict:
    """Wrapper function to match imports and parameter ordering in pipeline.py."""
    return conduct_web_research(company_name, founders)
