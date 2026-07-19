"use client";
import React, { useState } from "react";
import {
  Sun, Moon, Type, Contrast, Palette, Info, Check,
  ZapOff, Layout,
} from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";

type Tab = "appearance" | "accessibility" | "about";

const ACCENT_OPTIONS = [
  { key: "amber",   label: "Amber",   cls: "bg-amber-400",   cssColor: "#fbbf24" },
  { key: "emerald", label: "Emerald", cls: "bg-emerald-400", cssColor: "#34d399" },
  { key: "blue",    label: "Blue",    cls: "bg-blue-400",    cssColor: "#60a5fa" },
  { key: "purple",  label: "Purple",  cls: "bg-purple-400",  cssColor: "#c084fc" },
  { key: "rose",    label: "Rose",    cls: "bg-rose-400",    cssColor: "#fb7185" },
  { key: "cyan",    label: "Cyan",    cls: "bg-cyan-400",    cssColor: "#22d3ee" },
] as const;

const DENSITY_OPTIONS = [
  { key: "compact",  label: "Compact",  desc: "Tighter spacing" },
  { key: "normal",   label: "Normal",   desc: "Default" },
  { key: "spacious", label: "Spacious", desc: "More breathing room" },
] as const;

const Toggle = ({ value, onChange, label, desc }: {
  value: boolean; onChange: () => void; label: string; desc?: string;
}) => (
  <div className="flex items-center justify-between py-3 gap-4">
    <div className="min-w-0">
      <p className="text-sm text-white/80 truncate">{label}</p>
      {desc && <p className="text-xs text-white/35 mt-0.5 truncate">{desc}</p>}
    </div>
    <button
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={onChange}
      className="relative w-11 h-6 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 outline-none shrink-0"
      style={{ background: value ? "var(--accent, #fbbf24)" : "rgba(255,255,255,0.12)" }}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  </div>
);

export default function SettingsApp() {
  const [tab, setTab] = useState<Tab>("appearance");
  const s = useSettingsStore();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "appearance",    label: "Appearance",    icon: <Palette size={15} /> },
    { id: "accessibility", label: "Accessibility", icon: <Contrast size={15} /> },
    { id: "about",         label: "About",          icon: <Info size={15} /> },
  ];

  return (
    <div className="absolute inset-0 flex bg-[#08090c] text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-40 shrink-0 border-r border-white/5 p-2 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-white/25 px-3 py-2">Settings</p>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
              tab === t.id
                ? "bg-white/8 text-white font-medium"
                : "text-white/45 hover:text-white/70 hover:bg-white/4"
            }`}
          >
            <span className="shrink-0">{t.icon}</span>
            <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto p-5 space-y-6"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>

        {/* ── APPEARANCE ── */}
        {tab === "appearance" && (
          <>
            <div>
              <h2 className="font-bold text-base">Appearance</h2>
              <p className="text-xs text-white/35 mt-0.5">How the OS looks.</p>
            </div>

            {/* Theme */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Theme</p>
              <div className="flex gap-2">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => s.setTheme(t)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      s.theme === t
                        ? "border-white/30 bg-white/8 text-white"
                        : "border-white/8 text-white/40 hover:border-white/15"
                    }`}
                  >
                    {t === "dark" ? <Moon size={14} /> : <Sun size={14} />}
                    {t === "dark" ? "Dark" : "Light"}
                    {s.theme === t && <Check size={12} className="ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Accent Color</p>
              <div className="flex flex-wrap gap-3">
                {ACCENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => s.setAccentColor(opt.key)}
                    title={opt.label}
                    aria-label={`Set accent to ${opt.label}`}
                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-white/50 outline-none ${opt.cls} ${
                      s.accentColor === opt.key
                        ? "ring-2 ring-white/90 ring-offset-2 ring-offset-[#08090c] scale-110"
                        : ""
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-white/30 mt-2">
                Active: <span className="capitalize" style={{ color: ACCENT_OPTIONS.find(o => o.key === s.accentColor)?.cssColor }}>{s.accentColor}</span>
              </p>
            </div>

            {/* UI Density */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">UI Density</p>
              <div className="space-y-1.5">
                {DENSITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => s.setDensity(opt.key)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-left ${
                      s.density === opt.key
                        ? "border-white/25 bg-white/6 text-white"
                        : "border-white/6 text-white/45 hover:border-white/12"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{opt.label}</p>
                      <p className="text-[11px] text-white/30 mt-0.5 truncate">{opt.desc}</p>
                    </div>
                    {s.density === opt.key && <Check size={14} className="text-white/70 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── ACCESSIBILITY ── */}
        {tab === "accessibility" && (
          <>
            <div>
              <h2 className="font-bold text-base">Accessibility</h2>
              <p className="text-xs text-white/35 mt-0.5">Make the app work better for you.</p>
            </div>

            {/* Font Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/40 uppercase tracking-wider">Font Size</p>
                <span className="text-sm font-bold font-mono" style={{ color: "var(--accent, #fbbf24)" }}>{s.fontSize}px</span>
              </div>
              <input
                type="range"
                min={12}
                max={20}
                step={1}
                value={s.fontSize}
                onChange={(e) => s.setFontSize(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "var(--accent, #fbbf24)" }}
                aria-label="Font size"
              />
              <div className="flex justify-between text-[10px] text-white/25 mt-1.5">
                <span>12px · Small</span>
                <span style={{ fontSize: s.fontSize }}>Aa preview</span>
                <span>20px · Large</span>
              </div>
            </div>

            <div className="border-t border-white/5 divide-y divide-white/5">
              <Toggle
                value={s.reducedMotion}
                onChange={s.toggleReducedMotion}
                label="Reduce Motion"
                desc="Disables animations and transitions"
              />
              <Toggle
                value={s.highContrast}
                onChange={s.toggleHighContrast}
                label="High Contrast"
                desc="Increases text and border visibility"
              />
            </div>

            {/* Live preview */}
            <div
              className="p-4 rounded-xl border transition-all"
              style={{
                borderColor: s.highContrast ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.08)",
                background: s.highContrast ? "#000" : "rgba(255,255,255,0.03)",
              }}
            >
              <p className="text-[10px] text-white/35 uppercase tracking-wider mb-2">Live Preview</p>
              <p style={{ fontSize: s.fontSize, color: s.highContrast ? "#fff" : "rgba(255,255,255,0.75)" }}>
                The quick brown fox jumps over the lazy dog.
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[11px] border" style={{ color: "var(--accent, #fbbf24)", borderColor: "var(--accent, #fbbf24)", background: "transparent" }}>Tag A</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] border border-white/20 text-white/60">Tag B</span>
              </div>
            </div>
          </>
        )}

        {/* ── ABOUT ── */}
        {tab === "about" && (
          <>
            <div>
              <h2 className="font-bold text-base">About</h2>
              <p className="text-xs text-white/35 mt-0.5">VC Brain system information.</p>
            </div>

            <div className="divide-y divide-white/5">
              {[
                ["App",        "VC Brain"],
                ["Version",    "0.1.0 · Demo Build"],
                ["Framework",  "Next.js 16"],
                ["Runtime",    "React 19"],
                ["Build",      "Hackathon 2026"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-3 gap-4">
                  <span className="text-sm text-white/35 shrink-0">{k}</span>
                  <span className="text-sm text-white/75 font-medium text-right truncate">{v}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
              <p className="text-xs text-white/50 leading-relaxed">
                VC Brain connects Indian founders and investors for fast, AI-assisted dealflow. All demo data is fictional but realistic.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
