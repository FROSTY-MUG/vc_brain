"use client";
import React, { useState, useEffect } from "react";
import {
  FileText, Search, Upload, ChevronRight, X, Building2,
  DollarSign, TrendingUp, Tag, Globe, Clock, Plus, CheckCircle2,
  LayoutGrid, List, Filter, Presentation, Loader2
} from "lucide-react";
import { PitchDeck } from "@/data/demoData";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Defined OUTSIDE the parent component so React never remounts it on re-render ──
const Field = ({
  label, field, placeholder, type = "text", form, errors, setForm, setErrors,
}: {
  label: string;
  field: string;
  placeholder?: string;
  type?: string;
  form: Record<string, string>;
  errors: Record<string, string | undefined>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
}) => (
  <div>
    <label className="block text-xs text-white/50 mb-1.5">{label}</label>
    <input
      type={type}
      value={form[field] ?? ""}
      onChange={(e) => {
        setForm((p) => ({ ...p, [field]: e.target.value }));
        setErrors((p) => ({ ...p, [field]: undefined }));
      }}
      placeholder={placeholder}
      className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500/50 placeholder:text-white/20 transition-colors ${
        errors[field] ? "border-red-500/50" : "border-white/10"
      }`}
    />
    {errors[field] && <p className="text-xs text-red-400 mt-1">{errors[field]}</p>}
  </div>
);

const SECTORS = ["AI Infrastructure", "Climate Tech", "Fintech", "HealthTech", "Developer Tools", "EdTech", "Web3", "Cybersecurity"];
const STAGES = ["Pre-Seed", "Seed", "Series A"];

const SECTOR_COLORS: Record<string, string> = {
  "AI Infrastructure": "text-violet-400 bg-violet-500/10 border-violet-500/20",
  "Climate Tech": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "Fintech": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "HealthTech": "text-rose-400 bg-rose-500/10 border-rose-500/20",
  "Developer Tools": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "EdTech": "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  "Web3": "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "Cybersecurity": "text-red-400 bg-red-500/10 border-red-500/20",
};

const STAGE_COLORS: Record<string, string> = {
  "Pre-Seed": "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "Seed": "text-lime-400 bg-lime-500/10 border-lime-500/20",
  "Series A": "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : `$${(n / 1_000).toFixed(0)}K`;

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

interface SubmitForm {
  company: string;
  founderName: string;
  tagline: string;
  sector: string;
  stage: string;
  raising: string;
  equity: string;
  description: string;
  traction: string;
  deckUrl: string;
}

const EMPTY_FORM: SubmitForm = {
  company: "", founderName: "", tagline: "", sector: "", stage: "",
  raising: "", equity: "", description: "", traction: "", deckUrl: "",
};

export default function PitchDeckApp() {
  const [tab, setTab] = useState<"browse" | "submit">("browse");
  const [decks, setDecks] = useState<PitchDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PitchDeck | null>(null);
  const [query, setQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [form, setForm] = useState<SubmitForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<SubmitForm>>({});

  // Factory that creates a Field bound to this component's state — avoids
  // defining Field inside the render body (which would cause React to remount
  // the input on every render, making it impossible to type into).
  const F = React.useCallback(
    (props: { label: string; field: keyof SubmitForm; placeholder?: string; type?: string }) => (
      <Field
        {...props}
        form={form as Record<string, string>}
        errors={errors as Record<string, string | undefined>}
        setForm={setForm as React.Dispatch<React.SetStateAction<Record<string, string>>>}
        setErrors={setErrors as React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>}
      />
    ),
    [form, errors, setForm, setErrors]
  );

  // Fetch real applications from backend on mount
  useEffect(() => {
    fetch(`${API}/api/applications/`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: PitchDeck[] = data.map((a: { id: string; startups?: { name?: string; sector?: string; stage?: string; website?: string }; raw_text?: string; deck_url?: string; submitted_at?: string; founder_name?: string }) => ({
            id: a.id,
            founderId: a.id,
            founderName: a.founder_name || "Unknown Founder",
            company: a.startups?.name || "Unknown Company",
            tagline: (a.raw_text || "").slice(0, 100),
            sector: a.startups?.sector || "Unknown",
            stage: a.startups?.stage || "Unknown",
            raising: 0,
            description: a.raw_text || "",
            traction: "",
            deckUrl: a.deck_url,
            submittedAt: a.submitted_at || new Date().toISOString(),
          }));
          setDecks(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = decks.filter((d) => {
    const q = query.toLowerCase();
    const matchQ = !q || d.company.toLowerCase().includes(q) || d.founderName.toLowerCase().includes(q) || d.tagline.toLowerCase().includes(q);
    const matchS = !sectorFilter || d.sector === sectorFilter;
    const matchSt = !stageFilter || d.stage === stageFilter;
    return matchQ && matchS && matchSt;
  });

  const validate = (): boolean => {
    const e: Partial<SubmitForm> = {};
    if (!form.company.trim()) e.company = "Required";
    if (!form.founderName.trim()) e.founderName = "Required";
    if (!form.tagline.trim()) e.tagline = "Required";
    if (!form.sector) e.sector = "Required";
    if (!form.stage) e.stage = "Required";
    if (!form.raising.trim() || isNaN(Number(form.raising))) e.raising = "Enter a number";
    if (!form.description.trim()) e.description = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const newDeck: PitchDeck = {
      id: `deck_${Date.now()}`,
      founderId: `fnd_custom_${Date.now()}`,
      founderName: form.founderName,
      company: form.company,
      tagline: form.tagline,
      sector: form.sector,
      stage: form.stage,
      raising: Number(form.raising) * 1000,
      description: form.description,
      traction: form.traction || "Just getting started",
      deckUrl: form.deckUrl || "#",
      submittedAt: new Date().toISOString(),
    };
    setDecks((prev) => [newDeck, ...prev]);
    setForm(EMPTY_FORM);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };


  return (
    <div className="absolute inset-0 flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/5 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Presentation className="text-amber-400" size={20} />
            <h2 className="font-bold text-lg tracking-tight">Pitch Deck Locator</h2>
            <span className="text-xs px-2 py-0.5 bg-amber-500/15 border border-amber-500/25 text-amber-400 rounded-full ml-1">
              {decks.length} decks
            </span>
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setTab("browse")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${tab === "browse" ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white/70"}`}
            >
              <span className="flex items-center gap-1.5"><LayoutGrid size={13} /> Browse</span>
            </button>
            <button
              onClick={() => setTab("submit")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${tab === "submit" ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white/70"}`}
            >
              <span className="flex items-center gap-1.5"><Plus size={13} /> Submit Deck</span>
            </button>
          </div>
        </div>

        {tab === "browse" && (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <Search size={14} className="text-white/30 shrink-0" />
              <input
                type="text"
                placeholder="Search company, founder, pitch..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/25"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && <button onClick={() => setQuery("")}><X size={14} className="text-white/30 hover:text-white/60" /></button>}
            </div>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white/60 outline-none"
            >
              <option value="">All Sectors</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white/60 outline-none"
            >
              <option value="">All Stages</option>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode("grid")} className={`px-2.5 transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30"}`}>
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setViewMode("list")} className={`px-2.5 transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/30"}`}>
                <List size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BROWSE TAB */}
      {tab === "browse" && (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">Loading pitch decks…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
              <FileText size={40} />
              <p className="text-sm">{query || sectorFilter || stageFilter ? "No pitch decks match your search" : "No pitch decks yet — submit the first one!"}</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => setSelected(deck)}
                  className="text-left bg-[#0d0e12] border border-white/5 rounded-xl p-4 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-300 shrink-0">
                      {deck.company.charAt(0)}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STAGE_COLORS[deck.stage] || "text-white/40 bg-white/5 border-white/10"}`}>
                      {deck.stage}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-0.5">{deck.company}</h3>
                  <p className="text-xs text-white/40 mb-3 leading-relaxed line-clamp-2">{deck.tagline}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${SECTOR_COLORS[deck.sector] || "text-white/40 bg-white/5 border-white/10"}`}>
                      {deck.sector}
                    </span>
                    <span className="text-xs font-bold text-amber-400">{fmt(deck.raising)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-3 text-[10px] text-white/25">
                    <Clock size={10} />{timeAgo(deck.submittedAt)} · {deck.founderName}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => setSelected(deck)}
                  className="w-full text-left bg-[#0d0e12] border border-white/5 rounded-xl p-4 hover:border-amber-500/30 transition-all flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-300 shrink-0">
                    {deck.company.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{deck.company}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${SECTOR_COLORS[deck.sector] || ""}`}>{deck.sector}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STAGE_COLORS[deck.stage] || ""}`}>{deck.stage}</span>
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">{deck.tagline}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold text-amber-400">{fmt(deck.raising)}</div>
                    <div className="text-[10px] text-white/30">{timeAgo(deck.submittedAt)}</div>
                  </div>
                  <ChevronRight size={16} className="text-white/20 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBMIT TAB */}
      {tab === "submit" && (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5">
          {submitted ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h3 className="font-bold text-lg">Deck Submitted!</h3>
              <p className="text-sm text-white/50 text-center max-w-xs">
                Your pitch deck is now visible to investors browsing the locator.
              </p>
              <button
                onClick={() => setTab("browse")}
                className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30 transition-colors"
              >
                View All Decks
              </button>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-4">
              <div>
                <h3 className="font-bold text-base mb-1 flex items-center gap-2">
                  <Upload size={16} className="text-amber-400" />
                  Submit Your Pitch Deck
                </h3>
                <p className="text-xs text-white/40">Fill in your startup details. Investors can discover and request your full deck.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <F label="Company Name *" field="company" placeholder="e.g. NeuralFlow" />
                <F label="Your Name *" field="founderName" placeholder="e.g. Arjun Sharma" />
              </div>

              <F label="One-line Tagline *" field="tagline" placeholder="e.g. AI inference 10x cheaper on edge devices" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Sector *</label>
                  <select
                    value={form.sector}
                    onChange={(e) => { setForm((p) => ({ ...p, sector: e.target.value })); setErrors((p) => ({ ...p, sector: undefined })); }}
                    className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500/50 transition-colors ${errors.sector ? "border-red-500/50" : "border-white/10"}`}
                  >
                    <option value="">Select sector...</option>
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.sector && <p className="text-xs text-red-400 mt-1">{errors.sector}</p>}
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Stage *</label>
                  <select
                    value={form.stage}
                    onChange={(e) => { setForm((p) => ({ ...p, stage: e.target.value })); setErrors((p) => ({ ...p, stage: undefined })); }}
                    className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500/50 transition-colors ${errors.stage ? "border-red-500/50" : "border-white/10"}`}
                  >
                    <option value="">Select stage...</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.stage && <p className="text-xs text-red-400 mt-1">{errors.stage}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Raising (in $K) *</label>
                  <div className="relative">
                    <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="number"
                      value={form.raising}
                      onChange={(e) => { setForm((p) => ({ ...p, raising: e.target.value })); setErrors((p) => ({ ...p, raising: undefined })); }}
                      placeholder="e.g. 800"
                      className={`w-full bg-white/5 border rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-amber-500/50 placeholder:text-white/20 transition-colors ${errors.raising ? "border-red-500/50" : "border-white/10"}`}
                    />
                  </div>
                  {errors.raising && <p className="text-xs text-red-400 mt-1">{errors.raising}</p>}
                </div>
                <F label="Equity Offered" field="equity" placeholder="e.g. 8%" />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Description *</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => { setForm((p) => ({ ...p, description: e.target.value })); setErrors((p) => ({ ...p, description: undefined })); }}
                  placeholder="What are you building, why now, what's your unique insight..."
                  className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500/50 placeholder:text-white/20 resize-none transition-colors ${errors.description ? "border-red-500/50" : "border-white/10"}`}
                />
                {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Traction / Metrics</label>
                <input
                  type="text"
                  value={form.traction}
                  onChange={(e) => setForm((p) => ({ ...p, traction: e.target.value }))}
                  placeholder="e.g. $120K ARR · 4 pilots · 2 patents"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500/50 placeholder:text-white/20"
                />
              </div>

              <F label="Deck Link (Google Slides, Notion, etc.)" field="deckUrl" placeholder="https://..." />

              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold rounded-xl hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Submit Pitch Deck
              </button>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selected && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#0f1014] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="p-5 border-b border-white/5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/15 border border-amber-500/25 flex items-center justify-center text-lg font-bold text-amber-300">
                  {selected.company.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selected.company}</h3>
                  <p className="text-xs text-white/40">{selected.founderName}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-white/70 italic">"{selected.tagline}"</p>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-amber-400">{fmt(selected.raising)}</div>
                  <div className="text-[10px] text-white/30 mt-0.5">Raising</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full border inline-block ${STAGE_COLORS[selected.stage] || ""}`}>{selected.stage}</div>
                  <div className="text-[10px] text-white/30 mt-1">Stage</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full border inline-block ${SECTOR_COLORS[selected.sector] || ""}`}>{selected.sector}</div>
                  <div className="text-[10px] text-white/30 mt-1">Sector</div>
                </div>
              </div>

              <div>
                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">About</p>
                <p className="text-sm text-white/70 leading-relaxed">{selected.description}</p>
              </div>

              <div>
                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider flex items-center gap-1.5"><TrendingUp size={12} />Traction</p>
                <p className="text-sm text-emerald-400 font-medium">{selected.traction}</p>
              </div>

              <div className="flex gap-2 pt-2">
                {selected.deckUrl && selected.deckUrl !== "#" ? (
                  <a
                    href={selected.deckUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 text-center bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-colors"
                  >
                    View Full Deck →
                  </a>
                ) : (
                  <div className="flex-1 py-2.5 text-center bg-white/5 border border-white/10 text-white/30 rounded-xl text-sm">
                    Deck available on request
                  </div>
                )}
              </div>
              <p className="text-[10px] text-white/20 flex items-center gap-1"><Clock size={10} />Submitted {timeAgo(selected.submittedAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
