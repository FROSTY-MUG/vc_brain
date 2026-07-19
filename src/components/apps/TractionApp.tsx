"use client";
import React, { useState, useEffect } from "react";
import {
  TrendingUp, BarChart2, Users, DollarSign, Activity,
  RefreshCw, Loader2, ArrowUp, ArrowDown, Minus, Zap
} from "lucide-react";

interface KpiCard {
  label: string;
  value: string;
  delta?: string;
  deltaDir?: "up" | "down" | "flat";
  sub?: string;
  color: string;
}

interface ApplicationScore {
  id: string;
  company: string;
  sector: string;
  stage: string;
  founder_score: number;
  market_score: number;
  idea_score: number;
  recommendation: string;
  thesis_alignment: number;
  founder_trend: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MOCK_KPI_CARDS: KpiCard[] = [
  { label: "Applications This Week", value: "12", delta: "+4", deltaDir: "up", sub: "vs last week", color: "text-amber-400" },
  { label: "Avg Founder Score", value: "74/100", delta: "+2.3", deltaDir: "up", sub: "across all apps", color: "text-blue-400" },
  { label: "Avg Market Score", value: "68/100", delta: "-1.1", deltaDir: "down", sub: "trending down", color: "text-green-400" },
  { label: "Deploy Rate", value: "8%", delta: "+2pp", deltaDir: "up", sub: "of screened deals", color: "text-purple-400" },
  { label: "Diligence Pipeline", value: "5", delta: "0", deltaDir: "flat", sub: "active deals", color: "text-cyan-400" },
  { label: "Sourced This Month", value: "34", delta: "+12", deltaDir: "up", sub: "outbound signals", color: "text-emerald-400" },
];

const MOCK_SCORES: ApplicationScore[] = [
  { id: "a1", company: "Electron AI", sector: "AI Infra", stage: "Seed", founder_score: 88, market_score: 85, idea_score: 90, recommendation: "diligence", thesis_alignment: 92, founder_trend: "rising" },
  { id: "a2", company: "Flowbit AI", sector: "Dev Tools", stage: "Pre-Seed", founder_score: 72, market_score: 78, idea_score: 68, recommendation: "watch", thesis_alignment: 74, founder_trend: "stable" },
  { id: "a3", company: "MedScan", sector: "HealthTech", stage: "Pre-Seed", founder_score: 65, market_score: 82, idea_score: 75, recommendation: "diligence", thesis_alignment: 68, founder_trend: "rising" },
  { id: "a4", company: "CarbonZero", sector: "Climate", stage: "Seed", founder_score: 59, market_score: 71, idea_score: 62, recommendation: "pass", thesis_alignment: 51, founder_trend: "stable" },
];

function DeltaIcon({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "up") return <ArrowUp size={11} className="text-green-400" />;
  if (dir === "down") return <ArrowDown size={11} className="text-red-400" />;
  return <Minus size={11} className="text-white/30" />;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-white/50 w-6 text-right">{score}</span>
    </div>
  );
}

const recColor: Record<string, string> = {
  deploy: "text-green-400 bg-green-500/10 border-green-500/20",
  diligence: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  watch: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  pass: "text-red-400 bg-red-500/10 border-red-500/20",
};

const trendIcon = (t: string) => {
  if (t === "rising") return <ArrowUp size={12} className="text-green-400" />;
  if (t === "declining") return <ArrowDown size={12} className="text-red-400" />;
  return <Minus size={12} className="text-white/30" />;
};

