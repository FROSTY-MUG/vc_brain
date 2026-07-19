"use client";

import React, { useState, useEffect } from "react";
import { WindowManager } from "./WindowManager";
import { Taskbar } from "./Taskbar";
import { StartMenu } from "./StartMenu";
import { Onboarding } from "./Onboarding";
import { User, Target, Search, FileText, Settings, MessageSquare } from "lucide-react";
import { useOSStore } from "@/store/useOSStore";
import { useSession } from "next-auth/react";
import { FounderDesktop } from "./FounderDesktop";
import { InvestorDesktop } from "./InvestorDesktop";

export const Desktop = () => {
  const { openApp } = useOSStore();
  const { data: session } = useSession();
  const [onboarded, setOnboarded] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>("investor");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/profile/${session.user.email}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.onboarded) {
            setOnboarded(true);
            setUserRole(data.role);
          } else {
            setOnboarded(false);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [session]);

  const handleOnboardingComplete = (role: string) => {
    setOnboarded(true);
    setUserRole(role);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="animate-pulse text-gold-400 text-sm">Initializing Workstation...</div>
      </div>
    );
  }

  return (
    <>
      {/* Onboarding Overlay */}
      {!onboarded && <Onboarding onComplete={handleOnboardingComplete} />}

      {/* Render the appropriate desktop based on role */}
      {onboarded && (
        userRole === "founder" ? <FounderDesktop /> : <InvestorDesktop />
      )}
    </>
  );
};
