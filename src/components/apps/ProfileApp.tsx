"use client";
import React, { useState } from "react";
import {
  User, Settings, Shield, TrendingUp, DollarSign, Globe,
  Tag, CheckCircle2, Edit3, Save, Building2, Target, Zap
} from "lucide-react";

/* ProfileApp — Investor Profile & Thesis Settings */

interface ThesisConfig {
  fund_name: string;
  fund_size: string;
  check_size_min: number;
  check_size_max: number;
  sectors: string[];
  stages: string[];
  geographies: string[];
  ownership_target: string;
  risk_appetite: "conservative" | "balanced" | "aggressive";
  dealflow_target: number;
}

const ALL_SECTORS = [
  "AI Infrastructure", "Developer Tools", "Fintech", "HealthTech",
  "EdTech", "Climate Tech", "Enterprise SaaS", "Web3", "Cybersecurity",
  "BioTech", "Hardware", "Consumer"
];
const ALL_STAGES = ["Pre-Seed", "Seed", "Series A"];
const ALL_GEOS = ["Global", "Asia", "Europe", "USA", "India", "Germany", "DACH"];

const INITIAL_THESIS: ThesisConfig = {
  fund_name: "Maschmeyer Group VC",
  fund_size: "$100M",
  check_size_min: 50,
  check_size_max: 500,
  sectors: ["AI Infrastructure", "Developer Tools", "Enterprise SaaS"],
  stages: ["Pre-Seed", "Seed"],
  geographies: ["Germany", "Europe"],
  ownership_target: "10-15%",
  risk_appetite: "balanced",
  dealflow_target: 200,
};

