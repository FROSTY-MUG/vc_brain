"use client";

import React, { useState } from "react";
import { User, Shield, Briefcase, Brain, Loader } from "lucide-react";
import { useSession } from "next-auth/react";

interface OnboardingProps {
  onComplete: (role: string) => void;
}

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { data: session } = useSession();
  const [role, setRole] = useState<"founder" | "investor" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleOnboard = async () => {
    if (!role || !session?.user?.email) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.name || "User",
          avatar_url: session.user.image || "",
          role: role
        })
      });
      if (res.ok) {
        onComplete(role);
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel border border-white/20 p-8 rounded-2xl flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 to-amber-600"></div>
        
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 p-0.5 mb-6 shadow-lg shadow-gold-500/20">
          <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
            <Brain className="w-8 h-8 text-gold-400" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Welcome to Conviction</h2>
        <p className="text-white/50 text-xs mb-8">
          The AI-first venture operating network. Choose your role to initialize your space.
        </p>

        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          <button
            onClick={() => setRole("founder")}
            className={`p-5 rounded-xl border flex flex-col items-center gap-3 transition-all ${
              role === "founder" 
                ? "bg-gold-500/10 border-gold-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]" 
                : "bg-white/5 border-white/10 hover:border-white/20"
            }`}
          >
            <div className={`p-2.5 rounded-lg ${role === "founder" ? "bg-gold-500/20 text-gold-400" : "bg-white/5 text-white/50"}`}>
              <Briefcase size={24} />
            </div>
            <div>
              <span className="block text-sm font-bold text-white">Founder</span>
              <span className="block text-[10px] text-white/40 mt-0.5">Pitch & get funded</span>
            </div>
          </button>

          <button
            onClick={() => setRole("investor")}
            className={`p-5 rounded-xl border flex flex-col items-center gap-3 transition-all ${
              role === "investor" 
                ? "bg-gold-500/10 border-gold-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]" 
                : "bg-white/5 border-white/10 hover:border-white/20"
            }`}
          >
            <div className={`p-2.5 rounded-lg ${role === "investor" ? "bg-gold-500/20 text-gold-400" : "bg-white/5 text-white/50"}`}>
              <Shield size={24} />
            </div>
            <div>
              <span className="block text-sm font-bold text-white">Investor</span>
              <span className="block text-[10px] text-white/40 mt-0.5">Diligence & deploy checks</span>
            </div>
          </button>
        </div>

        <button
          onClick={handleOnboard}
          disabled={!role || submitting}
          className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader className="animate-spin" size={16} /> : null}
          Initialize Workstation
        </button>
      </div>
    </div>
  );
};