export default function TractionApp() {
  const [scores, setScores] = useState<ApplicationScore[]>(MOCK_SCORES);
  const [kpis, setKpis] = useState<KpiCard[]>(MOCK_KPI_CARDS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"kpis" | "pipeline">("kpis");

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/applications/`).catch(() => null);
      if (r?.ok) {
        const apps = await r.json();
        if (Array.isArray(apps) && apps.length > 0) {
          const mapped: ApplicationScore[] = apps.map((a: { id: string; startups?: { name?: string; sector?: string; stage?: string }; opportunity_scores?: { founder_score?: number; market_score?: number; idea_score?: number; recommendation?: string; thesis_alignment?: number; founder_trend?: string } }) => ({
            id: a.id,
            company: a.startups?.name || "Unknown",
            sector: a.startups?.sector || "—",
            stage: a.startups?.stage || "—",
            founder_score: a.opportunity_scores?.founder_score ?? 50,
            market_score: a.opportunity_scores?.market_score ?? 50,
            idea_score: a.opportunity_scores?.idea_score ?? 50,
            recommendation: a.opportunity_scores?.recommendation || "diligence",
            thesis_alignment: a.opportunity_scores?.thesis_alignment ?? 50,
            founder_trend: a.opportunity_scores?.founder_trend || "stable",
          }));
          setScores(mapped);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setTimeout(() => refresh(), 0); }, []);

  const avgFounder = scores.length ? Math.round(scores.reduce((s, a) => s + a.founder_score, 0) / scores.length) : 0;
  const avgMarket  = scores.length ? Math.round(scores.reduce((s, a) => s + a.market_score,  0) / scores.length) : 0;
  const deployCount = scores.filter(s => s.recommendation === "deploy").length;

  return (
    <div className="h-full flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="text-purple-400" size={22} />
            Traction & KPIs
          </h2>
          <button onClick={refresh} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/70 text-xs transition-colors">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Refresh
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-blue-400">{avgFounder}</p>
            <p className="text-xs text-white/30">Avg Founder Score</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-400">{avgMarket}</p>
            <p className="text-xs text-white/30">Avg Market Score</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-purple-400">{scores.length}</p>
            <p className="text-xs text-white/30">In Pipeline</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(["kpis", "pipeline"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${activeTab === tab ? "bg-purple-500/20 border border-purple-500/30 text-purple-400" : "text-white/40 hover:text-white/60"}`}>
              {tab === "kpis" ? "Fund KPIs" : `Deal Pipeline (${scores.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === "kpis" && (
          <div className="grid grid-cols-2 gap-3">
            {kpis.map((kpi, i) => (
              <div key={i} className="bg-white/3 border border-white/6 rounded-xl p-4">
                <p className="text-xs text-white/30 mb-2">{kpi.label}</p>
                <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                {kpi.delta && (
                  <div className="flex items-center gap-1 mt-1">
                    {kpi.deltaDir && <DeltaIcon dir={kpi.deltaDir} />}
                    <span className={`text-xs ${kpi.deltaDir === "up" ? "text-green-400" : kpi.deltaDir === "down" ? "text-red-400" : "text-white/30"}`}>
                      {kpi.delta}
                    </span>
                    <span className="text-xs text-white/20">{kpi.sub}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "pipeline" && (
          <div className="space-y-3">
            {scores.map(app => (
              <div key={app.id} className="bg-[#0d0d10] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{app.company}</h3>
                      <div className="flex items-center gap-1">{trendIcon(app.founder_trend)}</div>
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      <span className="px-1.5 py-0.5 rounded text-xs bg-white/5 border border-white/10 text-white/30">{app.sector}</span>
                      <span className="px-1.5 py-0.5 rounded text-xs bg-white/5 border border-white/10 text-white/30">{app.stage}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs border font-semibold capitalize ${recColor[app.recommendation] || recColor.diligence}`}>
                    {app.recommendation}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-white/30 mb-1">
                      <span>Founder</span>
                    </div>
                    <ScoreBar score={app.founder_score} color="bg-blue-400" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-white/30 mb-1">
                      <span>Market</span>
                    </div>
                    <ScoreBar score={app.market_score} color="bg-green-400" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-white/30 mb-1">
                      <span>Idea vs Market</span>
                    </div>
                    <ScoreBar score={app.idea_score} color="bg-purple-400" />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <span className="text-xs text-white/30">Thesis alignment</span>
                    <span className="text-xs font-bold text-amber-400">{app.thesis_alignment}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
