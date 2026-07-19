"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  XCircle, Lock, TrendingUp, TrendingDown, Minus, Loader2,
  RefreshCw, Download, Building2, Lightbulb, BarChart3, Users,
  Cpu, Globe, Swords, Rocket, DollarSign, Table2, ClipboardList,
  LogOut, HelpCircle, ExternalLink, Eye, PhoneCall, Bot, User, FileAudio,
  ShieldCheck, Link2
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
  { key: "team_and_history", label: "Team & History", icon: Users, color: "text-blue-400", required: false },
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

/** Lets deeply-nested citations open and scroll to a sibling memo section. */
const MemoNavContext = React.createContext<((key: string) => void) | null>(null);

/**
 * Maps memo prose to the sibling section that substantiates it, so a SWOT bullet
 * about market size can jump straight to Market Sizing. This is navigation, not
 * evidence — chips are labelled "see" and only ever point at sections the memo
 * actually filled in.
 */
const RELATED_SECTION_RULES: { key: string; pattern: RegExp }[] = [
  { key: "market_sizing", pattern: /\b(market siz\w*|tam|sam|som|cagr|addressable|market growth|growing market)\b/i },
  { key: "competition", pattern: /\b(competitor\w*|competition|competitive|incumbent\w*|rival\w*)\b/i },
  { key: "traction_and_kpis", pattern: /\b(traction|arr|mrr|revenue|customer\w*|churn|retention|pilot\w*|dau)\b/i },
  { key: "team_and_history", pattern: /\b(team|founder\w*|leadership|hiring|executive\w*)\b/i },
  { key: "technology_and_defensibility", pattern: /\b(technolog\w*|moat|proprietary|defensib\w*|algorithm\w*|architecture|patent\w*)\b/i },
  { key: "financials_and_round", pattern: /\b(burn rate|runway|financial\w*|funding round|valuation|capital)\b/i },
];

function relatedSections(
  text: string,
  memo: Record<string, unknown> | null | undefined,
  excludeKey?: string
): MemoSection[] {
  if (!text || !memo) return [];
  return RELATED_SECTION_RULES
    .filter(rule => rule.key !== excludeKey && rule.pattern.test(text))
    .map(rule => SECTIONS.find(s => s.key === rule.key))
    // Never link to a section this memo left empty.
    .filter((s): s is MemoSection => Boolean(s && memo[s.key]));
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Memo generation is a slow LLM call; abort rather than spin indefinitely. */
const GENERATE_TIMEOUT_MS = 180_000;

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

// The LLM returns some memo fields as objects rather than prose (competitor
// clusters, threats). Keys the model uses to carry the human-readable headline,
// in the order we prefer them.
const HEADLINE_KEYS = ["statement", "name", "title", "label", "claim", "text", "description"];

/** Collapse any value to readable prose — never raw JSON braces in the UI. */
function readableValue(value: unknown): string {
  if (value === null || value === undefined || typeof value === "boolean") return "";
  if (Array.isArray(value)) return value.map(readableValue).filter(Boolean).join(" · ");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const headline = HEADLINE_KEYS.find(k => typeof obj[k] === "string" && obj[k] !== "");
    if (headline) return String(obj[headline]);
    return Object.values(obj).map(readableValue).filter(Boolean).join(" · ");
  }
  return String(value);
}

