"use client";
import React, { useState, useEffect } from "react";
import { DEMO_SIGNALS } from "@/data/demoData";
import {
  Radar, GitFork, Search, Zap, Globe, Activity, ExternalLink,
  TrendingUp, Code2, BookOpen, Trophy, RefreshCw, Loader2,
  Rss, Filter, ChevronRight
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

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  github: GitFork,
  producthunt: Zap,
  devpost: Trophy,
  arxiv: BookOpen,
  twitter: Activity,
  web: Globe,
};

const SOURCE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  github:       { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  producthunt:  { text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20" },
  devpost:      { text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20"   },
  arxiv:        { text: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/20" },
  twitter:      { text: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20"    },
  web:          { text: "text-white/40",    bg: "bg-white/5",        border: "border-white/10"      },
};

// Uses DEMO_SIGNALS as fallback when API is unavailable

const CHANNELS = [
  { id: "github", label: "GitHub Trending", icon: GitFork, active: true, count: 12 },
  { id: "producthunt", label: "ProductHunt Launches", icon: Zap, active: true, count: 5 },
  { id: "devpost", label: "Devpost Hackathons", icon: Trophy, active: true, count: 3 },
  { id: "arxiv", label: "arXiv / Papers", icon: BookOpen, active: false, count: 8 },
  { id: "accelerators", label: "Accelerator Cohorts", icon: Rss, active: false, count: 0 },
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
  const [signals, setSignals] = useState<OutboundSignal[]>([]);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"signals" | "channels">("signals");
  const [sentOutreach, setSentOutreach] = useState<Set<string>>(new Set());
  const CACHE_KEY = "sourcing_signals_cache_v2";

  // Load from localStorage immediately, then fetch from API
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try { setSignals(JSON.parse(cached)); } catch {}
    } else {
      // Use demo data immediately so the app is never empty
      setSignals(DEMO_SIGNALS as OutboundSignal[]);
    }
    // Try live data
    fetch(`${API}/py-api/sourcing/outbound/signals`)
      .then(r => r.json())
      .then(data => {
        const list = data?.signals || data;
        if (Array.isArray(list) && list.length > 0) {
          setSignals(list);
          localStorage.setItem(CACHE_KEY, JSON.stringify(list));
        }
      })
      .catch(() => {});
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      await fetch(`${API}/py-api/sourcing/outbound/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "all" })
      }).catch(() => {});
      const r = await fetch(`${API}/py-api/sourcing/outbound/signals`).catch(() => null);
      if (r?.ok) {
        const data = await r.json();
        const list = data?.signals || data;
        if (Array.isArray(list) && list.length > 0) {
          // Append new signals, keep old cached ones
          setSignals(prev => {
            const existingIds = new Set(prev.map((s: any) => s.id || s.url));
            const newOnly = list.filter((s: any) => !existingIds.has(s.id || s.url));
            const merged = [...newOnly, ...prev];
            localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      }
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
          {(["signals", "channels"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${activeTab === tab ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" : "text-white/40 hover:text-white/60"}`}
            >
              {tab === "signals" ? `Signals (${signals.length})` : "Channels"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-3">
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
