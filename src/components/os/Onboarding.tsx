"use client";

import React, { useState } from "react";
import { User, Shield, Briefcase, Brain, Loader, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";

interface OnboardingProps {
  onComplete: (role: string) => void;
}

const SECTORS = ["AI Infrastructure", "Developer Tools", "Enterprise SaaS", "Fintech", "HealthTech", "Climate Tech", "Cybersecurity", "Web3"];
const STAGES = ["pre-seed", "seed", "series-a"];
const RISK_LEVELS = ["conservative", "moderate", "aggressive"];

const SetupError = ({ message }: { message: string }) => (
  <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-left">
    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
    <span className="text-xs text-red-200">{message}</span>
  </div>
);

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"founder" | "investor" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Investor Form
  const [fundSize, setFundSize] = useState("");
  const [checkSizeMin, setCheckSizeMin] = useState("");
  const [checkSizeMax, setCheckSizeMax] = useState("");
  const [ownership, setOwnership] = useState("");
  const [risk, setRisk] = useState("moderate");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

  // Founder Form
  const [companyName, setCompanyName] = useState("");
  const [founderSector, setFounderSector] = useState("");
  const [founderStage, setFounderStage] = useState("");

  const handleNext = () => {
    if (step === 1 && role) setStep(2);
  };

  // Double-clicking a role card selects it and advances in one gesture.
  const selectRoleAndContinue = (r: "founder" | "investor") => {
    setRole(r);
    setStep(2);
  };

  const handleOnboard = async () => {
    if (!role) return;

    const email = session?.user?.email;
    if (!email) {
      setError("No signed-in account was found. Sign in again, then re-run setup.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // 1. Create User Profile
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: session.user?.name || "User",
          avatar_url: session.user?.image || "",
          role: role
        })
      });

      // The proxy forwards the backend body with a 200 even when the backend
      // itself reported a failure, so check the payload as well as the status.
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Profile save failed (${res.status})`);
      }

      // 2. Save Thesis (if investor) or Startup (if founder)
      if (role === "investor") {
        const thesisRes = await fetch("/api/thesis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: email,
            sectors: selectedSectors,
            stages: selectedStages,
            checkSizeMin: parseInt(checkSizeMin) || 0,
            checkSizeMax: parseInt(checkSizeMax) || 0,
            ownershipTarget: parseFloat(ownership) || 0,
            riskAppetite: risk,
          })
        });
        const thesisData = await thesisRes.json().catch(() => null);
        if (!thesisRes.ok || thesisData?.error) {
          throw new Error(thesisData?.error || `Thesis save failed (${thesisRes.status})`);
        }
      } else {
        // save startup info (we'll implement this endpoint next if it doesn't exist)
      }

      onComplete(role);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error && err.message
          ? `${err.message}. Is the backend running on :8000?`
          : "Setup failed. Is the backend running on :8000?"
      );
    }
    setSubmitting(false);
  };

  const toggleSector = (s: string) => setSelectedSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleStage = (s: string) => setSelectedStages(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full glass-panel border border-white/20 p-8 rounded-2xl flex flex-col items-center text-center shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 to-amber-600"></div>
        
        {step === 1 && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 p-0.5 mb-6 shadow-lg shadow-gold-500/20">
              <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-gold-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">Welcome to VC Brain</h2>
            <p className="text-white/50 text-xs mb-8">Choose your role to initialize your space.</p>

            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <button onClick={() => setRole("founder")} onDoubleClick={() => selectRoleAndContinue("founder")} className={`p-5 rounded-xl border flex flex-col items-center gap-3 transition-all select-none ${role === "founder" ? "bg-gold-500/10 border-gold-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]" : "bg-white/5 border-white/10"}`}>
                <div className={`p-2.5 rounded-lg ${role === "founder" ? "bg-gold-500/20 text-gold-400" : "bg-white/5 text-white/50"}`}><Briefcase size={24} /></div>
                <div><span className="block text-sm font-bold text-white">Founder</span></div>
              </button>
              <button onClick={() => setRole("investor")} onDoubleClick={() => selectRoleAndContinue("investor")} className={`p-5 rounded-xl border flex flex-col items-center gap-3 transition-all select-none ${role === "investor" ? "bg-gold-500/10 border-gold-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]" : "bg-white/5 border-white/10"}`}>
                <div className={`p-2.5 rounded-lg ${role === "investor" ? "bg-gold-500/20 text-gold-400" : "bg-white/5 text-white/50"}`}><Shield size={24} /></div>
                <div><span className="block text-sm font-bold text-white">Investor</span></div>
              </button>
            </div>
            <button onClick={handleNext} disabled={!role} className="w-full py-3 bg-white text-black font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              Next <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === 2 && role === "investor" && (
          <div className="w-full text-left">
            <h2 className="text-xl font-bold text-white mb-1">Set Up Your Thesis</h2>
            <p className="text-xs text-white/50 mb-6">Complete your profile to unlock intelligence features.</p>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Fund Size</label>
                <input type="text" value={fundSize} onChange={e => setFundSize(e.target.value)} placeholder="e.g. $100M" className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Min Check Size</label>
                  <input type="number" value={checkSizeMin} onChange={e => setCheckSizeMin(e.target.value)} placeholder="$" className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Max Check Size</label>
                  <input type="number" value={checkSizeMax} onChange={e => setCheckSizeMax(e.target.value)} placeholder="$" className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Ownership Target (%)</label>
                <input type="number" value={ownership} onChange={e => setOwnership(e.target.value)} placeholder="e.g. 10" className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Sectors</label>
                <div className="flex flex-wrap gap-1">
                  {SECTORS.map(s => (
                    <button key={s} onClick={() => toggleSector(s)} className={`px-2 py-1 rounded text-xs border ${selectedSectors.includes(s) ? "bg-gold-500/20 border-gold-500/40 text-gold-400" : "bg-black/50 border-white/10 text-white/50"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Stages</label>
                <div className="flex flex-wrap gap-1">
                  {STAGES.map(s => (
                    <button key={s} onClick={() => toggleStage(s)} className={`px-2 py-1 rounded text-xs border capitalize ${selectedStages.includes(s) ? "bg-gold-500/20 border-gold-500/40 text-gold-400" : "bg-black/50 border-white/10 text-white/50"}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            {error && <SetupError message={error} />}

            <div className="mt-4 flex gap-2 pt-4 border-t border-white/10">
              <button onClick={() => setStep(1)} className="px-4 py-2 bg-white/5 text-white rounded-xl text-sm font-medium">Back</button>
              <button onClick={handleOnboard} disabled={submitting} className="flex-1 py-2 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Finish Setup
              </button>
            </div>
          </div>
        )}

        {step === 2 && role === "founder" && (
          <div className="w-full text-left">
            <h2 className="text-xl font-bold text-white mb-1">Company Details</h2>
            <p className="text-xs text-white/50 mb-6">Let's set up your startup profile.</p>
            
            <div className="space-y-4 pb-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Company Name</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Startup Inc." className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Sector</label>
                <select value={founderSector} onChange={e => setFounderSector(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white outline-none">
                  <option value="">Select sector...</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Stage</label>
                <select value={founderStage} onChange={e => setFounderStage(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white outline-none">
                  <option value="">Select stage...</option>
                  {STAGES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
            </div>

            {error && <SetupError message={error} />}

            <div className="mt-4 flex gap-2 pt-4 border-t border-white/10">
              <button onClick={() => setStep(1)} className="px-4 py-2 bg-white/5 text-white rounded-xl text-sm font-medium">Back</button>
              <button onClick={handleOnboard} disabled={submitting || !companyName} className="flex-1 py-2 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Finish Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