function ToggleChip({
  label, active, onToggle
}: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${active
        ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
        : "bg-white/5 border-white/10 text-white/30 hover:border-white/20 hover:text-white/50"
        }`}
    >
      {active && <span className="mr-1">✓</span>}
      {label}
    </button>
  );
}

export default function ProfileApp() {
  const [thesis, setThesis] = useState<ThesisConfig>(INITIAL_THESIS);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "thesis" | "stats">("profile");

  const toggleSector = (s: string) =>
    setThesis(t => ({
      ...t,
      sectors: t.sectors.includes(s) ? t.sectors.filter(x => x !== s) : [...t.sectors, s]
    }));

  const toggleStage = (s: string) =>
    setThesis(t => ({
      ...t,
      stages: t.stages.includes(s) ? t.stages.filter(x => x !== s) : [...t.stages, s]
    }));

  const toggleGeo = (g: string) =>
    setThesis(t => ({
      ...t,
      geographies: t.geographies.includes(g) ? t.geographies.filter(x => x !== g) : [...t.geographies, g]
    }));

  const handleSave = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
    // In production: POST to /api/thesis
  };

  const STATS = [
    { label: "Applications Reviewed", value: "48", color: "text-white" },
    { label: "Deployed", value: "0", color: "text-green-400" },
    { label: "In Diligence", value: "5", color: "text-amber-400" },
    { label: "Watching", value: "8", color: "text-blue-400" },
    { label: "Passed", value: "35", color: "text-white/40" },
    { label: "Avg Time to Decision", value: "18h", color: "text-purple-400" },
    { label: "Outreach Sent", value: "12", color: "text-sky-400" },
    { label: "Reply Rate", value: "25%", color: "text-emerald-400" },
  ];

  return (
    <div className="h-full flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="text-rose-400" size={22} />
            Investor Profile
          </h2>
          {activeTab === "thesis" && (
            <button
              onClick={editing ? handleSave : () => setEditing(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors border ${editing
                ? "bg-green-500/15 border-green-500/30 text-green-400"
                : "border-white/10 text-white/40 hover:text-white/70"
                }`}
            >
              {editing ? <><Save size={12} /> Save Thesis</> : <><Edit3 size={12} /> Edit</>}
            </button>
          )}
        </div>

        {saved && (
          <div className="mb-3 flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs">
            <CheckCircle2 size={14} /> Thesis saved — all future scoring will use these parameters.
          </div>
        )}

        <div className="flex gap-1">
          {(["profile", "thesis", "stats"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${activeTab === tab ? "bg-rose-500/20 border border-rose-500/30 text-rose-400" : "text-white/40 hover:text-white/60"}`}>
              {tab === "profile" ? "Profile" : tab === "thesis" ? "Thesis Engine" : "Fund Stats"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Profile Tab ── */}
        {activeTab === "profile" && (
          <>
            {/* Avatar card */}
            <div className="bg-gradient-to-br from-rose-500/10 to-purple-500/10 border border-white/8 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shrink-0">
                SC
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Sarah Chen</h3>
                <p className="text-sm text-white/50">Principal · {thesis.fund_name}</p>
                <p className="text-xs text-white/30 mt-1">investor@conviction.vc</p>
              </div>
            </div>

            {/* Fund Overview */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-4">
              <h4 className="text-xs text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 size={12} /> Fund Overview
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Fund Size", value: thesis.fund_size, icon: DollarSign },
                  { label: "Check Size", value: `$${thesis.check_size_min}K–$${thesis.check_size_max}K`, icon: Target },
                  { label: "Ownership Target", value: thesis.ownership_target, icon: TrendingUp },
                  { label: "Risk Appetite", value: thesis.risk_appetite, icon: Shield },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={14} className="text-white/30 shrink-0" />
                    <div>
                      <p className="text-xs text-white/30">{label}</p>
                      <p className="text-sm font-semibold text-white capitalize">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thesis Summary */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-4">
              <h4 className="text-xs text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap size={12} /> Active Thesis
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/30 mb-1.5">Sectors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {thesis.sectors.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-1.5">Stages</p>
                  <div className="flex gap-1.5">
                    {thesis.stages.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/50">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-1.5">Geographies</p>
                  <div className="flex gap-1.5">
                    {thesis.geographies.map(g => (
                      <span key={g} className="px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/50 flex items-center gap-1">
                        <Globe size={10} /> {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Thesis Engine Tab ── */}
        {activeTab === "thesis" && (
          <>
            <div className="bg-white/2 border border-white/6 rounded-xl p-4 space-y-5">
              {/* Sectors */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Tag size={11} /> Target Sectors
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SECTORS.map(s => (
                    <ToggleChip key={s} label={s} active={thesis.sectors.includes(s)}
                      onToggle={editing ? () => toggleSector(s) : () => { }} />
                  ))}
                </div>
              </div>

              {/* Stages */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Investment Stage</label>
                <div className="flex gap-1.5">
                  {ALL_STAGES.map(s => (
                    <ToggleChip key={s} label={s} active={thesis.stages.includes(s)}
                      onToggle={editing ? () => toggleStage(s) : () => { }} />
                  ))}
                </div>
              </div>

              {/* Geographies */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Globe size={11} /> Geographies
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_GEOS.map(g => (
                    <ToggleChip key={g} label={g} active={thesis.geographies.includes(g)}
                      onToggle={editing ? () => toggleGeo(g) : () => { }} />
                  ))}
                </div>
              </div>

              {/* Check Size */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <DollarSign size={11} /> Check Size Range
                </label>
                <div className="flex gap-3">
                  {[
                    { label: "Min ($K)", key: "check_size_min" as keyof ThesisConfig },
                    { label: "Max ($K)", key: "check_size_max" as keyof ThesisConfig },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex-1">
                      <label className="text-xs text-white/20 block mb-1">{label}</label>
                      <input
                        type="number"
                        value={thesis[key] as number}
                        onChange={e => editing && setThesis(t => ({ ...t, [key]: Number(e.target.value) }))}
                        readOnly={!editing}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50 disabled:opacity-60"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Appetite */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Shield size={11} /> Risk Appetite
                </label>
                <div className="flex gap-2">
                  {(["conservative", "balanced", "aggressive"] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => editing && setThesis(t => ({ ...t, risk_appetite: r }))}
                      className={`flex-1 py-2 rounded-lg text-xs border capitalize transition-colors ${thesis.risk_appetite === r
                        ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                        : "bg-white/5 border-white/10 text-white/30"
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!editing && (
              <p className="text-xs text-white/25 text-center">
                These parameters filter and score every inbound application and outbound signal automatically.
              </p>
            )}
          </>
        )}

        {/* ── Stats Tab ── */}
        {activeTab === "stats" && (
          <div className="grid grid-cols-2 gap-3">
            {STATS.map((stat, i) => (
              <div key={i} className="bg-white/3 border border-white/8 rounded-xl p-4">
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-white/30 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
