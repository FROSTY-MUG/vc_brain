"use client";

import { signOut, useSession } from "next-auth/react";
import { Brain, User, Target, FileText, Search, MessageSquare, LogOut, Presentation, Settings } from "lucide-react";
import { useOSStore } from "@/store/useOSStore";

export const StartMenu = () => {
  const { startMenuOpen, openApp } = useOSStore();
  const { data: session } = useSession();

  if (!startMenuOpen) return null;

  const apps = [
    { id: "profile", title: "Profile", icon: User, color: "text-blue-400" },
    { id: "sourcing", title: "Sourcing Terminal", icon: Search, color: "text-green-400" },
    { id: "radar", title: "Opportunity Radar", icon: Target, color: "text-gold-400" },
    { id: "memo", title: "Memo Generator", icon: FileText, color: "text-purple-400" },
    { id: "messages", title: "Messages", icon: MessageSquare, color: "text-blue-400" },
    { id: "pitch-decks", title: "Pitch Decks", icon: Presentation, color: "text-amber-400" },
    { id: "settings", title: "Settings", icon: Settings, color: "text-white/60" },
  ];

  return (
    <div className="absolute bottom-14 left-2 w-[400px] h-[500px] glass-panel rounded-xl z-50 flex flex-col p-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/20">
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="p-2 bg-gold-500/20 rounded-lg border border-gold-500/30">
          <Brain className="text-gold-400 w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Conviction</h2>
          <p className="text-xs text-white/50">The VC Brain OS</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <h3 className="text-xs uppercase tracking-wider text-white/40 mb-3 px-2">Pinned Apps</h3>
        <div className="grid grid-cols-4 gap-4 px-2">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => openApp({ id: app.id, title: app.title, icon: "app" })}
              className="flex flex-col items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
                <app.icon className={`${app.color}`} size={24} />
              </div>
              <span className="text-[10px] text-white/80 text-center leading-tight">
                {app.title}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {session?.user?.image ? (
            <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full border border-white/20" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_rgba(251,191,36,0.3)]">
              {session?.user?.name?.[0] || 'U'}
            </div>
          )}
          <span className="text-sm text-white/90">{session?.user?.name || 'User Profile'}</span>
        </div>
        
        <button 
          onClick={() => signOut()}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-red-400"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};
