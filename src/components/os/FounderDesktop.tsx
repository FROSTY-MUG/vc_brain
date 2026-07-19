import React from "react";
import { WindowManager } from "./WindowManager";
import { Taskbar } from "./Taskbar";
import { StartMenu } from "./StartMenu";
import { Users, Search, Rocket, MessageSquare, Compass, LineChart } from "lucide-react";
import { useOSStore } from "@/store/useOSStore";

export const FounderDesktop = () => {
  const { openApp } = useOSStore();

  const desktopIcons = [
    { id: "profile", title: "My Profile", icon: Rocket, color: "text-blue-400" },
    { id: "investor-search", title: "Investor Search", icon: Search, color: "text-emerald-400" },
    { id: "startup-collab", title: "Startup Collab", icon: Users, color: "text-purple-400" },
    { id: "market-radar", title: "Market Radar", icon: Compass, color: "text-cyan-400" },
    { id: "analytics", title: "Traction", icon: LineChart, color: "text-amber-400" },
    { id: "messages", title: "Messages", icon: MessageSquare, color: "text-slate-300" },
  ];

  return (
    <div className="w-full h-screen overflow-hidden relative selection:bg-blue-500/30 text-foreground bg-gradient-to-br from-[#0a0a0f] to-[#12141d]">
      {/* Tech Working People Themed Background */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-[#0a0a0f] to-[#0a0a0f] z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Marquee Scroller for active startups/hackathons */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-black/60 border-b border-blue-500/20 backdrop-blur-md z-10 overflow-hidden flex items-center">
        <div className="animate-marquee whitespace-nowrap text-blue-400/80 text-xs font-mono tracking-widest px-4 flex gap-8">
          <span>HACKATHON: MIT GLOBAL AI - LIVE</span>
          <span>•</span>
          <span>NEW COLLAB: 3 FOUNDERS ONLINE</span>
          <span>•</span>
          <span>VC BRAIN SCORE: UPDATING...</span>
          <span>•</span>
          <span>PROFILE VIEWS: 12 INVESTORS</span>
          <span>•</span>
          <span>GITHUB COMMITS SYNCED</span>
          <span>•</span>
          <span>HACKATHON: MIT GLOBAL AI - LIVE</span>
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
            <div className="w-12 h-12 bg-black/50 border border-blue-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:scale-105 group-hover:border-blue-400 transition-all backdrop-blur-md">
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
