"use client";
import React, { useState, useEffect, useCallback } from "react";
import { LineChart, TrendingUp, TrendingDown, Users, Activity, RefreshCw, DollarSign, Globe, AlertCircle } from "lucide-react";

interface MetricCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ComponentType<any>;
  color: string;
}

// Simple sparkline using SVG
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 40;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="opacity-70">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function TractionApp() {
  const [metrics, setMetrics] = useState({
    dau: [420, 510, 480, 620, 590, 710, 820],
    revenue: [1200, 1400, 1350, 1800, 1950, 2100, 2400],
    signups: [30, 45, 38, 62, 55, 80, 95],
    mrr: [4200, 4800, 5100, 5800, 6200, 6900, 7400],
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"overview" | "growth" | "funnel">("overview");

  // Simulate traction data refreshing
  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setMetrics(prev => ({
        dau: [...prev.dau.slice(1), prev.dau[prev.dau.length - 1] + Math.floor(Math.random() * 100 - 20)],
        revenue: [...prev.revenue.slice(1), prev.revenue[prev.revenue.length - 1] + Math.floor(Math.random() * 200)],
        signups: [...prev.signups.slice(1), prev.signups[prev.signups.length - 1] + Math.floor(Math.random() * 20 - 5)],
        mrr: [...prev.mrr.slice(1), prev.mrr[prev.mrr.length - 1] + Math.floor(Math.random() * 300)],
      }));
      setLastUpdated(new Date());
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const currentMRR = metrics.mrr[metrics.mrr.length - 1];
  const prevMRR = metrics.mrr[metrics.mrr.length - 2];
  const mrrGrowth = (((currentMRR - prevMRR) / prevMRR) * 100).toFixed(1);

  const cards: MetricCard[] = [
    { label: "Daily Active Users", value: metrics.dau[metrics.dau.length - 1].toLocaleString(), change: "+12.4%", positive: true, icon: Users, color: "#60a5fa" },
    { label: "MRR", value: `$${(currentMRR).toLocaleString()}`, change: `+${mrrGrowth}%`, positive: parseFloat(mrrGrowth) > 0, icon: DollarSign, color: "#34d399" },
    { label: "New Signups (7d)", value: metrics.signups[metrics.signups.length - 1].toLocaleString(), change: "+8.2%", positive: true, icon: TrendingUp, color: "#a78bfa" },
    { label: "Daily Revenue", value: `$${metrics.revenue[metrics.revenue.length - 1].toLocaleString()}`, change: "+18.6%", positive: true, icon: Activity, color: "#fbbf24" },
  ];

  const funnelData = [
    { stage: "Website Visitors", count: 4200, pct: 100 },
    { stage: "Sign Ups", count: 840, pct: 20 },
    { stage: "Activated Users", count: 462, pct: 11 },
    { stage: "Paid Conversion", count: 126, pct: 3 },
    { stage: "Retained (D30)", count: 89, pct: 2.1 },
  ];

  return (
    <div className="h-full flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LineChart className="text-amber-400" size={22} />
            Traction Analytics
          </h2>
          <p className="text-xs text-white/30 mt-0.5">Updated {lastUpdated.toLocaleTimeString()} • Live 10s refresh</p>
        </div>
        <button onClick={refresh} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin text-amber-400" : "text-white/50"} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 pt-4 shrink-0">
        {(["overview", "growth", "funnel"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${activeTab === tab ? "bg-amber-500/20 border border-amber-500/30 text-amber-400" : "text-white/40 hover:text-white/60"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === "overview" && (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {cards.map((card, i) => (
                <div key={i} className="bg-[#0d0d10] border border-white/5 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-white/40 mb-0.5">{card.label}</p>
                      <p className="text-2xl font-bold text-white">{card.value}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${card.color}20`, border: `1px solid ${card.color}30` }}>
                      <card.icon size={18} style={{ color: card.color }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium flex items-center gap-1 ${card.positive ? "text-green-400" : "text-red-400"}`}>
                      {card.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {card.change}
                    </span>
                    <Sparkline
                      data={i === 0 ? metrics.dau : i === 1 ? metrics.mrr : i === 2 ? metrics.signups : metrics.revenue}
                      color={card.color}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="bg-[#0d0d10] border border-white/5 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white/60 mb-3">Key Milestones</h3>
              <div className="space-y-2">
                {[
                  { label: "Time to 100 users", value: "8 days", badge: "🚀" },
                  { label: "Net Revenue Retention", value: "118%", badge: "📈" },
                  { label: "CAC Payback Period", value: "2.3 months", badge: "💸" },
                  { label: "Churn Rate (monthly)", value: "1.8%", badge: "🔒" },
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/3">
                    <span className="text-sm text-white/50">{m.badge} {m.label}</span>
                    <span className="text-sm font-semibold text-white">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "growth" && (
          <div className="space-y-4">
            <div className="bg-[#0d0d10] border border-white/5 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white/60 mb-4">MRR Growth Trajectory</h3>
              <div className="flex items-end gap-2 h-32">
                {metrics.mrr.map((v, i) => {
                  const max = Math.max(...metrics.mrr);
                  const pct = (v / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-white/30">${(v / 1000).toFixed(1)}k</span>
                      <div className="w-full rounded-t-sm bg-amber-500/60" style={{ height: `${pct}%` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-white/20 mt-2">
                <span>7 weeks ago</span><span>This week</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0d0d10] border border-white/5 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-1">Week-over-Week Growth</p>
                <p className="text-3xl font-bold text-green-400">+{mrrGrowth}%</p>
                <p className="text-xs text-white/30 mt-1">MRR Growth Rate</p>
              </div>
              <div className="bg-[#0d0d10] border border-white/5 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-1">Projected ARR</p>
                <p className="text-3xl font-bold text-amber-400">${((currentMRR * 12) / 1000).toFixed(0)}k</p>
                <p className="text-xs text-white/30 mt-1">At current trajectory</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "funnel" && (
          <div className="bg-[#0d0d10] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white/60 mb-4">Conversion Funnel</h3>
            <div className="space-y-3">
              {funnelData.map((stage, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/70">{stage.stage}</span>
                    <span className="text-white font-mono">{stage.count.toLocaleString()} ({stage.pct}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400/60" style={{ width: `${stage.pct}%` }} />
                  </div>
                  {i < funnelData.length - 1 && (
                    <p className="text-xs text-white/20 mt-1 text-right">
                      {((funnelData[i + 1].count / stage.count) * 100).toFixed(0)}% proceed →
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
