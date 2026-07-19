"use client";
import React, { useState, useEffect } from "react";
import { Search, Filter, Star, ExternalLink, Loader2, AlertCircle, SlidersHorizontal, Globe, DollarSign, TrendingUp } from "lucide-react";

const SECTORS = ["AI Infrastructure", "Developer Tools", "Enterprise SaaS", "Fintech", "HealthTech", "Climate Tech", "Cybersecurity", "EdTech"];
const STAGES = ["Pre-Seed", "Seed", "Series A"];
const GEOS = ["North America", "Europe", "Asia", "Global"];

interface Investor {
  id: string;
  name: string;
  firm?: string;
  bio?: string;
  sectors?: string[];
  stages?: string[];
  geographies?: string[];
  check_size_min?: number;
  check_size_max?: number;
  portfolio_count?: number;
  email?: string;
}

const MOCK_INVESTORS: Investor[] = [
  { id: "1", name: "Sarah Chen", firm: "Lightspeed Venture Partners", bio: "Investing in bold founders building developer tools and AI infra. Ex-Google.", sectors: ["AI Infrastructure", "Developer Tools"], stages: ["Pre-Seed", "Seed"], geographies: ["North America"], check_size_min: 100000, check_size_max: 500000, portfolio_count: 23 },
  { id: "2", name: "Marcus Taylor", firm: "a16z", bio: "Crypto-native VC at a16z. Former founder of 2 B2B SaaS exits. Love operators who've done it before.", sectors: ["Enterprise SaaS", "Fintech"], stages: ["Seed", "Series A"], geographies: ["North America", "Europe"], check_size_min: 500000, check_size_max: 2000000, portfolio_count: 47 },
  { id: "3", name: "Priya Sharma", firm: "Sequoia Capital India", bio: "Southeast Asia & India focus. HealthTech, FinTech for the next billion users.", sectors: ["HealthTech", "Fintech"], stages: ["Pre-Seed", "Seed"], geographies: ["Asia"], check_size_min: 50000, check_size_max: 300000, portfolio_count: 18 },
  { id: "4", name: "Lena Müller", firm: "Point Nine Capital", bio: "B2B SaaS specialist. Angel in 60+ companies. Berlin-based but investing globally.", sectors: ["Enterprise SaaS", "Developer Tools"], stages: ["Pre-Seed", "Seed"], geographies: ["Europe", "Global"], check_size_min: 200000, check_size_max: 1000000, portfolio_count: 61 },
  { id: "5", name: "James O'Brien", firm: "GV (Google Ventures)", bio: "Climate Tech & EdTech investor. Previously scientist. Love deep tech with clear path to scale.", sectors: ["Climate Tech", "EdTech"], stages: ["Seed", "Series A"], geographies: ["North America", "Global"], check_size_min: 300000, check_size_max: 2000000, portfolio_count: 34 },
];

export default function InvestorSearchApp() {
  const [query, setQuery] = useState("");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedGeos, setSelectedGeos] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading] = useState(false);
  const [pitchModal, setPitchModal] = useState<Investor | null>(null);
  const [pitchMessage, setPitchMessage] = useState("");
  const [sentPitches, setSentPitches] = useState<Set<string>>(new Set());

  const toggleFilter = (arr: string[], item: string, setter: (a: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const filtered = MOCK_INVESTORS.filter(inv => {
    const matchQuery = !query || inv.name.toLowerCase().includes(query.toLowerCase()) || 
      (inv.firm || "").toLowerCase().includes(query.toLowerCase()) ||
      (inv.bio || "").toLowerCase().includes(query.toLowerCase());
    const matchSector = selectedSectors.length === 0 || selectedSectors.some(s => inv.sectors?.includes(s));
    const matchStage = selectedStages.length === 0 || selectedStages.some(s => inv.stages?.includes(s));
    const matchGeo = selectedGeos.length === 0 || selectedGeos.some(g => inv.geographies?.includes(g));
    return matchQuery && matchSector && matchStage && matchGeo;
  });

  const sendPitch = async () => {
    if (!pitchModal || !pitchMessage.trim()) return;
    setSentPitches(prev => new Set(prev).add(pitchModal.id));
    setPitchModal(null);
    setPitchMessage("");
  };

  return (
    <div className="h-full flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-3">
          <Search className="text-emerald-400" size={22} />
          Investor Search
        </h2>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <Search size={16} className="text-white/30" />
            <input
              type="text"
              placeholder="Search investors, firms, bio..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${showFilters ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}
          >
            <SlidersHorizontal size={16} />
            Filters {(selectedSectors.length + selectedStages.length + selectedGeos.length) > 0 && `(${selectedSectors.length + selectedStages.length + selectedGeos.length})`}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-4 bg-white/3 border border-white/5 rounded-xl space-y-3">
            <div>
              <p className="text-xs text-white/40 mb-2">Sectors</p>
              <div className="flex flex-wrap gap-1.5">
                {SECTORS.map(s => (
                  <button key={s} onClick={() => toggleFilter(selectedSectors, s, setSelectedSectors)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${selectedSectors.includes(s) ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-2">Stage</p>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map(s => (
                  <button key={s} onClick={() => toggleFilter(selectedStages, s, setSelectedStages)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${selectedStages.includes(s) ? "bg-blue-500/20 border-blue-500/30 text-blue-400" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-2">Geography</p>
              <div className="flex flex-wrap gap-1.5">
                {GEOS.map(g => (
                  <button key={g} onClick={() => toggleFilter(selectedGeos, g, setSelectedGeos)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${selectedGeos.includes(g) ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-xs text-white/30 mb-2">{filtered.length} investors found</p>
        {filtered.map(inv => (
          <div key={inv.id} className="bg-[#0d0d10] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center shrink-0 font-bold text-emerald-300">
                  {inv.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{inv.name}</h3>
                  <p className="text-xs text-white/40">{inv.firm}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-center px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                  <div className="text-sm font-bold text-white">{inv.portfolio_count}</div>
                  <div className="text-xs text-white/30">Portfolio</div>
                </div>
              </div>
            </div>

            <p className="text-sm text-white/60 mt-3 leading-relaxed">{inv.bio}</p>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {inv.sectors?.map(s => (
                <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{s}</span>
              ))}
              {inv.stages?.map(s => (
                <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400">{s}</span>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-1 text-xs text-white/30">
                <DollarSign size={12} />
                ${(inv.check_size_min || 0).toLocaleString()} – ${(inv.check_size_max || 0).toLocaleString()}
                <span className="ml-2 flex items-center gap-1"><Globe size={12} />{inv.geographies?.join(", ")}</span>
              </div>
              {sentPitches.has(inv.id) ? (
                <span className="text-xs text-green-400 flex items-center gap-1">✓ Pitch Sent</span>
              ) : (
                <button
                  onClick={() => setPitchModal(inv)}
                  className="px-3 py-1.5 text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                >
                  Send Pitch →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pitch Modal */}
      {pitchModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-1">Pitch to {pitchModal.name}</h3>
            <p className="text-xs text-white/40 mb-4">{pitchModal.firm}</p>
            <textarea
              rows={5}
              placeholder="Write your pitch — what you're building, why now, and why you're the team to do it..."
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm outline-none resize-none focus:border-emerald-500/50 placeholder:text-white/20"
              value={pitchMessage}
              onChange={e => setPitchMessage(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPitchModal(null)} className="flex-1 py-2 rounded-lg border border-white/10 text-white/50 hover:bg-white/5 text-sm transition-colors">Cancel</button>
              <button onClick={sendPitch} className="flex-1 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 text-sm transition-colors">Send Pitch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
