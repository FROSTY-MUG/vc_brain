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
  const [onboarded, setOnboarded] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>("investor");
  const [loading, setLoading] = useState<boolean>(true);

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    // Instant local cache check
    const localRole = localStorage.getItem(`cognis_role_${session.user.email}`);
    if (localRole) {
      setOnboarded(true);
      setUserRole(localRole);
      setLoading(false);
      // Still fetch in background to sync
      fetch(`/api/profile/${session.user.email}`).catch(() => null);
      return;
    }

    // If not cached, give it a tiny timeout (500ms) before falling back to onboarding
    const timeout = setTimeout(() => {
      setOnboarded(false);
      setLoading(false);
    }, 500);

    fetch(`/api/profile/${session.user.email}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.onboarded) {
          localStorage.setItem(`cognis_role_${session.user.email}`, data.role);
          setOnboarded(true);
          setUserRole(data.role);
        } else {
          setOnboarded(false);
        }
      })
      .catch(() => {
        setOnboarded(false);
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => clearTimeout(timeout);
  }, [session, status]);

  const handleOnboardingComplete = (role: string) => {
    if (session?.user?.email) {
      localStorage.setItem(`cognis_role_${session.user.email}`, role);
    }
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
