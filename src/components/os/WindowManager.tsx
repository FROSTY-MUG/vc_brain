"use client";

import React from "react";
import { useOSStore } from "@/store/useOSStore";
import { WindowComponent } from "./Window";
import ProfileApp from "../apps/ProfileApp";
import SourcingApp from "../apps/SourcingApp";
import RadarApp from "../apps/RadarApp";
import MemoApp from "../apps/MemoApp";
import ThesisApp from "../apps/ThesisApp";
import MessagesApp from "../apps/MessagesApp";
import InvestorSearchApp from "../apps/InvestorSearchApp";
import StartupCollabApp from "../apps/StartupCollabApp";
import TractionApp from "../apps/TractionApp";
import AgentHubApp from "../apps/AgentHubApp";
import PitchDeckApp from "../apps/PitchDeckApp";
import SettingsApp from "../apps/SettingsApp";

export const WindowManager = () => {
  const { windows } = useOSStore();

  const renderAppContent = (appId: string) => {
    switch (appId) {
      // Shared
      case "profile":
        return <ProfileApp />;
      case "messages":
        return <MessagesApp />;

      // Investor apps
      case "thesis":
        return <ThesisApp />;
      case "sourcing":
        return <SourcingApp />;
      case "radar":
        return <RadarApp />;
      case "memo":
        return <MemoApp />;
      case "agents":
        return <AgentHubApp />;

      // Shared
      case "pitch-decks":
        return <PitchDeckApp />;
      case "settings":
        return <SettingsApp />;

      // Founder apps
      case "investor-search":
        return <InvestorSearchApp />;
      case "startup-collab":
        return <StartupCollabApp />;
      case "analytics":
        return <TractionApp />;
      case "market-radar":
        return <RadarApp />; // Founders also see radar (founder market signals)

      default:
        return (
          <div className="p-8 text-white flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">🚧</div>
            <p className="text-white/50 text-sm">App <code className="text-amber-400">{appId}</code> is coming soon.</p>
          </div>
        );
    }
  };

  return (
    <>
      {windows.map((w) => (
        <WindowComponent key={w.id} windowState={w}>
          {renderAppContent(w.appId)}
        </WindowComponent>
      ))}
    </>
  );
};
