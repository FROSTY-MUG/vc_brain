"use client";

import React from "react";
import { WindowManager } from "./WindowManager";
import { Taskbar } from "./Taskbar";
import { StartMenu } from "./StartMenu";
import { User, Target, Search, FileText, Settings } from "lucide-react";
import { useOSStore } from "@/store/useOSStore";

export const Desktop = () => {
  const { openApp } = useOSStore();

  const desktopIcons = [
    { id: "thesis", title: "Thesis Engine", icon: Settings, color: "text-slate-400" },
    { id: "sourcing", title: "Sourcing Terminal", icon: Search, color: "text-green-400" },
    { id: "radar", title: "Opportunity Radar", icon: Target, color: "text-gold-400" },
    { id: "memo", title: "Memo Generator", icon: FileText, color: "text-purple-400" },
  ];

  return (
    <div className="w-full h-screen overflow-hidden relative selection:bg-gold-500/30 text-foreground">
      {/* Desktop Background / Mesh Gradient is in body */}
      
      {/* Desktop Icons Area */}
      <div className="p-4 grid grid-cols-1 gap-6 w-28">
        {desktopIcons.map((app) => (
          <button
            key={app.id}
            onDoubleClick={() => openApp({ id: app.id, title: app.title, icon: "app" })}
            className="flex flex-col items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors group focus:bg-white/20 outline-none"
          >
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform backdrop-blur-md">
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
