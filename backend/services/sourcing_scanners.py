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

from utils.llm import get_llm_client, get_model_name
from tavily import TavilyClient
import base64

openai_client = get_llm_client()
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
                            model=get_model_name("gpt-4o-mini"),
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

def scan_github_embryonic(query: str = "AI OR LLM OR agent") -> list:
    """
    Embryonic tech spikes: repositories created within the last 14 days that
    show unusual star velocity with only 1-2 contributors — side projects
    months before a pitch deck exists.
    """
    signals = []
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    date_str = (datetime.utcnow() - timedelta(days=14)).strftime("%Y-%m-%d")
    full_query = f"{query} stars:>30 created:>{date_str}"
    url = f"https://api.github.com/search/repositories?q={quote_plus(full_query)}&sort=stars&order=desc&per_page=10"

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"GitHub embryonic scan failed with status {response.status_code}")
            return signals
        for item in response.json().get("items", []):
            stars = item.get("stargazers_count", 0)
            full_name = item.get("full_name", "")
            created = datetime.strptime(item.get("created_at", "")[:10], "%Y-%m-%d")
            age_days = max((datetime.utcnow() - created).days, 1)
            velocity = stars / age_days
            if velocity < 5:
                continue

            # Embryonic = 1-2 contributors only
            n_contrib = 1
            try:
                c_resp = requests.get(
                    f"https://api.github.com/repos/{full_name}/contributors?per_page=3",
                    headers=headers, timeout=5
                )
                if c_resp.status_code == 200:
                    n_contrib = len(c_resp.json())
            except Exception:
                pass
            if n_contrib > 2:
                continue

            desc = item.get("description") or "No description provided."
            signals.append({
                "source": "github",
                "signal_type": "embryonic_spike",
                "title": full_name,
                "description": f"{stars}★ in {age_days} days (~{velocity:.0f}/day) with only {n_contrib} contributor(s). {desc}"[:250],
                "url": item.get("html_url", ""),
                "strength": round(min(70 + velocity, 99.0), 1),
                "founder_name": item.get("owner", {}).get("login", "")
            })
    except Exception as e:
        print(f"GitHub embryonic scan error: {e}")
    return signals

def scan_huggingface() -> list:
    """
    Newly created Hugging Face Spaces gaining likes — founders testing raw
    MVPs publicly before incorporating. Free public API, no key needed.
    """
    signals = []
    try:
        response = requests.get(
            "https://huggingface.co/api/spaces?sort=trendingScore&direction=-1&limit=50&full=true",
            timeout=10
        )
        if response.status_code != 200:
            print(f"Hugging Face scan failed with status {response.status_code}")
            return signals
        cutoff = datetime.utcnow() - timedelta(days=21)
        for space in response.json():
            created_raw = space.get("createdAt") or space.get("created_at") or ""
            try:
                created = datetime.strptime(created_raw[:10], "%Y-%m-%d")
            except ValueError:
                continue
            if created < cutoff:
                continue
            likes = space.get("likes", 0)
            if likes < 5:
                continue
            space_id = space.get("id", "")
            author = space.get("author") or space_id.split("/")[0]
            age_days = max((datetime.utcnow() - created).days, 1)
            signals.append({
                "source": "huggingface",
                "signal_type": "mvp_space",
                "title": space_id,
                "description": f"New HF Space: {likes} likes within {age_days} days of creation — public MVP test by '{author}'.",
                "url": f"https://huggingface.co/spaces/{space_id}",
                "strength": round(min(60 + likes / 4, 99.0), 1),
                "founder_name": author
            })
            if len(signals) >= 5:
                break
    except Exception as e:
        print(f"Hugging Face scan error: {e}")
    return signals

def scan_stealth() -> list:
    """
    Stealth breaks: senior people leaving elite companies with no listed next
    role ("Stealth Startup", "Building something new").
    NOTE: The production-grade path is a structured B2B people-data feed
    (e.g. CrustData / Launch Gravity) that tracks daily title changes.
    For the hackathon we surface publicly indexed stealth signals via Tavily.
    """
    signals = []
    queries = [
        'site:linkedin.com/in "stealth" ("ex-OpenAI" OR "ex-Stripe" OR "ex-Google" OR "ex-Nvidia" OR "ex-DeepMind")',
        '"building something new" ("left OpenAI" OR "left Stripe" OR "left Google" OR "left Nvidia") founder',
    ]
    for q in queries:
        try:
            t_response = tavily_client.search(
                query=q,
                search_depth="advanced",
                max_results=3,
                include_raw_content=False
            )
            for r in t_response.get("results", []):
                title = r.get("title", "").split("|")[0].split(" - ")[0].strip()
                signals.append({
                    "source": "stealth",
                    "signal_type": "stealth_break",
                    "title": title or "Stealth founder",
                    "description": r.get("content", "")[:250],
                    "url": r.get("url", ""),
                    "strength": 82.0,
                    "founder_name": title or "Unknown"
                })
        except Exception as e:
            print(f"Tavily stealth search failed: {e}")
    # De-duplicate by URL
    seen, unique = set(), []
    for s in signals:
        if s["url"] not in seen:
            seen.add(s["url"])
            unique.append(s)
    return unique

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
