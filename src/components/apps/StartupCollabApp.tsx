"use client";
import React, { useState } from "react";
import { Users, Plus, MessageSquare, GitMerge, Globe, Code2, Rocket, ExternalLink, Search } from "lucide-react";

const SECTORS = ["AI Infrastructure", "Developer Tools", "Fintech", "HealthTech", "EdTech", "Climate Tech", "Enterprise SaaS", "Web3"];
const COLLAB_TYPES = ["Co-Founder Search", "Technical Partner", "Marketing Partner", "Go-to-Market", "Open Source Contributor", "Advisor"];

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
}

const MOCK_POSTS: CollabPost[] = [
  {
    id: "1", author: "Ayaan Khan", company: "FlowML", sector: "AI Infrastructure",
    need: "Co-Founder Search", description: "Building next-gen LLM fine-tuning infra for enterprise. Need a technical co-founder strong in distributed systems and MLOps. We have seed interest from 2 top-tier VCs.",
    skills: ["PyTorch", "Kubernetes", "CUDA", "Distributed Systems"], contact: "ayaan@flowml.ai", timestamp: "2h ago", avatar_letter: "A", avatar_color: "from-blue-600 to-cyan-600"
  },
  {
    id: "2", author: "Mei Lin", company: "CarbonZero", sector: "Climate Tech",
    need: "Go-to-Market", description: "B2B carbon accounting SaaS - we have the tech (ex-Stripe engineers). Need someone who understands enterprise sales cycles and ESG compliance space deeply.",
    skills: ["Enterprise Sales", "ESG", "B2B SaaS", "Sustainability"], contact: "mei@carbonzero.io", timestamp: "5h ago", avatar_letter: "M", avatar_color: "from-green-600 to-emerald-600"
  },
  {
    id: "3", author: "Rohan Verma", company: "MediSync", sector: "HealthTech",
    need: "Technical Partner", description: "HIPAA-compliant AI diagnostic platform. Looking for ML engineer to join as CTO-track. We have pilot with 3 hospitals. Backed by Y Combinator.",
    skills: ["Healthcare ML", "HIPAA", "Python", "Clinical NLP"], contact: "rohan@medisync.health", timestamp: "1d ago", avatar_letter: "R", avatar_color: "from-rose-600 to-pink-600"
  },
  {
    id: "4", author: "Zara Ahmed", company: "EduFlow", sector: "EdTech",
    need: "Marketing Partner", description: "AI-powered tutoring platform with 10k DAU. Need growth/marketing co-founder to help us scale from 10k to 100k. Strong organic traction already.",
    skills: ["Growth Hacking", "SEO", "Content", "Community"], contact: "zara@eduflow.xyz", timestamp: "2d ago", avatar_letter: "Z", avatar_color: "from-amber-600 to-yellow-600"
  },
];

export default function StartupCollabApp() {
  const [posts, setPosts] = useState<CollabPost[]>(MOCK_POSTS);
  const [view, setView] = useState<"browse" | "post">("browse");
  const [filter, setFilter] = useState({ sector: "", type: "" });
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ need: "", sector: "", description: "", skills: "", contact: "" });
  const [posted, setPosted] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const filtered = posts.filter(p => {
    const matchQuery = !query || p.author.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) || (p.company || "").toLowerCase().includes(query.toLowerCase());
    const matchSector = !filter.sector || p.sector === filter.sector;
    const matchType = !filter.type || p.need === filter.type;
    return matchQuery && matchSector && matchType;
  });

  const handlePost = () => {
    if (!form.description || !form.need) return;
    const newPost: CollabPost = {
      id: Date.now().toString(),
      author: "You", sector: form.sector || "General",
      need: form.need, description: form.description,
      skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      contact: form.contact, timestamp: "Just now",
      avatar_letter: "Y", avatar_color: "from-purple-600 to-indigo-600",
      company: undefined
    };
    setPosts([newPost, ...posts]);
    setPosted(true);
    setView("browse");
    setTimeout(() => setPosted(false), 3000);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-purple-400" size={22} />
            Startup Collab
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setView("browse")} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${view === "browse" ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "border-white/10 text-white/40 hover:bg-white/5"}`}>Browse</button>
            <button onClick={() => setView("post")} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${view === "post" ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "border-white/10 text-white/40 hover:bg-white/5"}`}>
              <Plus size={14} className="inline mr-1" />Post
            </button>
          </div>
        </div>
        {view === "browse" && (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <Search size={14} className="text-white/30" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/20" />
            </div>
            <select value={filter.sector} onChange={e => setFilter({...filter, sector: e.target.value})} className="bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white/60 outline-none">
              <option value="">All Sectors</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filter.type} onChange={e => setFilter({...filter, type: e.target.value})} className="bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white/60 outline-none">
              <option value="">All Types</option>
              {COLLAB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
      </div>

      {posted && (
        <div className="mx-4 mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
          ✓ Your collaboration post is now live!
        </div>
      )}

      {/* Post Form */}
      {view === "post" && (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-4">
          <h3 className="font-semibold text-white/80">Post a Collaboration Request</h3>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">What are you looking for?</label>
            <select value={form.need} onChange={e => setForm({...form, need: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50">
              <option value="">Select type...</option>
              {COLLAB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Sector</label>
            <select value={form.sector} onChange={e => setForm({...form, sector: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50">
              <option value="">Select sector...</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Description</label>
            <textarea rows={4} placeholder="Describe what you're building and what you need..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm outline-none resize-none focus:border-purple-500/50 placeholder:text-white/20" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Skills needed (comma separated)</label>
            <input type="text" placeholder="e.g., Python, MLOps, B2B Sales..." value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50 placeholder:text-white/20" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Contact Email</label>
            <input type="email" placeholder="your@email.com" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50 placeholder:text-white/20" />
          </div>
          <button onClick={handlePost} className="w-full py-2.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors font-semibold">
            Publish Post
          </button>
        </div>
      )}

      {/* Browse Posts */}
      {view === "browse" && (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-3">
          <p className="text-xs text-white/30">{filtered.length} collaboration opportunities</p>
          {filtered.map(post => (
            <div key={post.id} className="bg-[#0d0d10] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${post.avatar_color} flex items-center justify-center shrink-0 font-bold text-white text-sm`}>
                  {post.avatar_letter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{post.author}</span>
                    {post.company && <span className="text-white/40 text-xs">@ {post.company}</span>}
                    <span className="ml-auto text-xs text-white/20">{post.timestamp}</span>
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400">{post.need}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">{post.sector}</span>
                  </div>
                  <p className="text-sm text-white/60 mt-2 leading-relaxed">{post.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.skills.map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-white/5 border border-white/5 text-white/30">{s}</span>
                    ))}
                  </div>
                  <div className="flex justify-end mt-3">
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
          ))}
        </div>
      )}
    </div>
  );
}
