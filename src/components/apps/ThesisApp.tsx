"use client";

import React, { useState } from "react";
import { demoThesis } from "@/data/seed";
import type { InvestorThesis } from "@/types";
import { Settings, Plus, X, Save } from "lucide-react";

const SECTORS = ["AI Infrastructure", "Developer Tools", "Enterprise SaaS", "Fintech", "HealthTech", "Climate Tech", "Cybersecurity", "Web3", "Robotics", "EdTech"];
const STAGES = ["pre-seed", "seed", "series-a"];
const GEOS = ["North America", "Europe", "Asia", "Latin America", "Africa", "Global"];
const RISK_LEVELS = ["conservative", "moderate", "aggressive"] as const;

const ThesisApp = () => {
  const [thesis, setThesis] = useState<InvestorThesis>(demoThesis);
  const [newKeyword, setNewKeyword] = useState("");
  const [saved, setSaved] = useState(false);

  const toggle = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 text-white h-full overflow-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-gold-400" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-gold-gradient">Thesis Engine</h2>
          <p className="text-xs text-white/50">Configure your investment criteria to filter and rank opportunities.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Sectors */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gold-300 mb-3">Target Sectors</h3>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((s) => (
              <button
                key={s}
                onClick={() => setThesis({ ...thesis, sectors: toggle(thesis.sectors, s) })}
                className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                  thesis.sectors.includes(s)
                    ? "bg-gold-500/20 border-gold-500/50 text-gold-300"
                    : "border-white/10 text-white/50 hover:border-white/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Stages */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gold-300 mb-3">Target Stages</h3>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => setThesis({ ...thesis, stages: toggle(thesis.stages, s) })}
                className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all border ${
                  thesis.stages.includes(s)
                    ? "bg-gold-500/20 border-gold-500/50 text-gold-300"
                    : "border-white/10 text-white/50 hover:border-white/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Geographies */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gold-300 mb-3">Target Geographies</h3>
          <div className="flex flex-wrap gap-2">
            {GEOS.map((g) => (
              <button
                key={g}
                onClick={() => setThesis({ ...thesis, geographies: toggle(thesis.geographies, g) })}
                className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                  thesis.geographies.includes(g)
                    ? "bg-gold-500/20 border-gold-500/50 text-gold-300"
                    : "border-white/10 text-white/50 hover:border-white/30"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Check Size & Ownership */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gold-300 mb-3">Financial Parameters</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/50">Check Size Range</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={thesis.checkSizeMin}
                  onChange={(e) => setThesis({ ...thesis, checkSizeMin: parseInt(e.target.value) || 0 })}
                  className="w-28 bg-black/50 border border-white/20 rounded px-2 py-1.5 text-sm focus:border-gold-500/50 outline-none"
                />
                <span className="text-white/30">to</span>
                <input
                  type="number"
                  value={thesis.checkSizeMax}
                  onChange={(e) => setThesis({ ...thesis, checkSizeMax: parseInt(e.target.value) || 0 })}
                  className="w-28 bg-black/50 border border-white/20 rounded px-2 py-1.5 text-sm focus:border-gold-500/50 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50">Ownership Target (%)</label>
              <input
                type="number"
                value={thesis.ownershipTarget}
                onChange={(e) => setThesis({ ...thesis, ownershipTarget: parseFloat(e.target.value) || 0 })}
                className="w-24 bg-black/50 border border-white/20 rounded px-2 py-1.5 text-sm focus:border-gold-500/50 outline-none mt-1"
              />
            </div>
          </div>
        </div>

        {/* Risk Appetite */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gold-300 mb-3">Risk Appetite</h3>
          <div className="flex gap-3">
            {RISK_LEVELS.map((r) => (
              <button
                key={r}
                onClick={() => setThesis({ ...thesis, riskAppetite: r })}
                className={`flex-1 px-3 py-3 rounded-lg text-xs uppercase tracking-wider transition-all border text-center ${
                  thesis.riskAppetite === r
                    ? r === "aggressive" ? "bg-red-500/20 border-red-500/50 text-red-300"
                    : r === "moderate" ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                    : "bg-green-500/20 border-green-500/50 text-green-300"
                    : "border-white/10 text-white/50 hover:border-white/30"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gold-300 mb-3">Thesis Keywords</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {thesis.keywords.map((kw) => (
              <span key={kw} className="px-2 py-1 bg-gold-500/10 border border-gold-500/30 rounded-full text-xs text-gold-300 flex items-center gap-1">
                {kw}
                <button onClick={() => setThesis({ ...thesis, keywords: thesis.keywords.filter((k) => k !== kw) })}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newKeyword.trim()) {
                  setThesis({ ...thesis, keywords: [...thesis.keywords, newKeyword.trim()] });
                  setNewKeyword("");
                }
              }}
              placeholder="Add keyword..."
              className="flex-1 bg-black/50 border border-white/20 rounded px-2 py-1.5 text-sm focus:border-gold-500/50 outline-none"
            />
            <button
              onClick={() => {
                if (newKeyword.trim()) {
                  setThesis({ ...thesis, keywords: [...thesis.keywords, newKeyword.trim()] });
                  setNewKeyword("");
                }
              }}
              className="p-2 glass-button rounded-lg"
            >
              <Plus size={14} className="text-gold-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Natural Language Thesis */}
      <div className="glass-panel rounded-xl p-4 mt-6">
        <h3 className="text-sm font-semibold text-gold-300 mb-3">Natural Language Thesis</h3>
        <textarea
          value={thesis.description}
          onChange={(e) => setThesis({ ...thesis, description: e.target.value })}
          className="w-full h-24 bg-black/50 border border-white/20 rounded-lg p-3 text-sm text-white/90 focus:border-gold-500/50 outline-none resize-none"
          placeholder="Describe your investment thesis in natural language..."
        />
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={save}
          className={`px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
            saved
              ? "bg-green-500/20 border border-green-500/50 text-green-300"
              : "bg-gold-500 text-black hover:bg-gold-400"
          }`}
        >
          <Save size={16} />
          {saved ? "Saved ✓" : "Save Thesis"}
        </button>
      </div>
    </div>
  );
};

export default ThesisApp;
