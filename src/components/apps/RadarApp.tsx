"use client";
import React, { useState } from "react";
import {
  Globe, Radar, Zap, Activity, TrendingUp, Brain, Network,
  GitFork, BookOpen, Trophy, ExternalLink, ChevronRight, ArrowUp,
  BarChart3, Clock, CheckCircle2, Ghost, Terminal, Users, Landmark
} from "lucide-react";

/* 
  RadarApp — Sourcing Radar Map
  Visual representation of the sourcing network / signal landscape.
  Shows where strong founders come from, channel performance, and
  proactively suggests underexplored channels.
*/

interface Channel {
  id: string;
  name: string;
  icon: React.ElementType;
  signals: number;
  quality: number; // avg founder score from this channel
  deals: number;   // how many converted
  color: string;
  textColor: string;
  barColor: string; // must be a literal Tailwind class — dynamically built names don't get generated
  x: number; // position in radar
  y: number;
}

const CHANNELS: Channel[] = [
  { id: "github", name: "GitHub Trending", icon: GitFork, signals: 34, quality: 78, deals: 3, color: "bg-emerald-500/20", textColor: "text-emerald-400", barColor: "bg-emerald-400", x: 50, y: 15 },
  { id: "stealth", name: "Stealth Breaks", icon: Ghost, signals: 42, quality: 94, deals: 2, color: "bg-indigo-500/20", textColor: "text-indigo-400", barColor: "bg-indigo-400", x: 40, y: 30 },
  { id: "embryonic", name: "HF Tech Spikes", icon: Terminal, signals: 15, quality: 85, deals: 1, color: "bg-fuchsia-500/20", textColor: "text-fuchsia-400", barColor: "bg-fuchsia-400", x: 70, y: 20 },
  { id: "devpost", name: "Devpost", icon: Trophy, signals: 12, quality: 82, deals: 2, color: "bg-blue-500/20", textColor: "text-blue-400", barColor: "bg-blue-400", x: 78, y: 35 },
  { id: "cofounder", name: "Co-Founder Matching", icon: Users, signals: 28, quality: 72, deals: 0, color: "bg-rose-500/20", textColor: "text-rose-400", barColor: "bg-rose-400", x: 30, y: 60 },
  { id: "arxiv", name: "arXiv Papers", icon: BookOpen, signals: 8, quality: 88, deals: 1, color: "bg-purple-500/20", textColor: "text-purple-400", barColor: "bg-purple-400", x: 85, y: 65 },
  { id: "yc", name: "YC / Accelerators", icon: Zap, signals: 5, quality: 91, deals: 1, color: "bg-amber-500/20", textColor: "text-amber-400", barColor: "bg-amber-400", x: 60, y: 85 },
  { id: "incorporation", name: "Delaware Registry", icon: Landmark, signals: 105, quality: 55, deals: 1, color: "bg-slate-500/20", textColor: "text-slate-400", barColor: "bg-slate-400", x: 80, y: 80 },
  { id: "ph", name: "ProductHunt", icon: Activity, signals: 18, quality: 69, deals: 0, color: "bg-orange-500/20", textColor: "text-orange-400", barColor: "bg-orange-400", x: 25, y: 75 },
  { id: "twitter", name: "X / Twitter", icon: Brain, signals: 22, quality: 64, deals: 0, color: "bg-sky-500/20", textColor: "text-sky-400", barColor: "bg-sky-400", x: 15, y: 45 },
];

const SUGGESTIONS = [
  { channel: "CrustData / Launch Gravity", reason: "Automated tracking of elite engineer title changes to 'Stealth' — highly predictive.", priority: "high" },
  { channel: "Delaware C-Corp Registry", reason: "Monitor daily legal incorporations combined with Stripe Atlas data.", priority: "high" },
  { channel: "YC Co-Founder Matching", reason: "Catch high-intent technical talent before they even have an idea.", priority: "medium" },
  { channel: "Hugging Face Spaces", reason: "AI founders with raw embryonic prototypes showing early developer traction.", priority: "medium" },
];

const RECENT_CONVERSIONS = [
  { founder: "Alex Rivera", company: "Electron AI", channel: "github", score: 88, outcome: "diligence" },
  { founder: "Rohan Verma", company: "MedScan", channel: "devpost", score: 75, outcome: "diligence" },
];

