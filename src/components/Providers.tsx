"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import SettingsApplier from "@/components/SettingsApplier";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SettingsApplier />
      {children}
    </SessionProvider>
  );
}
