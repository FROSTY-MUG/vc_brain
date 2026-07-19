"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  FileText, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  XCircle, Lock, TrendingUp, TrendingDown, Minus, Loader2,
  RefreshCw, Download, Building2, Lightbulb, BarChart3, Users,
  Cpu, Globe, Swords, Rocket, DollarSign, Table2, ClipboardList,
  LogOut, HelpCircle, ExternalLink, Eye
} from "lucide-react";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
interface MemoSection {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  required: boolean;
}

interface Application {
  id: string;
  startups?: { name?: string; sector?: string; stage?: string; geography?: string };
  status?: string;
  submitted_at?: string;
  opportunity_scores?: {
    founder_score?: number;
    market_score?: number;
    idea_score?: number;
    recommendation?: string;
    thesis_alignment?: number;
  };
  memos?: { content_json?: Record<string, unknown>; recommendation?: string; generated_at?: string };
}

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const SECTIONS: MemoSection[] = [
  { key: "company_snapshot", label: "Company Snapshot", icon: Building2, color: "text-amber-400", required: true },
  { key: "investment_hypotheses", label: "Investment Hypotheses", icon: Lightbulb, color: "text-yellow-400", required: true },
  { key: "swot", label: "SWOT Analysis", icon: BarChart3, color: "text-green-400", required: true },
  { key: "team_and_history", label: "Team & History", icon: Users, color: "text-blue-400", required: true },
  { key: "problem_and_product", label: "Problem & Product", icon: Rocket, color: "text-purple-400", required: true },
  { key: "technology_and_defensibility", label: "Technology & Defensibility", icon: Cpu, color: "text-cyan-400", required: false },
  { key: "market_sizing", label: "Market Sizing", icon: Globe, color: "text-indigo-400", required: false },
  { key: "competition", label: "Competition", icon: Swords, color: "text-rose-400", required: false },
  { key: "traction_and_kpis", label: "Traction & KPIs", icon: TrendingUp, color: "text-emerald-400", required: true },
  { key: "financials_and_round", label: "Financials & Round", icon: DollarSign, color: "text-orange-400", required: false },
  { key: "cap_table", label: "Cap Table", icon: Table2, color: "text-slate-400", required: false },
  { key: "due_diligence_log", label: "Due Diligence Log", icon: ClipboardList, color: "text-teal-400", required: false },
  { key: "exit_perspective", label: "Exit Perspective", icon: LogOut, color: "text-pink-400", required: false },
  { key: "recommendation", label: "Recommendation", icon: CheckCircle2, color: "text-white", required: true },
];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function isNotDisclosed(value: unknown): boolean {
  if (!value) return true;
  const s = JSON.stringify(value).toLowerCase();
  return (
    s.includes("not disclosed") ||
    s.includes("unavailable") ||
    s.includes("not provided") ||
    s.includes("not confirmed") ||
    s.includes("confidential")
  );
}

function hasMissingFlag(value: unknown): boolean {
  if (!value) return false;
  const s = JSON.stringify(value).toLowerCase();
  return s.includes("missing") || s.includes("not provided") || s.includes("requested");
}

/** Highlights [Source: ...] citations in text */
function CitedText({ text }: { text: string }) {
  if (typeof text !== "string") return <span>{JSON.stringify(text)}</span>;
  const parts = text.split(/(\[Source:[^\]]+\])/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("[Source:") ? (
          <span key={i} className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
            <ExternalLink size={9} />
            {part.replace(/^\[Source:\s*/, "").replace(/\]$/, "")}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

/** Badge for not-disclosed / confidential data */
function NotDisclosedBadge({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
      <Lock size={10} />
      {label || "Not disclosed"}
    </span>
  );
}

/** Red contradiction / warning badge */
function FlagBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
      <AlertTriangle size={10} />
      {text}
    </span>
  );
}

