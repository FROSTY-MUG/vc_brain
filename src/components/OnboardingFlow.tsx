"use client";

import React, { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Brain } from "lucide-react";

export const OnboardingFlow = ({ onComplete }: { onComplete: () => void }) => {
  const { data: session, update } = useSession();
  const [role, setRole] = useState<"founder" | "investor" | null>(null);
  const [thesis, setThesis] = useState("");

  if (!session) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center max-w-md w-full text-white text-center shadow-[0_0_50px_rgba(251,191,36,0.15)]">
          <div className="p-4 bg-gold-500/20 rounded-full border border-gold-500/30 mb-6 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
            <Brain className="text-gold-400 w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-gold-gradient">Conviction</h1>
          <p className="text-white/60 mb-8">Deploying $100K Checks in 24 Hours. Identify outlier founders with evidence-backed logic.</p>
          <button
            onClick={() => signIn("google")}
            className="w-full py-3 glass-button rounded-lg font-medium text-white/90 hover:text-white flex items-center justify-center gap-3"
          >
            <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // If logged in but no role selected (not onboarded)
  if (!(session.user as any)?.onboarded) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="glass-panel p-8 rounded-2xl flex flex-col max-w-xl w-full text-white">
          <h2 className="text-2xl font-bold mb-6 text-gold-gradient text-center">Welcome to Conviction</h2>
          
          {!role ? (
            <div className="flex flex-col gap-4">
              <p className="text-center text-white/70 mb-4">How will you use the VC Brain?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRole("founder")}
                  className="glass-button p-6 rounded-xl flex flex-col items-center gap-4 hover:border-gold-500/50 hover:bg-gold-500/10"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h3 className="font-semibold text-lg">Founder</h3>
                  <p className="text-xs text-white/50 text-center">I am raising capital and want to build my profile.</p>
                </button>
                <button
                  onClick={() => setRole("investor")}
                  className="glass-button p-6 rounded-xl flex flex-col items-center gap-4 hover:border-gold-500/50 hover:bg-gold-500/10"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-2xl">💼</span>
                  </div>
                  <h3 className="font-semibold text-lg">Investor</h3>
                  <p className="text-xs text-white/50 text-center">I want to discover and score outlier founders.</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
              <button onClick={() => setRole(null)} className="text-xs text-white/50 hover:text-white mb-2 text-left">← Back</button>
              <h3 className="text-xl font-semibold mb-2">
                {role === "investor" ? "Define Your Investment Thesis" : "Tell us about your Startup"}
              </h3>
              <p className="text-sm text-white/60 mb-4">
                {role === "investor" 
                  ? "What criteria are you looking for? (e.g., B2B SaaS, AI Infra, Europe, Technical Founders)" 
                  : "What are you building? What makes your team exceptional?"}
              </p>
              <textarea
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                className="w-full h-32 bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all resize-none"
                placeholder={role === "investor" ? "Enter your thesis..." : "Enter your startup details..."}
              />
              <button
                onClick={async () => {
                  await update({ role, onboarded: true });
                  onComplete();
                }}
                disabled={thesis.length < 10}
                className="w-full py-3 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                Enter VC Brain
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
