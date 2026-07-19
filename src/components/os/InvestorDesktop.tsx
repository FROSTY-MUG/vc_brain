"use client";
import React from "react";
import { WindowManager } from "./WindowManager";
import { Taskbar } from "./Taskbar";
import { StartMenu } from "./StartMenu";
import {
  Target, Search, FileText, Settings, MessageSquare,
  Activity, User, TrendingUp, Presentation, DollarSign,
} from "lucide-react";
import { useOSStore } from "@/store/useOSStore";

const desktopIcons = [
  { id: "profile",      title: "Profile",        icon: User,         color: "text-blue-400" },
  { id: "thesis",       title: "Thesis",         icon: Settings,     color: "text-slate-400" },
  { id: "sourcing",     title: "Sourcing",        icon: Search,       color: "text-emerald-400" },
  { id: "radar",        title: "Deal Radar",      icon: Target,       color: "text-indigo-400" },
  { id: "analytics",   title: "KPIs",            icon: TrendingUp,   color: "text-purple-400" },
  { id: "memo",         title: "Memo",            icon: FileText,     color: "text-amber-400" },
  { id: "agents",       title: "Agents",          icon: Activity,     color: "text-cyan-400" },
  { id: "messages",     title: "Messages",        icon: MessageSquare,color: "text-sky-400" },
  { id: "pitch-decks",  title: "Pitch Decks",     icon: Presentation, color: "text-rose-400" },
  { id: "settings",     title: "Settings",        icon: Settings,     color: "text-white/60" },
];

export const InvestorDesktop = () => {
  const { openApp } = useOSStore();

  return (
    <div className="w-full h-screen overflow-hidden relative text-white bg-black select-none">


      {/* Top ticker */}
      <div className="absolute top-0 left-0 right-0 h-7 bg-black border-b border-white/8 flex items-center overflow-hidden z-10">
        <div className="animate-marquee whitespace-nowrap text-white/30 text-[11px] font-mono tracking-widest flex gap-10 px-4">
          <span>NIFTY 50 &nbsp;24,832 &nbsp;<span className="text-green-400">+0.4%</span></span>
          <span>SENSEX &nbsp;81,240 &nbsp;<span className="text-green-400">+0.3%</span></span>
          <span>PORTFOLIO IRR &nbsp;<span className="text-amber-400">34%</span></span>
          <span>AUM &nbsp;<span className="text-amber-400">₹42 Cr</span></span>
          <span>DEALS REVIEWED &nbsp;287</span>
          <span>ACTIVE PORTFOLIO &nbsp;14 companies</span>
          <span>NIFTY 50 &nbsp;24,832 &nbsp;<span className="text-green-400">+0.4%</span></span>
        </div>
      </div>

      {/* Center heading - Money Theme */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
        <div className="relative">
          <div className="absolute -inset-10 bg-emerald-500/10 blur-[100px] rounded-full" />
          <div className="flex items-center gap-4 mb-2 relative">
            <DollarSign size={40} className="text-emerald-500/40 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            <span className="text-[72px] font-black tracking-tighter bg-gradient-to-b from-emerald-300 via-emerald-500 to-green-700 bg-clip-text text-transparent opacity-40 select-none drop-shadow-[0_4px_20px_rgba(16,185,129,0.2)]">
              COGNIS
            </span>
            <DollarSign size={40} className="text-emerald-500/40 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
          </div>
        </div>
        <p className="text-emerald-500/30 text-[10px] tracking-[0.5em] uppercase font-mono font-bold mt-2">
          $ Conviction · Capital · Speed $
        </p>
      </div>

      {/* Desktop Icons — Grid layout */}
      <div className="absolute top-10 left-6 p-2 grid grid-cols-2 gap-4 z-20 w-[240px]">
        {desktopIcons.map((app) => (
          <button
            key={app.id}
            onDoubleClick={() => openApp({ id: app.id, title: app.title, icon: "app" })}
            className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
            aria-label={`Open ${app.title}`}
          >
            <div className="w-14 h-14 bg-black/50 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center group-hover:border-white/25 transition-all shadow-lg group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <app.icon size={26} className={`${app.color} transition-transform group-hover:scale-110 drop-shadow-md`} />
            </div>
            <span className="text-[11px] font-medium text-white/70 group-hover:text-white text-center leading-tight transition-colors break-words w-full">
              {app.title}
            </span>
          </button>
        ))}
      </div>

      <WindowManager />
      <StartMenu />
      <Taskbar />
    </div>
  );
};