/** Render any section content adaptively */
function SectionContent({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <NotDisclosedBadge />;
  }

  if (isNotDisclosed(value) && typeof value === "string") {
    return <NotDisclosedBadge label={value} />;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <NotDisclosedBadge />;
    return (
      <ul className="space-y-2">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
            <span className="text-sm text-white/70 leading-relaxed">
              {typeof item === "string" ? <CitedText text={item} /> : JSON.stringify(item)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object" && value !== null) {
    return (
      <div className="space-y-3">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <p className="text-xs text-white/30 uppercase tracking-wider mb-1">{k.replace(/_/g, " ")}</p>
            <SectionContent value={v} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <p className="text-sm text-white/70 leading-relaxed">
      <CitedText text={String(value)} />
    </p>
  );
}

/** Special renderer for the SWOT section */
function SwotSection({ swot }: { swot: Record<string, string[]> }) {
  const quadrants = [
    { key: "strengths", label: "Strengths", color: "text-green-400", bg: "bg-green-500/5 border-green-500/10" },
    { key: "weaknesses", label: "Weaknesses", color: "text-red-400", bg: "bg-red-500/5 border-red-500/10" },
    { key: "opportunities", label: "Opportunities", color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/10" },
    { key: "threats", label: "Threats / Risks", color: "text-orange-400", bg: "bg-orange-500/5 border-orange-500/10" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {quadrants.map(({ key, label, color, bg }) => (
        <div key={key} className={`${bg} border rounded-xl p-3`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${color} mb-2`}>{label}</p>
          {Array.isArray(swot[key]) && swot[key].length > 0 ? (
            <ul className="space-y-1.5">
              {swot[key].map((item, i) => (
                <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                  <span className={`mt-1 w-1 h-1 rounded-full shrink-0 ${color.replace("text-", "bg-")}`} />
                  <CitedText text={item} />
                </li>
              ))}
            </ul>
          ) : (
            <NotDisclosedBadge />
          )}
        </div>
      ))}
    </div>
  );
}

/** Recommendation banner */
function RecommendationBanner({ rec }: { rec: Record<string, unknown> }) {
  const action = (rec?.action as string || "diligence").toLowerCase();
  const confidence = (rec?.confidence as string || "LOW");
  const reasoning = rec?.reasoning as string || "";
  const openQs = rec?.open_questions as string[] || [];

  const config: Record<string, { bg: string; border: string; text: string; icon: React.ElementType; label: string }> = {
    deploy: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", icon: CheckCircle2, label: "DEPLOY" },
    diligence: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: Eye, label: "DILIGENCE" },
    watch: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", icon: Eye, label: "WATCH" },
    pass: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: XCircle, label: "PASS" },
  };
  const cfg = config[action] || config.diligence;
  const Icon = cfg.icon;

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon size={24} className={cfg.text} />
        <div>
          <p className={`text-xl font-black ${cfg.text} tracking-tight`}>{cfg.label}</p>
          <p className="text-xs text-white/30">Confidence: {confidence}</p>
        </div>
      </div>
      {reasoning && (
        <p className="text-sm text-white/70 leading-relaxed mb-3">
          <CitedText text={reasoning} />
        </p>
      )}
      {openQs.length > 0 && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1">
            <HelpCircle size={11} /> Open Questions for Next Meeting
          </p>
          <ul className="space-y-1">
            {openQs.map((q, i) => (
              <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                <span className="text-white/20">{i + 1}.</span> {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function MemoApp() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [memo, setMemo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(SECTIONS.map(s => s.key)));
  const [error, setError] = useState<string | null>(null);

  // Load application list
  useEffect(() => {
    fetch(`${API}/api/applications/`)
      .then(r => r.json())
      .then((data: Application[]) => {
        setApplications(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
      })
      .catch(() => setError("Could not reach backend — using seed data"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load memo for selected application
  const loadMemo = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/memo/${id}`);
      if (!r.ok) throw new Error("No memo yet");
      const data = await r.json();
      const content = data?.content_json || data;
      setMemo(typeof content === "string" ? JSON.parse(content) : content);
    } catch {
      setMemo(null);
      setError("No memo generated yet for this application.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) setTimeout(() => loadMemo(selectedId), 0);
  }, [selectedId, loadMemo]);

  const handleGenerate = async () => {
    if (!selectedId) return;
    setGenerating(true);
    try {
      const r = await fetch(`${API}/api/memo/generate/${selectedId}`, { method: "POST" });
      const data = await r.json();
      const content = data?.memo?.content_json || data?.memo;
      if (content) setMemo(typeof content === "string" ? JSON.parse(content) : content);
      else await loadMemo(selectedId);
    } catch {
      setError("Failed to generate memo. Check backend.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectedApp = applications.find(a => a.id === selectedId);
  const companyName = selectedApp?.startups?.name || "Unknown Company";
  const scores = selectedApp?.opportunity_scores;
  const recAction = (scores?.recommendation || memo?.recommendation as Record<string,unknown>)?.toString() || "diligence";

  const recBadgeColor: Record<string, string> = {
    deploy: "bg-green-500/20 text-green-400 border-green-500/30",
    diligence: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    watch: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    pass: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="h-full flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* ── Header ── */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-amber-400" size={22} />
            Investment Memo
            <span className="text-xs text-white/30 font-normal ml-1">Appendix 1</span>
          </h2>
          <div className="flex items-center gap-2">
            {memo && (
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(memo, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `memo_${companyName.replace(/\s+/g, "_")}.json`;
                  a.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/70 text-xs transition-colors"
              >
                <Download size={12} /> Export
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-xs transition-colors disabled:opacity-40"
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              {generating ? "Generating…" : memo ? "Re-generate" : "Generate Memo"}
            </button>
          </div>
        </div>

        {/* Application Picker */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-white/40 shrink-0">Application</label>
          <select
            value={selectedId || ""}
            onChange={e => setSelectedId(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500/50"
          >
            {applications.length === 0 && <option value="">No applications yet</option>}
            {applications.map(a => (
              <option key={a.id} value={a.id}>
                {a.startups?.name || "Unknown"} — {a.status || "pending"} — {new Date(a.submitted_at || "").toLocaleDateString()}
              </option>
            ))}
          </select>

          {/* Score pills */}
          {scores && (
            <div className="flex gap-1.5 shrink-0">
              {[
                { label: "F", score: scores.founder_score, color: "text-blue-400 border-blue-500/20 bg-blue-500/10" },
                { label: "M", score: scores.market_score, color: "text-green-400 border-green-500/20 bg-green-500/10" },
                { label: "I", score: scores.idea_score, color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
              ].map(({ label, score, color }) => (
                <div key={label} className={`${color} border rounded-lg px-2 py-1 text-xs font-bold`}>
                  {label} {score ?? "—"}
                </div>
              ))}
              <div className={`border rounded-lg px-2 py-1 text-xs font-bold capitalize ${recBadgeColor[recAction] || recBadgeColor.diligence}`}>
                {recAction}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-40 gap-2 text-white/40">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm">Loading memo…</span>
          </div>
        )}

        {!loading && error && !memo && (
          <div className="p-6">
            <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center">
              <FileText size={40} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/40 text-sm mb-4">{error}</p>
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedId}
                className="px-5 py-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl hover:bg-amber-500/25 text-sm transition-colors disabled:opacity-40"
              >
                {generating ? "Generating…" : "Generate Now"}
              </button>
            </div>
          </div>
        )}

        {!loading && memo && (
          <div className="p-4 space-y-2">
            {/* Company header */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">{companyName}</h1>
                  <div className="flex gap-2 mt-1.5">
                    {selectedApp?.startups?.sector && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">
                        {selectedApp.startups.sector}
                      </span>
                    )}
                    {selectedApp?.startups?.stage && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">
                        {selectedApp.startups.stage}
                      </span>
                    )}
                    {selectedApp?.startups?.geography && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">
                        {selectedApp.startups.geography}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/20">Generated</p>
                  <p className="text-xs text-white/50">
                    {selectedApp?.memos?.generated_at ? new Date(selectedApp.memos.generated_at).toLocaleString() : "Just now"}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendation Banner — always at top */}
            {memo.recommendation && (
              <RecommendationBanner rec={memo.recommendation as Record<string, unknown>} />
            )}

            {/* Sections */}
            {SECTIONS.filter(s => s.key !== "recommendation").map(section => {
              const value = memo[section.key];
              const isOpen = openSections.has(section.key);
              const missing = value === null || value === undefined || value === "";
              const confidential = isNotDisclosed(value);
              const hasWarning = hasMissingFlag(value);
              const Icon = section.icon;

              return (
                <div key={section.key} className="bg-white/2 border border-white/6 rounded-xl overflow-hidden hover:border-white/10 transition-colors">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0`}>
                      <Icon size={16} className={section.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{section.label}</span>
                        {section.required && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-white/5 text-white/25">Required</span>
                        )}
                        {confidential && <NotDisclosedBadge />}
                        {hasWarning && <FlagBadge text="Missing data" />}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-white/30 shrink-0" /> : <ChevronDown size={16} className="text-white/30 shrink-0" />}
                  </button>

                  {/* Section Content */}
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-white/5 pt-4">
                      {missing ? (
                        <NotDisclosedBadge label="No data available" />
                      ) : section.key === "swot" && typeof value === "object" && !Array.isArray(value) ? (
                        <SwotSection swot={value as Record<string, string[]>} />
                      ) : (
                        <SectionContent value={value} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Footer */}
            <div className="pt-2 pb-4 text-center">
              <p className="text-xs text-white/20">
                This memo is AI-generated and evidence-backed. Missing data is explicitly flagged — not fabricated.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