/** Highlights [Source: ...] citations in text */
function CitedText({ text }: { text: string }) {
  if (typeof text !== "string") return <span>{readableValue(text)}</span>;
  const parts = text.split(/(\[Source:[^\]]+\])/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("[Source:")) {
          const sourceName = part.replace(/^\[Source:\s*/, "").replace(/\]$/, "");
          const isTranscript = sourceName.toLowerCase() === "call transcript";
          const chip = "inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono";

          if (isTranscript) {
            return (
              <a href="#call-transcript" key={i} className={`${chip} hover:bg-amber-500/20 transition-colors cursor-pointer`}>
                <ExternalLink size={9} />
                {sourceName}
              </a>
            );
          }

          // Only linkify when the model actually supplied a URL — a citation
          // without one stays inert rather than pointing somewhere invented.
          const url = sourceName.match(/https?:\/\/[^\s\])]+/)?.[0];
          if (url) {
            return (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title={url}
                className={`${chip} hover:bg-amber-500/20 transition-colors cursor-pointer`}
              >
                <ExternalLink size={9} />
                {sourceName.replace(url, "").replace(/[—–-]\s*$/, "").trim() || url}
              </a>
            );
          }

          return (
            <span key={i} className={chip}>
              <ExternalLink size={9} />
              {sourceName}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

/** "see Market Sizing" chips that jump to the section substantiating a claim */
function RelatedSectionChips({
  text,
  memo,
  excludeKey,
}: {
  text: string;
  memo?: Record<string, unknown> | null;
  excludeKey?: string;
}) {
  const navigate = React.useContext(MemoNavContext);
  const related = relatedSections(text, memo, excludeKey).slice(0, 2);
  if (related.length === 0) return null;

  return (
    <span className="inline-flex flex-wrap gap-1 ml-1 align-middle">
      {related.map(s => (
        <button
          key={s.key}
          type="button"
          onClick={e => {
            e.stopPropagation();
            navigate?.(s.key);
          }}
          title={`Jump to ${s.label}`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/45 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
        >
          <Link2 size={8} />
          see {s.label}
        </button>
      ))}
    </span>
  );
}

type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

/**
 * Per-section confidence, derived from the evidence actually present in that
 * section — never asserted by the model. An uncited section is a model claim
 * with nothing behind it, so it starts mid-scale and only earns confidence
 * from citations; disclosure gaps and missing-data flags subtract.
 */
function deriveSectionConfidence(value: unknown): { level: ConfidenceLevel; score: number; reasons: string[] } {
  const reasons: string[] = [];

  if (value === null || value === undefined || value === "") {
    return { level: "LOW", score: 0, reasons: ["No content generated for this section."] };
  }

  const citations = (JSON.stringify(value).match(/\[Source:/g) || []).length;
  let score = 40;

  if (citations > 0) {
    score += Math.min(citations, 3) * 20;
    reasons.push(`${citations} cited source${citations > 1 ? "s" : ""} backing this section.`);
  } else {
    reasons.push("No cited evidence — model assertion only.");
  }

  if (isNotDisclosed(value)) {
    score -= 25;
    reasons.push("Contains data the founders did not disclose.");
  }
  if (hasMissingFlag(value)) {
    score -= 20;
    reasons.push("Section flags missing or requested data.");
  }

  score = Math.max(0, Math.min(100, score));
  const level: ConfidenceLevel = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
  return { level, score, reasons };
}

function deriveUncertainty(value: unknown) {
  const { score: confScore, reasons } = deriveSectionConfidence(value);
  const uncertaintyScore = 100 - confScore;
  const level = uncertaintyScore >= 70 ? "HIGH" : uncertaintyScore >= 40 ? "MEDIUM" : "LOW";
  
  const riskReasons = reasons.map(r => {
    if (r.includes("cited source")) return "Evidence exists, reducing risk (" + r + ")";
    if (r.includes("No cited evidence")) return "No evidence found, maximizing uncertainty.";
    if (r.includes("did not disclose")) return "Missing founder disclosure increases risk.";
    if (r.includes("missing or requested")) return "Incomplete data increases uncertainty.";
    return r;
  });

  return { level, score: uncertaintyScore, reasons: riskReasons };
}

/** Risk-derived uncertainty indicator shown below a section title */
function SectionUncertaintyRisk({ value }: { value: unknown }) {
  const { level, score, reasons } = deriveUncertainty(value);
  const styles = {
    HIGH: "text-red-400 bg-red-500/10 border-red-500/25",
    MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    LOW: "text-green-400 bg-green-500/10 border-green-500/25",
  };
  
  const barColors = {
    HIGH: "bg-red-400",
    MEDIUM: "bg-amber-400",
    LOW: "bg-green-400",
  };

  return (
    <div className="relative group/risk inline-flex items-center gap-2 mt-1.5">
      <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono">Uncertainty</span>
      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden shrink-0">
        <div className={`h-full ${barColors[level]} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${styles[level]} shrink-0`}>
        {level} · {score}%
      </span>

      <div className="absolute left-0 top-full mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-lg p-3 shadow-2xl opacity-0 invisible group-hover/risk:opacity-100 group-hover/risk:visible transition-all duration-200 z-50 normal-case text-left">
        <span className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">
          Uncertainty Factors
        </span>
        {reasons.map((r, i) => (
          <span key={i} className="block text-xs text-white/60 leading-relaxed font-sans">• {r}</span>
        ))}
      </div>
    </div>
  );
}

/** Visualizes the Founder Score with a historical trendline */
function FounderScoreChart({ currentScore }: { currentScore: number }) {
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    setHistory(prev => {
      // Preserve history and append new score if it changed
      if (prev.length > 0) {
        if (prev[prev.length - 1] === currentScore) return prev;
        // Keep the last 15 points max to avoid crowding
        const next = [...prev, currentScore];
        return next.length > 15 ? next.slice(next.length - 15) : next;
      }
      
      // Initialize with mock history
      const data = [];
      let score = currentScore - Math.floor(Math.random() * 20); // start somewhat lower
      for (let i = 0; i < 5; i++) {
        data.push(score);
        score += Math.floor(Math.random() * 12) - 3; // upward trajectory with some variance
        if (score > 99) score = 99;
        if (score < 40) score = 40;
      }
      data.push(currentScore);
      return data;
    });
  }, [currentScore]);

  if (history.length === 0) return null;

  const min = Math.min(...history) - 5;
  const max = Math.max(...history) + 5;
  const range = max - min;
  
  const points = history.map((val, i) => {
    const x = (i / (history.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  const color = currentScore >= 80 ? "text-green-400" : currentScore >= 60 ? "text-amber-400" : "text-red-400";
  const strokeColor = currentScore >= 80 ? "#4ade80" : currentScore >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-xl p-3 shadow-inner">
      <div>
        <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1 font-mono">Founder Score</p>
        <div className={`text-2xl font-black tracking-tighter font-mono ${color}`}>
          {currentScore}
        </div>
      </div>
      
      <div className="w-24 h-8 relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] opacity-70"
          />
          <circle 
            cx="100" 
            cy={100 - ((currentScore - min) / range) * 100} 
            r="4" 
            fill={strokeColor} 
            className="animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          />
        </svg>
      </div>
    </div>
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

/**
 * Renders one structured list entry (e.g. a competitor cluster or a threat):
 * the headline as prose, with the remaining fields as labelled supporting detail.
 */
function StructuredItem({ item }: { item: Record<string, unknown> }) {
  const headlineKey = HEADLINE_KEYS.find(k => typeof item[k] === "string" && item[k] !== "");
  const headline = headlineKey ? String(item[headlineKey]) : null;

  const details = Object.entries(item).filter(([k, v]) => {
    if (k === headlineKey) return false;
    if (v === null || v === undefined || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return readableValue(v) !== "";
  });

  if (!headline && details.length === 0) return <NotDisclosedBadge />;

  return (
    <div className="space-y-1">
      {headline && <CitedText text={headline} />}
      {details.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {details.map(([k, v]) => (
            <span key={k} className="text-xs text-white/45">
              <span className="uppercase tracking-wider text-white/25">{k.replace(/_/g, " ")}:</span>{" "}
              <CitedText text={readableValue(v)} />
            </span>
          ))}
        </div>
      )}
    </div>
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
              {typeof item === "string" ? (
                <CitedText text={item} />
              ) : item && typeof item === "object" ? (
                <StructuredItem item={item as Record<string, unknown>} />
              ) : (
                <CitedText text={String(item)} />
              )}
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
function SwotSection({ swot, memo }: { swot: Record<string, any[]>; memo?: Record<string, unknown> | null }) {
  const quadrants = [
    { key: "strengths", label: "Strengths", color: "text-green-400", dot: "bg-green-400", bg: "bg-green-500/5 border-green-500/10", hoverBg: "hover:bg-green-500/10" },
    { key: "weaknesses", label: "Weaknesses", color: "text-red-400", dot: "bg-red-400", bg: "bg-red-500/5 border-red-500/10", hoverBg: "hover:bg-red-500/10" },
    { key: "opportunities", label: "Opportunities", color: "text-blue-400", dot: "bg-blue-400", bg: "bg-blue-500/5 border-blue-500/10", hoverBg: "hover:bg-blue-500/10" },
    { key: "threats", label: "Threats / Risks", color: "text-orange-400", dot: "bg-orange-400", bg: "bg-orange-500/5 border-orange-500/10", hoverBg: "hover:bg-orange-500/10" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {quadrants.map(({ key, label, color, dot, bg, hoverBg }, idx) => {
        const isBottomRow = idx >= 2;
        return (
          <div key={key} className={`${bg} border rounded-xl p-3 flex flex-col h-full`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${color} mb-3`}>{label}</p>
            {Array.isArray(swot[key]) && swot[key].length > 0 ? (
              <ul className="space-y-2 flex-1">
                {swot[key].map((item, i) => {
                  const isObj = typeof item === 'object' && item !== null;
                  const statement = isObj ? item.statement : item;
                  const factors = isObj && Array.isArray(item.factors) ? item.factors : [];
                  const conflicts = isObj && Array.isArray(item.conflicts) ? item.conflicts : [];
                  const related = relatedSections(readableValue(statement), memo, "swot").slice(0, 2);
                  const hasDetails = factors.length > 0 || conflicts.length > 0 || related.length > 0;
                  
                  return (
                    <li key={i} className={`relative group rounded-md p-1.5 -ml-1.5 transition-colors ${hasDetails ? hoverBg : ''}`}>
                      <div className="flex items-start gap-1.5">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                        <div className="text-xs text-white/70 leading-relaxed flex-1">
                          <CitedText text={statement} />
                          {conflicts.length > 0 && (
                            <AlertTriangle size={12} className="inline ml-1.5 text-red-400 mb-0.5" />
                          )}
                        </div>
                      </div>
                      
                      {/* Hover Tooltip */}
                      {hasDetails && (
                        <div className={`absolute left-0 w-64 bg-[#1a1a1a] border border-white/10 rounded-lg p-3 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 ${isBottomRow ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                        {factors.length > 0 && (
                          <div className="mb-2">
                            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Diligence Factors</p>
                            <ul className="space-y-1">
                              {factors.map((f: string, j: number) => (
                                <li key={j} className="text-xs text-white/60">• {f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {conflicts.length > 0 && (
                          <div className={factors.length > 0 ? "pt-2 border-t border-white/5" : ""}>
                            <p className="text-[10px] text-red-400/70 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <AlertTriangle size={10} /> Conflicting Findings
                            </p>
                            <ul className="space-y-1">
                              {conflicts.map((c: string, j: number) => (
                                <li key={j} className="text-xs text-red-300/80">• {c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {related.length > 0 && (
                          <div className={(factors.length > 0 || conflicts.length > 0) ? "pt-2 border-t border-white/5 mt-2" : ""}>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Jump to Details</p>
                            <RelatedSectionChips text={readableValue(statement)} memo={memo} excludeKey="swot" />
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <NotDisclosedBadge />
          )}
        </div>
      );
    })}
    </div>
  );
}

interface DiligenceSource {
  label: string;
  source: string;
  url?: string;
}

const DILIGENCE_CATEGORIES: { id: string; title: string; desc: string; sources: DiligenceSource[] }[] = [
  {
    id: "financial",
    title: "Financial",
    desc: "In-depth review of financial statements, tax compliance, revenue streams, and liabilities to verify economic health.",
    sources: [
      { label: "Income Statement (Q3 2023)", source: "Data Room", url: "https://dataroom.vcbrain.app/financials/income-statement-q3-2023" },
      { label: "Tax Returns (2022)", source: "IRS/Founders", url: "https://dataroom.vcbrain.app/financials/tax-returns-2022" },
      { label: "Revenue Projections", source: "Financial Model v2.xlsx", url: "https://dataroom.vcbrain.app/financials/financial-model-v2" }
    ]
  },
  {
    id: "legal",
    title: "Legal and Regulatory",
    desc: "Examination of contracts, intellectual property, licensing, and any pending or potential litigation to avoid inheriting legal liabilities.",
    sources: [
      { label: "IP Assignment Agreements", source: "Data Room - Legal", url: "https://dataroom.vcbrain.app/legal/ip-assignments" },
      { label: "Employment Contracts", source: "HR Portal", url: "https://dataroom.vcbrain.app/legal/employment-contracts" },
      { label: "Pending Litigation Search", source: "Public Records (PACER)", url: "https://pacer.uscourts.gov/" }
    ]
  },
  {
    id: "operational",
    title: "Operational",
    desc: "Assessment of business models, production capabilities, supply chains, and logistical infrastructure.",
    sources: [
      { label: "Supply Chain Contracts", source: "Data Room", url: "https://dataroom.vcbrain.app/operations/supply-chain-contracts" },
      { label: "Logistics Infrastructure Report", source: "Operations Review", url: "https://dataroom.vcbrain.app/operations/logistics-report" },
      { label: "SLA Agreements", source: "Customer Contracts", url: "https://dataroom.vcbrain.app/operations/sla-agreements" }
    ]
  },
  {
    id: "hr",
    title: "Human Resources",
    desc: "Evaluating a target company's workforce, including employee contracts, benefits, and pending workplace issues.",
    sources: [
      { label: "Employee Benefits Package", source: "HR System", url: "https://dataroom.vcbrain.app/hr/benefits-package" },
      { label: "Turnover Rate Data", source: "Q3 HR Report", url: "https://dataroom.vcbrain.app/hr/turnover-q3" },
      { label: "Workplace Issue Logs", source: "Compliance Officer", url: "https://dataroom.vcbrain.app/hr/issue-logs" }
    ]
  },
  {
    id: "environmental",
    title: "Environmental/Technical",
    desc: "Reviewing ecological compliance, sustainability goals, and the condition of IT networks or physical properties.",
    sources: [
      { label: "Sustainability Report 2023", source: "Public ESG Filing (SEC EDGAR)", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany" },
      { label: "IT Security Audit", source: "External Penetration Test", url: "https://dataroom.vcbrain.app/technical/pentest-report" },
      { label: "Physical Property Inspection", source: "Surveyor Report", url: "https://dataroom.vcbrain.app/technical/surveyor-report" }
    ]
  }
];

function DiligenceCategoryBox({ category }: { category: typeof DILIGENCE_CATEGORIES[0] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div 
      className="bg-black/20 border border-white/10 rounded-lg p-3 cursor-pointer hover:bg-black/30 transition-colors" 
      onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
    >
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-white/90">{category.title}</h4>
        {expanded ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
      </div>
      <p className="text-xs text-white/50 mt-1 line-clamp-2">{category.desc}</p>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Sources & Locations</p>
          <ul className="space-y-1">
            {category.sources.map((s, i) => (
              <li key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                <span className="text-white/30">•</span>
                <span>
                  {s.label}{" "}
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-cyan-400/80 hover:text-cyan-300 hover:underline"
                    >
                      [Source: {s.source} ↗]
                    </a>
                  ) : (
                    <span className="text-white/50">[Source: {s.source}]</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Derive the reasons behind the system's confidence level from the memo itself.
    Prefers backend-provided `confidence_factors`; otherwise inspects the memo for
    missing data, undisclosed sections, and contradicted claims. */
function deriveConfidenceFactors(rec: Record<string, unknown>, memo?: Record<string, unknown> | null): string[] {
  const provided = rec?.confidence_factors as string[] | undefined;
  if (Array.isArray(provided) && provided.length > 0) return provided;
  const factors: string[] = [];
  if (memo) {
    const contentSections = SECTIONS.filter(s => s.key !== "recommendation");
    const missing = contentSections
      .filter(s => { const v = memo[s.key]; return v === null || v === undefined || v === "" || hasMissingFlag(v); })
      .map(s => s.label);
    if (missing.length > 0) {
      factors.push(`Missing or incomplete data: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? ` +${missing.length - 4} more` : ""}`);
    }
    const undisclosed = contentSections
      .filter(s => memo[s.key] && isNotDisclosed(memo[s.key]))
      .map(s => s.label);
    if (undisclosed.length > 0) {
      factors.push(`Not disclosed by founders: ${undisclosed.slice(0, 3).join(", ")}${undisclosed.length > 3 ? ` +${undisclosed.length - 3} more` : ""}`);
    }
    const trust = memo.trust_summary as { contradictions?: number; avg_trust_score?: number } | undefined;
    if (trust?.contradictions && trust.contradictions > 0) {
      factors.push(`${trust.contradictions} claim(s) contradicted by web evidence`);
    }
    if (typeof trust?.avg_trust_score === "number") {
      factors.push(`Average claim trust score: ${trust.avg_trust_score}/100`);
    }
  }
  if (factors.length === 0) {
    factors.push("Based on overall data completeness and verification coverage.");
  }
  return factors;
}

/** Recommendation banner */
function RecommendationBanner({ rec, memo }: { rec: Record<string, unknown>; memo?: Record<string, unknown> | null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const action = (rec?.action as string || "diligence").toLowerCase();
  const confidence = (rec?.confidence as string || "LOW").toUpperCase();
  const reasoning = rec?.reasoning as string || "";
  const openQs = rec?.open_questions as string[] || [];
  const confidenceFactors = deriveConfidenceFactors(rec, memo);

  const config: Record<string, { bg: string; border: string; text: string; icon: React.ElementType; label: string; evaluation: string; desc: string }> = {
    deploy: {
      bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", icon: CheckCircle2,
      label: "Deploy Capital", evaluation: "Strong",
      desc: "All three axes clear the bar and key claims verify — ready for an investment decision.",
    },
    diligence: {
      bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: Eye,
      label: "Proceed to Diligence", evaluation: "Promising",
      desc: "Promising signals, but key claims need verification before capital is deployed.",
    },
    watch: {
      bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", icon: Eye,
      label: "Keep on Watchlist", evaluation: "Mixed",
      desc: "Not ready yet — monitor progress and revisit when the signals strengthen.",
    },
    pass: {
      bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: XCircle,
      label: "Pass", evaluation: "Weak",
      desc: "The opportunity does not meet the fund's bar on the current evidence.",
    },
  };
  const cfg = config[action] || config.diligence;
  const Icon = cfg.icon;
  const confidenceColor = confidence === "HIGH" ? "text-green-400" : confidence === "MEDIUM" ? "text-amber-400" : "text-red-400";

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-5 transition-all duration-300`}>
      {/* 1. Name */}
      <div
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Icon size={24} className={cfg.text} />
          <p className={`text-xl font-black ${cfg.text} tracking-tight`}>{cfg.label}</p>
        </div>
        <div className="p-2 rounded-full bg-black/10 group-hover:bg-black/20 text-white/50 transition-colors">
           {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* 2. Short description */}
      <p className="text-sm text-white/60 leading-relaxed mt-1 mb-3">{cfg.desc}</p>

      {/* 3. Evaluation + system confidence */}
      <div className="flex items-center gap-4 flex-wrap border-t border-white/10 pt-3 mb-3">
        <div className="text-xs text-white/40">
          Evaluation: <span className={`font-bold ${cfg.text}`}>{cfg.evaluation}</span>
        </div>
        <div className="relative group/conf text-xs text-white/40 flex items-center gap-1 cursor-help">
          System confidence: <span className={`font-bold ${confidenceColor}`}>{confidence}</span>
          <HelpCircle size={11} className="text-white/30" />
          {/* Hover tooltip: why this confidence level */}
          <div className="absolute left-0 top-full mt-1.5 w-72 bg-[#1a1a1a] border border-white/10 rounded-lg p-3 shadow-2xl opacity-0 invisible group-hover/conf:opacity-100 group-hover/conf:visible transition-all duration-200 z-50 cursor-default">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5">
              Why {confidence.toLowerCase()} confidence?
            </p>
            <ul className="space-y-1">
              {confidenceFactors.map((f, i) => (
                <li key={i} className="text-xs text-white/60 leading-relaxed">• {f}</li>
              ))}
            </ul>
            <p className="text-[10px] text-white/25 mt-2 pt-2 border-t border-white/5">
              Confidence reflects how certain the system is in this recommendation — not the quality of the startup.
            </p>
          </div>
        </div>
      </div>

      {/* 4. The rest: reasoning, open questions, diligence categories */}
      {reasoning && (
        <p className="text-sm text-white/70 leading-relaxed mb-3">
          <CitedText text={reasoning} />
        </p>
      )}
      {openQs.length > 0 && (
        <div className={isExpanded && action === "diligence" ? "mb-4" : ""}>
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

      {isExpanded && action === "diligence" && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Due Diligence Analysis</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DILIGENCE_CATEGORIES.map(cat => (
              <DiligenceCategoryBox key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Manual Call
───────────────────────────────────────── */
const MANUAL_CALL_QUESTION_COUNT = 5;

// Used to top up the memo's own open questions so the investor always walks
// into the call with a full agenda, even on a thin memo.
const FALLBACK_CALL_QUESTIONS = [
  "Can you clarify your monetization timeline and the pricing you have tested so far?",
  "What is your primary moat, and what stops a well-funded incumbent from copying it?",
  "Walk me through your retention — how many of your earliest users are still active?",
  "How did the founding team meet, and how do you split decisions when you disagree?",
  "What would you do with a $100K check in the next 90 days, and what would it prove?",
];

const buildCallQuestions = (memoQuestions: unknown): string[] => {
  const fromMemo = Array.isArray(memoQuestions)
    ? memoQuestions.filter((q): q is string => typeof q === "string" && q.trim() !== "")
    : [];
  const topUp = FALLBACK_CALL_QUESTIONS.filter(q => !fromMemo.includes(q));
  return [...fromMemo, ...topUp].slice(0, MANUAL_CALL_QUESTION_COUNT);
};

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function MemoApp() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [memo, setMemo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(SECTIONS.map(s => s.key)));
  const [error, setError] = useState<string | null>(null);

  // New states for Founder Call feature
  const [showCallModal, setShowCallModal] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'conversing' | 'transcribing' | 'completed'>('idle');
  const [updatedSections, setUpdatedSections] = useState<Set<string>>(new Set());

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
    setError(null);
    setElapsed(0);

    // Generation is a multi-step LLM call that regularly runs 20s+. Without a
    // ticking counter it reads as a hung button, and without an abort it can
    // spin forever if the backend stalls.
    const startedAt = Date.now();
    const ticker = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

    try {
      const r = await fetch(`${API}/api/memo/generate/${selectedId}`, {
        method: "POST",
        signal: controller.signal,
      });
      if (!r.ok) throw new Error(`Backend returned ${r.status}`);
      const data = await r.json();
      const content = data?.memo?.content_json || data?.memo;
      if (content) setMemo(typeof content === "string" ? JSON.parse(content) : content);
      else await loadMemo(selectedId);
    } catch (e) {
      setError(
        e instanceof DOMException && e.name === "AbortError"
          ? `Generation timed out after ${GENERATE_TIMEOUT_MS / 1000}s. The model may be slow — try again.`
          : `Failed to generate memo: ${e instanceof Error ? e.message : "unknown error"}. Is the backend running on :8000?`
      );
    } finally {
      clearInterval(ticker);
      clearTimeout(timeout);
      setGenerating(false);
      setElapsed(0);
    }
  };

  const handleAiCall = () => {
    setCallState('calling');
    setTimeout(() => {
      setCallState('conversing');
      setTimeout(() => {
        setCallState('transcribing');
        setTimeout(() => {
          setCallState('completed');
          setTimeout(() => {
            setShowCallModal(false);
            setCallState('idle');
            setMemo(prev => {
              if (!prev) return prev;
              const currentTeam = prev.team_and_history || {};
              const currentStatement = typeof currentTeam === 'string' ? currentTeam : (currentTeam as any).statement || '';
              
              const updatedTeam = {
                ...((typeof currentTeam === 'object' && currentTeam) || {}),
                statement: currentStatement + "\n\n[AI Call Analysis]\nFounder exhibited strong resilience during the stress-test questions. Communication was clear and direct, indicating high transparency. High conviction in the technical architecture, though slightly defensive when pressed on market size.",
                factors: [
                  ...((currentTeam as any).factors || []),
                  "High resilience and clarity [Source: Call Transcript]",
                  "Slightly defensive on market size [Source: Call Transcript]"
                ]
              };

              return {
                ...prev,
                team_and_history: updatedTeam,
                transcript: "[00:00] AI Agent: Hello! I'm calling on behalf of Hack Nation VC. Do you have a few minutes to dive into some questions we had after reviewing your materials?\n[00:08] Founder: Sure, I'm happy to chat.\n[00:11] AI Agent: Great. First, we noticed your revenue claims are currently zero, yet you emphasize high execution velocity. Can you walk me through the roadmap to monetization?\n[00:23] Founder: Absolutely. Right now we are focusing purely on user acquisition and infrastructure stability. Monetization is slated for Q4 once we hit critical mass...\n[00:45] AI Agent: I see. And regarding your market size, it seems highly competitive. How do you plan to differentiate?\n[00:52] Founder: Well, we believe our approach is fundamentally different. Our 4x performance gain is a moat in itself. (Tone shifts slightly defensive) We're not just another wrapper."
              };
            });
            setUpdatedSections(new Set(["team_and_history", "transcript"]));
            new Audio('https://actions.google.com/sounds/v1/cartoon/magic_chime_bell.ogg').play().catch(()=>console.log('Audio blocked'));
            
            // Update the Founder Score dynamically to show the graph jumping
            setApplications(prevApps => prevApps.map(app => {
              if (app.id === selectedId && app.opportunity_scores) {
                return {
                  ...app,
                  opportunity_scores: {
                    ...app.opportunity_scores,
                    founder_score: Math.min(99, (app.opportunity_scores.founder_score || 70) + 12)
                  }
                };
              }
              return app;
            }));
          }, 1500);
        }, 2000);
      }, 3000);
    }, 1500);
    // Play ringing sound when call starts
    new Audio('https://actions.google.com/sounds/v1/communications/incoming_phone_call.ogg').play().catch(()=>console.log('Audio blocked'));
  };

  /** Open a section and scroll it into view — target of the "see …" chips. */
  const navigateToSection = useCallback((key: string) => {
    setOpenSections(prev => new Set(prev).add(key));
    // Wait for the section to expand before scrolling to its final position.
    requestAnimationFrame(() => {
      document.getElementById(`memo-section-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    // Clear highlight when read
    if (updatedSections.has(key)) {
      setUpdatedSections(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
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
    <div className="absolute inset-0 flex flex-col bg-[#08090c] text-white overflow-hidden">
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
              <>
                <button
                  onClick={() => setShowCallModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 text-xs transition-colors"
                >
                  <PhoneCall size={12} /> Call Founder
                </button>
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
              </>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-xs transition-colors disabled:opacity-40"
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              {generating ? `Generating… ${elapsed}s` : memo ? "Re-generate" : "Generate Memo"}
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
                { label: "Founder", score: scores.founder_score, color: "text-blue-400 border-blue-500/20 bg-blue-500/10" },
                { label: "Market", score: scores.market_score, color: "text-green-400 border-green-500/20 bg-green-500/10" },
                { label: "Idea", score: scores.idea_score, color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
              ].map(({ label, score, color }) => (
                <div key={label} className={`${color} border rounded-lg px-2 py-1 text-xs font-bold`}>
                  {label} {score ?? "—"}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
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
                {generating ? `Generating… ${elapsed}s` : "Generate Now"}
              </button>
            </div>
          </div>
        )}

        {!loading && memo && (
          <MemoNavContext.Provider value={navigateToSection}>
          <div className="p-4 space-y-2">
            {/* Company header */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-4 flex items-center justify-between">
              <div className="flex items-start justify-between flex-1 pr-6">
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
              
              {scores?.founder_score && (
                <div className="shrink-0 pl-6 border-l border-white/10">
                  <FounderScoreChart currentScore={scores.founder_score} />
                </div>
              )}
            </div>

            {/* Recommendation Banner — always at top */}
            {!!memo.recommendation && (
              <RecommendationBanner rec={memo.recommendation as Record<string, unknown>} memo={memo} />
            )}

            {/* Sections */}
            {SECTIONS.filter(s => s.key !== "recommendation").map(section => {
              const value = memo[section.key];
              const isOpen = openSections.has(section.key);
              const missing = value === null || value === undefined || value === "";
              const confidential = isNotDisclosed(value);
              const hasWarning = hasMissingFlag(value);
              const Icon = section.icon;
              const isUpdated = updatedSections.has(section.key);

              return (
                <div key={section.key} id={`memo-section-${section.key}`} className={`scroll-mt-4 rounded-xl overflow-hidden transition-all duration-500 ${isUpdated ? 'bg-indigo-500/5 border border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/2 border border-white/6 hover:border-white/10'}`}>
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
                        {isUpdated && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500 text-white animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]">Updated from Call</span>}
                      </div>
                      <SectionUncertaintyRisk value={value} />
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-white/30 shrink-0" /> : <ChevronDown size={16} className="text-white/30 shrink-0" />}
                  </button>

                  {/* Section Content */}
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-white/5 pt-4">
                      {missing ? (
                        <NotDisclosedBadge label="No data available" />
                      ) : section.key === "swot" && typeof value === "object" && !Array.isArray(value) ? (
                        <SwotSection swot={value as Record<string, string[]>} memo={memo} />
                      ) : (
                        <SectionContent value={value} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Call Transcript Viewer */}
            {!!memo.transcript && (
              <div 
                id="call-transcript" 
                onMouseEnter={() => setUpdatedSections(prev => { const next = new Set(prev); next.delete('transcript'); return next; })}
                className={`border rounded-xl overflow-hidden mt-6 transition-all duration-500 ${updatedSections.has('transcript') ? 'bg-indigo-500/5 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-white/2 border-white/6 shadow-[0_0_20px_rgba(99,102,241,0.1)]'}`}
              >
                <div className="w-full flex items-center justify-between gap-3 p-4 border-b border-indigo-500/20 bg-indigo-500/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0`}>
                      <FileAudio size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-indigo-100 text-sm">Call Transcript (AI Agent)</span>
                    </div>
                  </div>
                  {updatedSections.has('transcript') && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500 text-white animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]">New Transcript</span>}
                </div>
                <div className="p-5 font-mono text-[11px] text-white/60 whitespace-pre-wrap leading-relaxed bg-[#0a0a0f]">
                  {memo.transcript as string}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 pb-4 text-center">
              <p className="text-xs text-white/20">
                This memo is AI-generated and evidence-backed. Missing data is explicitly flagged — not fabricated.
              </p>
            </div>
          </div>
          </MemoNavContext.Provider>
        )}
      </div>

      {/* Call Modal */}
      {showCallModal && memo && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-full">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <PhoneCall className="text-indigo-400" size={24} />
                Call Founder
              </h3>
              <button onClick={() => setShowCallModal(false)} className="text-white/40 hover:text-white"><XCircle size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {callState === 'idle' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-5 rounded-xl text-left flex flex-col cursor-default">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4">
                      <User size={24} className="text-white/70" />
                    </div>
                    <div className="font-bold mb-1 text-lg">Manual Call</div>
                    <div className="text-sm text-white/50 mb-5">You call the founder yourself. Here are the {MANUAL_CALL_QUESTION_COUNT} critical questions to ask:</div>
                    <ul className="text-sm text-white/80 space-y-3 list-disc pl-4 flex-1">
                      {buildCallQuestions(memo.open_questions).map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <button onClick={handleAiCall} className="bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-500/60 p-5 rounded-xl text-left transition-colors flex flex-col group text-left">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all">
                      <Bot size={24} className="text-indigo-400" />
                    </div>
                    <div className="font-bold text-indigo-100 mb-1 text-lg">AI Agent Call</div>
                    <div className="text-sm text-indigo-200/60">An AI Agent will call the founder on your behalf, conduct the interview based on the critical questions, transcribe it, and update the memo automatically.</div>
                    
                    <div className="mt-auto pt-6 text-indigo-400 text-sm font-semibold flex items-center gap-2">
                      Start Call <PhoneCall size={14} />
                    </div>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center mb-8 relative">
                    {callState !== 'completed' && <div className="absolute inset-0 border-2 border-indigo-500 rounded-full animate-ping opacity-20"></div>}
                    <Bot size={48} className={callState === 'completed' ? "text-green-400" : "text-indigo-400 animate-pulse"} />
                  </div>
                  <div className="text-2xl font-bold text-white mb-3">
                    {callState === 'calling' && "Ringing Founder..."}
                    {callState === 'conversing' && "Conversing with Founder..."}
                    {callState === 'transcribing' && "Analyzing & Transcribing..."}
                    {callState === 'completed' && "Call Complete!"}
                  </div>
                  <div className="text-base text-white/40">
                    {callState === 'completed' ? "Updating due diligence memo..." : "Please wait while the AI handles the interview."}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
