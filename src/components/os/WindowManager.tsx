"use client";

import React from "react";
import { useOSStore } from "@/store/useOSStore";
import { WindowComponent } from "./Window";
import ProfileApp from "../apps/ProfileApp";
import SourcingApp from "../apps/SourcingApp";
import RadarApp from "../apps/RadarApp";
import MemoApp from "../apps/MemoApp";
import ThesisApp from "../apps/ThesisApp";

export const WindowManager = () => {
  const { windows } = useOSStore();

  const renderAppContent = (appId: string) => {
    switch (appId) {
      case "profile":
        return <ProfileApp />;
      case "thesis":
        return <ThesisApp />;
      case "sourcing":
        return <SourcingApp />;
      case "radar":
        return <RadarApp />;
      case "memo":
        return <MemoApp />;
      default:
        return <div className="p-4 text-white">App not found</div>;
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
