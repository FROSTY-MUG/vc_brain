import React from "react";
import { WindowManager } from "./WindowManager";
import { Taskbar } from "./Taskbar";
import { StartMenu } from "./StartMenu";
import { Target, Search, FileText, Settings, MessageSquare, Briefcase, Activity, User, TrendingUp } from "lucide-react";
import { useOSStore } from "@/store/useOSStore";

export const InvestorDesktop = () => {
  const { openApp } = useOSStore();

  const desktopIcons = [
    { id: "profile", title: "My Profile", icon: User, color: "text-white/60" },
    { id: "thesis", title: "Thesis Engine", icon: Settings, color: "text-slate-400" },
    { id: "sourcing", title: "Sourcing Engine", icon: Search, color: "text-emerald-400" },
    { id: "radar", title: "Sourcing Graph", icon: Target, color: "text-indigo-400" },
    { id: "analytics", title: "Traction & KPIs", icon: TrendingUp, color: "text-purple-400" },
    { id: "memo", title: "Diligence & Memo", icon: FileText, color: "text-amber-400" },
    { id: "agents", title: "Agent Hub", icon: Activity, color: "text-cyan-400" },
    { id: "messages", title: "Messages", icon: MessageSquare, color: "text-blue-400" },
  ];

  return (
    <div className="w-full h-screen overflow-hidden relative selection:bg-gold-500/30 text-foreground bg-gradient-to-br from-[#110e05] to-[#1f190a]">
      {/* Premium Gold/Money Themed Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 bg-repeat z-0" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Marquee Scroller for live market data */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-black/40 border-b border-gold-500/20 backdrop-blur-md z-10 overflow-hidden flex items-center">
        <div className="animate-marquee whitespace-nowrap text-gold-400/80 text-xs font-mono tracking-widest px-4 flex gap-8">
          <span>MARKET: BULLISH</span>
          <span>•</span>
          <span>NEW SOURCING: 14 FOUNDERS DISCOVERED</span>
          <span>•</span>
          <span>AGENT DILIGENCE: 3 MEMOS READY</span>
          <span>•</span>
          <span>FUNDS DEPLOYED: $400K</span>
          <span>•</span>
          <span>PORTFOLIO VALUE: +12.4%</span>
          <span>•</span>
          <span>MARKET: BULLISH</span>
        </div>
      </div>

      {/* Desktop Icons Area */}
      <div className="p-4 pt-12 grid grid-cols-1 gap-6 w-28 z-20 relative">
        {desktopIcons.map((app) => (
          <button
            key={app.id}
            onDoubleClick={() => openApp({ id: app.id, title: app.title, icon: "app" })}
            className="flex flex-col items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors group focus:bg-white/20 outline-none"
          >
            <div className="w-12 h-12 bg-black/40 border border-gold-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/10 group-hover:scale-105 group-hover:border-gold-400 transition-all backdrop-blur-md">
              <app.icon className={`${app.color} drop-shadow-md`} size={24} />
            </div>
            <span className="text-xs text-white/90 text-center drop-shadow-md font-medium tracking-wide">
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