export default function RadarApp() {
  const [selected, setSelected] = useState<Channel | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "suggestions" | "conversions">("map");

  const totalSignals = CHANNELS.reduce((s, c) => s + c.signals, 0);
  const totalDeals = CHANNELS.reduce((s, c) => s + c.deals, 0);
  const avgQuality = Math.round(CHANNELS.reduce((s, c) => s + c.quality, 0) / CHANNELS.length);

  return (
    <div className="absolute inset-0 flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Network className="text-indigo-400" size={22} />
            Sourcing Graph
          </h2>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-indigo-400">Live Monitoring</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-indigo-400">{totalSignals}</p>
            <p className="text-xs text-white/30">Total Signals</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-amber-400">{avgQuality}</p>
            <p className="text-xs text-white/30">Avg Quality Score</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-400">{totalDeals}</p>
            <p className="text-xs text-white/30">Converted Deals</p>
          </div>
        </div>

        <div className="flex gap-1">
          {(["map", "suggestions", "conversions"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${activeTab === tab ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-400" : "text-white/40 hover:text-white/60"}`}>
              {tab === "suggestions" ? "Underexplored" : tab === "conversions" ? "Conversions" : "Channel Map"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
        {activeTab === "map" && (
          <div className="space-y-3">
            {/* Simple visual bubble map */}
            <div className="relative bg-white/2 border border-white/6 rounded-2xl overflow-hidden" style={{ height: 220 }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-xs text-white/10 uppercase tracking-widest">Sourcing Network</div>
              </div>
              {/* Concentric rings */}
              {[140, 100, 60].map((r, i) => (
                <div key={i} className="absolute border border-white/5 rounded-full"
                  style={{ width: r * 2, height: r * 2, top: `calc(50% - ${r}px)`, left: `calc(50% - ${r}px)` }} />
              ))}
              {CHANNELS.map(ch => {
                const size = 24 + ch.signals * 0.8;
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelected(selected?.id === ch.id ? null : ch)}
                    className={`absolute flex items-center justify-center rounded-full border transition-all ${ch.color} ${selected?.id === ch.id ? "scale-125 border-white/30" : "border-white/10 hover:scale-110"}`}
                    style={{
                      width: size, height: size,
                      left: `${ch.x}%`, top: `${ch.y}%`,
                      transform: `translate(-50%, -50%) ${selected?.id === ch.id ? "scale(1.25)" : ""}`,
                    }}
                    title={ch.name}
                  >
                    <Icon size={size > 40 ? 16 : 12} className={ch.textColor} />
                  </button>
                );
              })}
            </div>

            {/* Selected channel detail */}
            {selected && (
              <div className={`${selected.color} border border-white/10 rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <selected.icon size={18} className={selected.textColor} />
                  <h3 className="font-semibold text-white">{selected.name}</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className={`text-xl font-bold ${selected.textColor}`}>{selected.signals}</p>
                    <p className="text-xs text-white/30">Signals</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{selected.quality}</p>
                    <p className="text-xs text-white/30">Avg Score</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-400">{selected.deals}</p>
                    <p className="text-xs text-white/30">Deals</p>
                  </div>
                </div>
              </div>
            )}

            {/* Channel list */}
            <div className="space-y-2">
              {[...CHANNELS].sort((a, b) => b.quality - a.quality).map(ch => {
                const Icon = ch.icon;
                const convRate = ch.signals > 0 ? Math.round((ch.deals / ch.signals) * 100) : 0;
                return (
                  <button key={ch.id} onClick={() => setSelected(selected?.id === ch.id ? null : ch)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selected?.id === ch.id ? `${ch.color} border-white/15` : "bg-white/2 border-white/5 hover:border-white/10"}`}>
                    <div className={`w-9 h-9 rounded-xl ${ch.color} flex items-center justify-center shrink-0`}>
                      <Icon size={16} className={ch.textColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{ch.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${ch.barColor}`} style={{ width: `${ch.quality}%` }} />
                        </div>
                        <span className="text-xs text-white/30">{ch.quality} quality</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">{ch.signals}</p>
                      <p className="text-xs text-white/25">{convRate}% conv.</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "suggestions" && (
          <div className="space-y-3">
            <p className="text-xs text-white/40 leading-relaxed">
              Based on historical conversion data, these channels are underexplored relative to their potential quality signal.
            </p>
            {SUGGESTIONS.map((s, i) => (
              <div key={i} className={`rounded-xl border p-4 ${s.priority === "high" ? "bg-amber-500/5 border-amber-500/15" : "bg-white/3 border-white/8"}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${s.priority === "high" ? "bg-amber-400" : "bg-white/30"}`} />
                  <div>
                    <p className="font-semibold text-white text-sm">{s.channel}</p>
                    <p className="text-xs text-white/50 mt-1">{s.reason}</p>
                    <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs border ${s.priority === "high" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-white/5 border-white/10 text-white/40"}`}>
                      {s.priority === "high" ? "High priority" : "Medium priority"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "conversions" && (
          <div className="space-y-3">
            <p className="text-xs text-white/40">Founders who converted from outbound signal to funded deal — feeding back into channel scoring.</p>
            {RECENT_CONVERSIONS.map((c, i) => {
              const ch = CHANNELS.find(ch => ch.id === c.channel);
              const Icon = ch?.icon || GitFork;
              return (
                <div key={i} className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${ch?.color || "bg-white/5"} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={ch?.textColor || "text-white/40"} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{c.founder}</p>
                    <p className="text-xs text-white/40">{c.company} · via {ch?.name || c.channel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-400">{c.score}</p>
                    <p className="text-xs text-white/30">Founder score</p>
                    <span className="text-xs text-amber-400 capitalize">{c.outcome}</span>
                  </div>
                </div>
              );
            })}
            <div className="bg-white/2 border border-white/6 rounded-xl p-4 text-center">
              <p className="text-xs text-white/30">
                Conversion data feeds back into the sourcing model to weight high-quality channels higher over time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
