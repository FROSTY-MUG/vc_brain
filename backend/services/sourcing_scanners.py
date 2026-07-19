# =============================================
# VC Brain — Outbound Sourcing Scanners
# =============================================
import os
import requests
import json
import xml.etree.ElementTree as ET
from urllib.parse import quote_plus
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# API Keys from env or direct defaults
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
PRODUCT_HUNT_TOKEN = os.getenv("PRODUCT_HUNT_TOKEN")
DEVPOST_APIFY_TOKEN = os.getenv("DEVPOST_APIFY_TOKEN")
ARXIV_QUERY_URL = "http://export.arxiv.org/api/query"
CRUNCHBASE_AUTOCOMPLETE_URL = "https://api.crunchbase.com/v4/data/autocompletes"

from openai import OpenAI
from tavily import TavilyClient
import base64

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy"))
tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY", "dummy"))

def scan_github(query: str = "llm-agent OR AI-infra") -> list:
    """
    Scans GitHub Search API for trending repositories in the domain.
    Utilizes GITHUB_TOKEN for authentication.
    Fetches READMEs and uses OpenAI to generate a concise project brief.
    """
    signals = []
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    # Calculate date 30 days ago
    date_str = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    full_query = f"{query} stars:>10 created:>{date_str}"
    url = f"https://api.github.com/search/repositories?q={quote_plus(full_query)}&sort=stars&order=desc&per_page=5"

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            for item in data.get("items", []):
                stars = item.get("stargazers_count", 0)
                strength = min(60 + stars / 50, 99.0)
                owner = item.get("owner", {}).get("login", "")
                repo_name = item.get("name", "")
                full_name = item.get("full_name", "")
                
                # Fetch README
                readme_url = f"https://api.github.com/repos/{owner}/{repo_name}/readme"
                readme_content = ""
                try:
                    r_resp = requests.get(readme_url, headers=headers, timeout=5)
                    if r_resp.status_code == 200:
                        encoded_content = r_resp.json().get("content", "")
                        if encoded_content:
                            readme_content = base64.b64decode(encoded_content).decode("utf-8", errors="ignore")[:2000]
                except Exception as e:
                    print(f"Failed to fetch README for {full_name}: {e}")

                base_desc = item.get("description") or "No description provided."
                
                # Generate Brief
                brief = base_desc
                if readme_content:
                    try:
                        llm_resp = openai_client.chat.completions.create(
                            model="gpt-4o-mini",
                            messages=[
                                {"role": "system", "content": "You are a tech analyst. Write a concise 2-sentence brief about this project based on its README and description. Do not use markdown."},
                                {"role": "user", "content": f"Description: {base_desc}\n\nREADME:\n{readme_content}"}
                            ],
                            max_tokens=80,
                            temperature=0.3
                        )
                        brief = llm_resp.choices[0].message.content.strip()
                    except Exception as e:
                        print(f"LLM brief generation failed for {full_name}: {e}")

                signals.append({
                    "source": "github",
                    "signal_type": "trending_repository",
                    "title": full_name,
                    "description": brief,
                    "url": item.get("html_url", ""),
                    "strength": round(strength, 1),
                    "founder_name": owner
                })
        else:
            print(f"GitHub API failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"GitHub scan error: {e}")
    return signals

def scan_arxiv(query: str = "all:electron") -> list:
    """
    Queries arXiv Search API, parses XML (Atom feed), and returns research paper signals.
    """
    signals = []
    # User's specified URL query structure
    url = f"{ARXIV_QUERY_URL}?search_query={quote_plus(query)}&start=0&max_results=10"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            # Parse XML
            root = ET.fromstring(response.content)
            # ElementTree namespaces
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            
            for entry in root.findall('atom:entry', ns):
                title_elem = entry.find('atom:title', ns)
                summary_elem = entry.find('atom:summary', ns)
                id_elem = entry.find('atom:id', ns)
                
                # Fetch first author as potential founder
                author_elem = entry.find('atom:author/atom:name', ns)
                author = author_elem.text if author_elem is not None else "Unknown Researcher"
                
                title = title_elem.text.strip() if title_elem is not None else "Untitled Paper"
                summary = summary_elem.text.strip().replace('\n', ' ') if summary_elem is not None else ""
                url_link = id_elem.text.strip() if id_elem is not None else ""
                
                if len(summary) > 200:
                    summary = summary[:200] + "..."
                    
                strength = 75.0 # arXiv base strength
                if "agent" in title.lower() or "llm" in title.lower():
                    strength += 10.0
                    
                signals.append({
                    "source": "arxiv",
                    "signal_type": "academic_breakthrough",
                    "title": title,
                    "description": summary,
                    "url": url_link,
                    "strength": min(strength, 99.0),
                    "founder_name": author
                })
    except Exception as e:
        print(f"arXiv scan error: {e}")
    return signals

def scan_product_hunt() -> list:
    """
    Scans Product Hunt GraphQL API v2 for daily product launches.
    Falls back to Tavily search if token is absent.
    """
    signals = []
    if PRODUCT_HUNT_TOKEN:
        url = "https://api.producthunt.com/v2/api/graphql"
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {PRODUCT_HUNT_TOKEN}"
        }
        # Fetch daily top launches
        gql_query = """
        query {
          posts(first: 5, order: VOTES) {
            edges {
              node {
                name
                tagline
                description
                votesCount
                website
                makers {
                  name
                }
              }
            }
          }
        }
        """
        try:
            response = requests.post(url, json={"query": gql_query}, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                posts = data.get("data", {}).get("posts", {}).get("edges", [])
                for post in posts:
                    node = post.get("node", {})
                    votes = node.get("votesCount", 0)
                    strength = min(50 + votes / 10, 99.0)
                    makers = node.get("makers", [])
                    maker_name = makers[0].get("name", "Unknown Maker") if makers else "Unknown Maker"
                    signals.append({
                        "source": "producthunt",
                        "signal_type": "product_launch",
                        "title": node.get("name", ""),
                        "description": f"{node.get('tagline', '')} - {node.get('description', '')}"[:250],
                        "url": node.get("website", ""),
                        "strength": round(strength, 1),
                        "founder_name": maker_name
                    })
                return signals
        except Exception as e:
            print(f"Product Hunt API Error: {e}")

    # Fallback to Tavily
    try:
        t_response = tavily_client.search(
            query="site:producthunt.com 'Product of the Day' 'AI' OR 'developer tools' launch",
            search_depth="advanced",
            max_results=3,
            include_raw_content=False
        )
        for r in t_response.get("results", []):
            url = r.get("url", "")
            title = r.get("title", "").split("|")[0].strip()
            content = r.get("content", "")[:250]
            signals.append({
                "source": "producthunt",
                "signal_type": "product_launch",
                "title": title,
                "description": content,
                "url": url,
                "strength": 85.0,
                "founder_name": "TBD Maker"
            })
    except Exception as e:
        print(f"Tavily PH Search failed: {e}")
        
    return signals

def scan_devpost() -> list:
    """
    Uses Tavily Search to locate real Devpost hackathon winners.
    """
    signals = []
    try:
        t_response = tavily_client.search(
            query="site:devpost.com/software 'winner' 'AI' OR 'LLM' OR 'agent'",
            search_depth="advanced",
            max_results=3,
            include_raw_content=False
        )
        for r in t_response.get("results", []):
            url = r.get("url", "")
            title = r.get("title", "").replace("- Devpost", "").strip()
            content = r.get("content", "")[:250]
            signals.append({
                "source": "devpost",
                "signal_type": "hackathon_winner",
                "title": title,
                "description": content,
                "url": url,
                "strength": 88.0,
                "founder_name": "Hackathon Winner"
            })
    except Exception as e:
        print(f"Tavily Devpost Search failed: {e}")
    return signals

def autocomplete_crunchbase(query: str) -> list:
    """
    Queries Crunchbase Autocomplete API or falls back to Tavily.
    """
    headers = {
        "accept": "application/json",
    }
    url = f"{CRUNCHBASE_AUTOCOMPLETE_URL}?query={quote_plus(query)}"
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            results = []
            for item in data.get("entities", []):
                results.append({
                    "name": item.get("name", ""),
                    "website": item.get("website_url", ""),
                    "sector": item.get("category_groups", ["Software"])[0],
                    "location": item.get("location_identifiers", [{"value": "Unknown"}])[0].get("value", ""),
                    "stage": item.get("funding_stage", "Seed")
                })
            return results
    except Exception as e:
        pass

    try:
        t_response = tavily_client.search(
            query=f"{query} startup crunchbase funding",
            max_results=2
        )
        results = []
        for r in t_response.get("results", []):
            results.append({
                "name": r.get("title", "").split("|")[0].strip() or query,
                "website": r.get("url", ""),
                "sector": "Tech",
                "location": "Global",
                "stage": "Unknown"
            })
        return results
    except Exception:
        return []
