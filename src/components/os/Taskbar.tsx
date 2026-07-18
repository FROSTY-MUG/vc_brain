"use client";

import React from "react";
import { Brain, Wifi, Battery, ChevronUp } from "lucide-react";
import { useOSStore } from "@/store/useOSStore";
import { format } from "date-fns";

export const Taskbar = () => {
  const { toggleStartMenu, windows, focusApp, minimizeApp, activeWindowId } = useOSStore();
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 glass-panel border-t border-white/10 flex items-center px-2 z-50 justify-between">
      <div className="flex items-center gap-2 h-full">
        <button
          onClick={toggleStartMenu}
          className="h-9 w-10 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors group"
        >
          <Brain className="text-gold-400 group-hover:text-gold-300 transition-colors drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        </button>
        
        {/* Open Apps in Taskbar */}
        <div className="flex items-center gap-1 ml-2 border-l border-white/10 pl-3 h-full">
          {windows.map((w) => {
            const isActive = activeWindowId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => {
                  if (isActive && !w.isMinimized) {
                    minimizeApp(w.id);
                  } else {
                    focusApp(w.id);
                  }
                }}
                className={`px-3 h-9 rounded-md transition-all flex items-center gap-2 max-w-[150px]
                  ${isActive && !w.isMinimized ? "bg-white/20 border-b-2 border-gold-400 shadow-inner" : "hover:bg-white/10"}
                `}
              >
                <span className="text-xs text-white/90 truncate">{w.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* System Tray */}
      <div className="flex items-center gap-4 px-2 h-full text-white/80">
        <ChevronUp size={16} className="hover:text-white cursor-pointer" />
        <Wifi size={16} />
        <Battery size={16} />
        <div className="flex flex-col items-end justify-center text-[10px] leading-tight">
          <span>{format(time, "h:mm a")}</span>
          <span>{format(time, "MM/dd/yyyy")}</span>
        </div>
      </div>
    </div>
  );
};
