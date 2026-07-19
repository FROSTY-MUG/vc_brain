"use client";
import React, { useState, useEffect } from "react";
import { Users, Plus, MessageSquare, Globe, ExternalLink, Search, RefreshCw, Loader2, Github, Zap } from "lucide-react";

const SECTORS = ["AI Infrastructure", "Developer Tools", "Fintech", "HealthTech", "EdTech", "Climate Tech", "Enterprise SaaS", "Web3", "LegalTech", "AI Research"];
const COLLAB_TYPES = ["Co-Founder Search", "Technical Partner", "Marketing Partner", "Go-to-Market", "Open Source Contributor", "Advisor"];

const SOURCE_COLORS: Record<string, string> = {
  github: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  hackernews: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  arxiv: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  devpost: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  direct: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

const AVATAR_COLORS = [
  "from-purple-600 to-indigo-600",
  "from-emerald-600 to-teal-600",
  "from-amber-600 to-orange-600",
  "from-blue-600 to-cyan-600",
  "from-rose-600 to-pink-600",
  "from-sky-600 to-blue-600",
  "from-violet-600 to-purple-600",
  "from-green-600 to-emerald-600",
];

interface CollabPost {
  id: string;
  author: string;
  company?: string;
  sector: string;
  need: string;
  description: string;
  skills: string[];
  contact: string;
  timestamp: string;
  avatar_letter: string;
  avatar_color: string;
  source?: string;
  github_url?: string;
  url?: string;
  stars?: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CACHE_KEY = "collab_cache_v2";

export default function StartupCollabApp() {
  const [posts, setPosts] = useState<CollabPost[]>([]);
  const [view, setView] = useState<"browse" | "post">("browse");
  const [filter, setFilter] = useState({ sector: "", type: "" });
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ need: "", sector: "", description: "", skills: "", contact: "" });
  const [posted, setPosted] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  // Load from localStorage immediately on mount (Instagram-style)
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setPosts(JSON.parse(cached));
      } catch {}
    }
    // Then fetch fresh data from backend
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const r = await fetch(`${API}/api/collab/`);
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data) && data.length > 0) {
          const enriched = data.map((p: any, i: number) => ({
            ...p,
            avatar_letter: (p.author || "?")[0].toUpperCase(),
            avatar_color: p.avatar_color || AVATAR_COLORS[i % AVATAR_COLORS.length],
            skills: Array.isArray(p.skills) ? p.skills : (p.skills || "").split(",").map((s: string) => s.trim()).filter(Boolean),
          }));
          setPosts(enriched);
          localStorage.setItem(CACHE_KEY, JSON.stringify(enriched));
          setLastRefresh(new Date().toLocaleTimeString());
        }
      }
    } catch (e) {
      console.error("Collab fetch error:", e);
    }
  };

  const handleDiscover = async () => {
    setRefreshing(true);
    try {
      await fetch(`${API}/api/collab/discover`);
      await fetchPosts();
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = posts.filter(p => {
    const matchQuery = !query || p.author.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      (p.company || "").toLowerCase().includes(query.toLowerCase());
    const matchSector = !filter.sector || p.sector === filter.sector;
    const matchType = !filter.type || p.need === filter.type;
    return matchQuery && matchSector && matchType;
  });

  const handlePost = async () => {
    if (!form.description || !form.need) return;
    const newPost: CollabPost = {
      id: Date.now().toString(),
      author: "You",
      sector: form.sector || "General",
      need: form.need,
      description: form.description,
      skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      contact: form.contact,
      timestamp: "Just now",
      avatar_letter: "Y",
      avatar_color: "from-purple-600 to-indigo-600",
      source: "direct",
    };
    const updated = [newPost, ...posts];
    setPosts(updated);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    setPosted(true);
    setView("browse");
    setTimeout(() => setPosted(false), 3000);
    // Also persist to backend
    fetch(`${API}/api/collab/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newPost, role: "founder", type: newPost.need, content: newPost.description }),
    }).catch(() => {});
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="text-purple-400" size={22} />
              Startup Collab
            </h2>
            {lastRefresh && <p className="text-xs text-white/20 mt-0.5">Last synced {lastRefresh}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDiscover}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white/80 text-xs transition-colors disabled:opacity-40"
            >
              {refreshing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              {refreshing ? "Discovering..." : "Discover More"}
            </button>
            <button onClick={() => setView("browse")} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${view === "browse" ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "border-white/10 text-white/40 hover:bg-white/5"}`}>Browse</button>
            <button onClick={() => setView("post")} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${view === "post" ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "border-white/10 text-white/40 hover:bg-white/5"}`}>
              <Plus size={14} className="inline mr-1" />Post
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/5 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-purple-400">{posts.length}</p>
            <p className="text-xs text-white/30">Opportunities</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-emerald-400">{posts.filter(p => p.source === "github").length}</p>
            <p className="text-xs text-white/30">GitHub Builders</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-amber-400">{sentRequests.size}</p>
            <p className="text-xs text-white/30">Connections Sent</p>
          </div>
        </div>

        {view === "browse" && (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <Search size={14} className="text-white/30" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search founders, companies, skills..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/20" />
            </div>
            <select value={filter.sector} onChange={e => setFilter({ ...filter, sector: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white/60 outline-none">
              <option value="">All Sectors</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      {posted && (
        <div className="mx-4 mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          ✓ Your collaboration post is now live!
        </div>
      )}

      {/* Post Form */}
      {view === "post" && (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-4">
          <h3 className="font-semibold text-white/80">Post a Collaboration Request</h3>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">What are you looking for?</label>
            <select value={form.need} onChange={e => setForm({ ...form, need: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50">
              <option value="">Select type...</option>
              {COLLAB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Sector</label>
            <select value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50">
              <option value="">Select sector...</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Description</label>
            <textarea rows={4} placeholder="Describe what you're building and what you need..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm outline-none resize-none focus:border-purple-500/50 placeholder:text-white/20" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Skills needed (comma separated)</label>
            <input type="text" placeholder="e.g., Python, MLOps, B2B Sales..." value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50 placeholder:text-white/20" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Contact Email or URL</label>
            <input type="text" placeholder="your@email.com or https://..." value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50 placeholder:text-white/20" />
          </div>
          <button onClick={handlePost} className="w-full py-2.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors font-semibold">
            Publish Post
          </button>
        </div>
      )}

      {/* Browse Posts */}
      {view === "browse" && (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-3">
          <p className="text-xs text-white/30">{filtered.length} collaboration opportunities · Live from GitHub, HN, Devpost & more</p>
          {filtered.length === 0 && (
            <div className="text-center text-white/20 py-16">
              <Users size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Loading opportunities from GitHub, Hacker News, and Devpost...</p>
            </div>
          )}
          {filtered.map(post => {
            const srcColorClass = SOURCE_COLORS[post.source || "direct"] || SOURCE_COLORS.direct;
            return (
              <div key={post.id} className="bg-[#0d0d10] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${post.avatar_color} flex items-center justify-center shrink-0 font-bold text-white text-sm`}>
                    {post.avatar_letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{post.author}</span>
                      {post.company && <span className="text-white/40 text-xs">@ {post.company}</span>}
                      {post.stars && post.stars > 0 && (
                        <span className="text-xs text-amber-400/70">⭐ {post.stars.toLocaleString()}</span>
                      )}
                      <span className="ml-auto text-xs text-white/20">{post.timestamp}</span>
                    </div>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400">{post.need || "Collab"}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">{post.sector}</span>
                      {post.source && post.source !== "direct" && (
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${srcColorClass}`}>{post.source}</span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mt-2 leading-relaxed line-clamp-3">{post.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(post.skills || []).slice(0, 5).map(s => (
                        <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-white/5 border border-white/5 text-white/30">{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-2">
                        {post.github_url && (
                          <a href={post.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-white/30 hover:text-emerald-400 transition-colors">
                            <ExternalLink size={12} /> GitHub
                          </a>
                        )}
                        {post.url && post.url !== post.github_url && (
                          <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-white/30 hover:text-blue-400 transition-colors">
                            <Globe size={12} /> View
                          </a>
                        )}
                      </div>
                      {sentRequests.has(post.id) ? (
                        <span className="text-xs text-green-400">✓ Request Sent</span>
                      ) : (
                        <button
                          onClick={() => setSentRequests(prev => new Set(prev).add(post.id))}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                        >
                          <MessageSquare size={12} /> Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
