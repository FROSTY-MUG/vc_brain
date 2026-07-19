"use client";
import React, { useState, useEffect } from "react";
import {
  Radar, GitFork, Search, Zap, Globe, Activity, ExternalLink,
  TrendingUp, Code2, BookOpen, Trophy, RefreshCw, Loader2,
  Rss, Filter, ChevronRight, UserMinus, Brain, Users, Landmark
} from "lucide-react";

interface OutboundSignal {
  id: string;
  source: string;
  signal_type: string;
  title: string;
  description: string;
  url: string;
  strength: number;
  discovered_at: string;
  founder_id?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  github: GitFork,
  producthunt: Zap,
  devpost: Trophy,
  arxiv: BookOpen,
  twitter: Activity,
  web: Globe,
  stealth: UserMinus,
  huggingface: Brain,
  inbound: Rss,
};

const SOURCE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  github:       { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  producthunt:  { text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20" },
  devpost:      { text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20"   },
  arxiv:        { text: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/20" },
  twitter:      { text: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20"    },
  web:          { text: "text-white/40",    bg: "bg-white/5",        border: "border-white/10"      },
  stealth:      { text: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20"   },
  huggingface:  { text: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20" },
  inbound:      { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

const MOCK_SIGNALS: OutboundSignal[] = [
  {
    id: "s1", source: "github", signal_type: "trending_repo",
    title: "alexrivera/edge-llm-runtime",
    description: "Custom quantized kernel for on-device LLM inference — 847 stars in 3 days. Contributor shows ex-Google Brain profile.",
    url: "https://github.com/alexrivera/edge-llm-runtime", strength: 0.92,
    discovered_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: "s2", source: "producthunt",signal_type: "top_launch",
    title: "Flowbit AI — #1 Product of the Day",
    description: "AI workflow automation tool. 1,200 upvotes in 24h. Solo technical founder, ex-Stripe. No VC backing yet.",
    url: "https://producthunt.com/posts/flowbit-ai", strength: 0.85,
    discovered_at: new Date(Date.now() - 5 * 3600000).toISOString()
  },
  {
    id: "s3", source: "devpost", signal_type: "hackathon_winner",
    title: "MedScan — ETH Global 2025 Winner",
    description: "AI diagnostic imaging tool. First-time founders from TU Berlin. Won $50K prize. No prior startup experience.",
    url: "https://devpost.com/software/medscan", strength: 0.78,
    discovered_at: new Date(Date.now() - 12 * 3600000).toISOString()
  },
  {
    id: "s4", source: "arxiv", signal_type: "paper",
    title: "\"Efficient Graph Neural Nets for Drug Discovery\" — 3 Authors",
    description: "PhD candidates at MIT. Paper cited 42 times in 2 months. Lead author building a stealth biotech startup.",
    url: "https://arxiv.org/abs/2501.00123", strength: 0.71,
    discovered_at: new Date(Date.now() - 24 * 3600000).toISOString()
  },
  {
    id: "s5", source: "github", signal_type: "repo_activity",
    title: "mei-lin/carbonledger — 5 commits/day",
    description: "Open-source carbon accounting tool gaining enterprise interest. Founder profile: ex-Stripe engineer, climate advocate.",
    url: "https://github.com/mei-lin/carbonledger", strength: 0.67,
    discovered_at: new Date(Date.now() - 36 * 3600000).toISOString()
  },
];

interface PipelineRow {
  id: string;
  name: string;
  provenance: string;
  provenance_label: string;
  status: string;
  status_label: string;
  scores: { founder?: number; market?: number; idea?: number } | null;
  signal_strength: number | null;
  date: string;
}

const STATUS_STYLES: Record<string, string> = {
  discovered: "bg-white/5 border-white/15 text-white/60",
  screening: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  diligence: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  deploy: "bg-green-500/10 border-green-500/30 text-green-400",
  watch: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
  passed: "bg-white/5 border-white/10 text-white/35",
  attention: "bg-red-500/10 border-red-500/30 text-red-400",
};

const MOCK_PIPELINE: PipelineRow[] = [
  { id: "p1", name: "edge-llm-runtime", provenance: "github", provenance_label: "GitHub spike", status: "diligence", status_label: "In diligence", scores: { founder: 88, market: 74, idea: 81 }, signal_strength: null, date: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: "p2", name: "Flowbit AI", provenance: "inbound", provenance_label: "Applied directly", status: "screening", status_label: "In automatic screening", scores: null, signal_strength: null, date: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: "p3", name: "MedScan", provenance: "devpost", provenance_label: "Hackathon win", status: "deploy", status_label: "Ready to deploy", scores: { founder: 91, market: 82, idea: 86 }, signal_strength: null, date: new Date(Date.now() - 20 * 3600000).toISOString() },
  { id: "p4", name: "quant-kernels (S. Okafor)", provenance: "huggingface", provenance_label: "Hugging Face MVP", status: "discovered", status_label: "Discovered by radar", scores: null, signal_strength: 84, date: new Date(Date.now() - 26 * 3600000).toISOString() },
  { id: "p5", name: "carbonledger", provenance: "stealth", provenance_label: "Stealth break", status: "passed", status_label: "Passed", scores: { founder: 45, market: 60, idea: 40 }, signal_strength: null, date: new Date(Date.now() - 50 * 3600000).toISOString() },
];

const CHANNELS = [
  { id: "github", label: "GitHub Trending", icon: GitFork, active: true, count: 12 },
  { id: "producthunt", label: "ProductHunt Launches", icon: Zap, active: true, count: 5 },
  { id: "devpost", label: "Devpost Hackathons", icon: Trophy, active: true, count: 3 },
  { id: "arxiv", label: "arXiv / Papers", icon: BookOpen, active: false, count: 8 },
  { id: "accelerators", label: "Accelerator Cohorts", icon: Rss, active: false, count: 0 },
  { id: "stealth", label: "Stealth Breaks (LinkedIn/X title shifts)", icon: UserMinus, active: true, count: 0 },
  { id: "huggingface", label: "Hugging Face Spaces", icon: Brain, active: true, count: 0 },
  { id: "cofounder", label: "Co-Founder Matching (YC / Antler)", icon: Users, active: false, count: 0 },
  { id: "incorporation", label: "Incorporation Filings (Stripe Atlas / DE C-Corp)", icon: Landmark, active: false, count: 0 },
];

function StrengthBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? "bg-green-400" : pct >= 70 ? "bg-amber-400" : "bg-white/30";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white/40 w-8 text-right">{pct}</span>
    </div>
  );
}

export default function SourcingApp() {
  const [now] = useState(() => Date.now());
  const [signals, setSignals] = useState<OutboundSignal[]>(MOCK_SIGNALS);
  const [pipeline, setPipeline] = useState<PipelineRow[]>(MOCK_PIPELINE);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"pipeline" | "signals" | "channels">("pipeline");
  const [sentOutreach, setSentOutreach] = useState<Set<string>>(new Set());

  const loadPipeline = async () => {
    const r = await fetch(`${API}/api/sourcing/pipeline`).catch(() => null);
    if (r?.ok) {
      const data = await r.json();
      if (Array.isArray(data?.rows) && data.rows.length > 0) setPipeline(data.rows);
    }
  };

  useEffect(() => {
    loadPipeline();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      await fetch(`${API}/api/sourcing/outbound/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "all" })
      }).catch(() => {});
      const r = await fetch(`${API}/api/sourcing/outbound/signals`).catch(() => null);
      if (r?.ok) {
        const data = await r.json();
        const list = data?.signals || data;
        if (Array.isArray(list) && list.length > 0) setSignals(list);
      }
      await loadPipeline();
    } finally {
      setScanning(false);
    }
  };

  const filtered = signals.filter(s =>
    !filter ||
    s.title.toLowerCase().includes(filter.toLowerCase()) ||
    s.description.toLowerCase().includes(filter.toLowerCase()) ||
    s.source.toLowerCase().includes(filter.toLowerCase())
  );

  const timeAgo = (iso: string) => {
    const diff = now - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Radar className="text-emerald-400" size={22} />
            Sourcing Radar
          </h2>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs transition-colors disabled:opacity-40"
          >
            {scanning ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {scanning ? "Scanning…" : "Scan Now"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{signals.length}</p>
            <p className="text-xs text-white/30">Signals Found</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-amber-400">{signals.filter(s => s.strength >= 0.8).length}</p>
            <p className="text-xs text-white/30">High Priority</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-blue-400">{sentOutreach.size}</p>
            <p className="text-xs text-white/30">Outreach Sent</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(["pipeline", "signals", "channels"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${activeTab === tab ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" : "text-white/40 hover:text-white/60"}`}
            >
              {tab === "pipeline" ? `Pipeline (${pipeline.length})` : tab === "signals" ? `Raw Signals (${signals.length})` : "Channels"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {activeTab === "pipeline" && (
          <div>
            <p className="text-xs text-white/30 mb-3">
              Every startup in one funnel — whether it applied or the radar found it. &ldquo;How found&rdquo; shows the path in.
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-white/30 bg-white/3 text-left">
                    <th className="py-2.5 px-3 font-medium">Startup</th>
                    <th className="py-2.5 px-3 font-medium">How found</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium">Scores F · M · I</th>
                    <th className="py-2.5 px-3 font-medium text-right">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {pipeline.map(row => {
                    const SrcIcon = SOURCE_ICONS[row.provenance] || Globe;
                    const srcColor = SOURCE_COLORS[row.provenance] || SOURCE_COLORS.web;
                    const pill = STATUS_STYLES[row.status] || STATUS_STYLES.discovered;
                    return (
                      <tr key={row.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-white/90">{row.name}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${srcColor.bg} border ${srcColor.border} ${srcColor.text}`}>
                            <SrcIcon size={11} />
                            {row.provenance_label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${pill}`}>
                            {row.status_label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-white/60">
                          {row.scores
                            ? `${row.scores.founder ?? "—"} · ${row.scores.market ?? "—"} · ${row.scores.idea ?? "—"}`
                            : row.signal_strength != null
                              ? <span className="text-white/35">signal {Math.round(row.signal_strength)}</span>
                              : <span className="text-white/25">pending</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs text-white/30 whitespace-nowrap">{timeAgo(row.date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "signals" && (
          <>
            {/* Search */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <Search size={14} className="text-white/30" />
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Filter signals…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/20"
              />
            </div>

            {filtered.map(signal => {
              const SrcIcon = SOURCE_ICONS[signal.source] || Globe;
              const srcColor = SOURCE_COLORS[signal.source] || SOURCE_COLORS.web;
              const isSent = sentOutreach.has(signal.id);
              return (
                <div key={signal.id} className="bg-[#0d0d10] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${srcColor.bg} border ${srcColor.border} flex items-center justify-center shrink-0`}>
                      <SrcIcon size={16} className={srcColor.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white text-sm leading-tight">{signal.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${srcColor.bg} border ${srcColor.border} ${srcColor.text}`}>
                              {signal.source}
                            </span>
                            <span className="text-xs text-white/25">{signal.signal_type.replace(/_/g, " ")}</span>
                            <span className="text-xs text-white/20">{timeAgo(signal.discovered_at)}</span>
                          </div>
                        </div>
                        <a href={signal.url} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white/50 transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <p className="text-xs text-white/50 mt-2 leading-relaxed">{signal.description}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-white/25 mb-1">Signal Strength</p>
                          <StrengthBar value={signal.strength} />
                        </div>
                        <button
                          onClick={() => setSentOutreach(prev => new Set(prev).add(signal.id))}
                          disabled={isSent}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            isSent
                              ? "border-green-500/20 bg-green-500/10 text-green-400"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                        >
                          {isSent ? "✓ Outreach Sent" : <><Zap size={11} /> Activate</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === "channels" && (
          <div className="space-y-2">
            <p className="text-xs text-white/30 mb-3">
              Sourcing channels are continuously scanned. Toggle to enable/disable.
            </p>
            {CHANNELS.map(ch => {
              const Icon = ch.icon;
              return (
                <div key={ch.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${ch.active ? "bg-white/4 border-white/10" : "bg-white/2 border-white/5 opacity-50"}`}>
                  <Icon size={18} className={ch.active ? "text-emerald-400" : "text-white/30"} />
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{ch.label}</p>
                    <p className="text-xs text-white/30">{ch.count} signals this week</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full border transition-colors cursor-pointer ${ch.active ? "bg-emerald-500/30 border-emerald-500/50" : "bg-white/10 border-white/20"}`}>
                    <div className={`w-3.5 h-3.5 rounded-full mt-0.5 transition-all ${ch.active ? "ml-5 bg-emerald-400" : "ml-0.5 bg-white/30"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
