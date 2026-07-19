"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Check, X, Send, Loader, ArrowRight, ShieldCheck, ShieldAlert } from "lucide-react";
import { useSession } from "next-auth/react";

interface Pitch {
  id: string;
  message: string;
  status: string;
  channel: string;
  created_at: string;
  founders?: {
    id: string;
    name: string;
    email: string;
    bio?: string;
  };
}

export default function MessagesApp() {
  const { data: session } = useSession();
  const [role, setRole] = useState<string>("investor");
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("");
  const [pitchMessage, setPitchMessage] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch role and messages
  useEffect(() => {
    if (!session?.user?.email) return;

    // Fetch user profile to know if founder or investor
    fetch(`/api/profile/${session.user.email}`)
      .then(res => res.json())
      .then(profile => {
        setRole(profile.role);
        
        if (profile.role === "investor") {
          // Investor: fetch incoming pitches sent to them
          // In this demo, we use the user's name/email hash as their ID or look it up
          fetch(`/api/pitches/investor/${profile.id}`)
            .then(res => res.json())
            .then(data => {
              setPitches(data || []);
              setLoading(false);
            });
        } else {
          // Founder: fetch investors they can send pitches to
          // We can display users with investor role or mock investors
          setInvestors([
            { id: "inv_01", name: "Maschmeyer Group (Seed Fund)", email: "seed@maschmeyer.vc" },
            { id: "inv_02", name: "Hack-Nation Capital", email: "capital@hacknation.co" }
          ]);
          setSelectedInvestorId("inv_01");
          setLoading(false);
        }
      });
  }, [session]);

  const handleSendPitch = async () => {
    if (!session?.user?.email || !selectedInvestorId || !pitchMessage) return;
    setSending(true);
    try {
      const res = await fetch("/api/pitches/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          investor_id: selectedInvestorId,
          message: pitchMessage
        })
      });
      if (res.ok) {
        alert("Pitch message sent successfully to investor!");
        setPitchMessage("");
      } else {
        alert("Failed to send pitch. Please complete your Founder Profile first.");
      }
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  const handleRespond = async (pitchId: string, action: "accept" | "deny") => {
    try {
      const res = await fetch("/api/pitches/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitch_id: pitchId,
          action: action
        })
      });
      if (res.ok) {
        // Update local state status
        setPitches(prev => prev.map(p => p.id === pitchId ? { ...p, status: action === "accept" ? "replied" : "bounced" } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
     return <div className="p-6 text-white flex items-center gap-2"><Loader className="animate-spin text-gold-400" /> Loading Messages App...</div>;
  }

  return (
    <div className="h-full flex text-white bg-[#0a0a0a]">
      {role === "investor" ? (
         // Investor View: list of incoming pitches
         <div className="flex-1 flex flex-col p-6 overflow-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
               <div>
                  <h2 className="text-xl font-bold text-gold-300">Incoming Pitches</h2>
                  <p className="text-xs text-white/50">Browse funding requests sent from founders in the network</p>
               </div>
               <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
                  Investor Mode
               </span>
            </div>

            {pitches.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-white/40">
                  <MessageSquare size={48} className="text-white/20 mb-4" />
                  <p className="text-sm">No pitches received yet.</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {pitches.map(pitch => (
                     <div key={pitch.id} className="glass-panel p-5 rounded-xl border border-white/10 flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                           <div>
                              <h3 className="font-bold text-white text-base">{pitch.founders?.name || "Unknown Founder"}</h3>
                              <p className="text-xs text-white/50">{pitch.founders?.email}</p>
                           </div>
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              pitch.status === 'replied' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                              pitch.status === 'bounced' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                           }`}>
                              {pitch.status === 'replied' ? 'Accepted' : pitch.status === 'bounced' ? 'Denied' : 'Pending'}
                           </span>
                        </div>
                        
                        <p className="text-sm text-white/80 italic bg-white/5 p-3 rounded-lg border border-white/5">
                           "{pitch.message}"
                        </p>

                        {pitch.status === 'sent' && (
                           <div className="flex gap-2 self-end mt-2">
                              <button 
                                 onClick={() => handleRespond(pitch.id, "accept")}
                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 text-xs font-semibold rounded-lg transition-all"
                              >
                                 <Check size={14} /> Accept & Reply
                              </button>
                              <button 
                                 onClick={() => handleRespond(pitch.id, "deny")}
                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-xs font-semibold rounded-lg transition-all"
                              >
                                 <X size={14} /> Deny
                              </button>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            )}
         </div>
      ) : (
         // Founder View: Send pitches to investors
         <div className="flex-1 flex flex-col p-6 overflow-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
               <div>
                  <h2 className="text-xl font-bold text-gold-300">Pitch Investors</h2>
                  <p className="text-xs text-white/50">Submit a pitch message directly to active investment funds</p>
               </div>
               <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full border border-purple-500/30">
                  Founder Mode
               </span>
            </div>

            <div className="max-w-xl space-y-6">
               <div>
                  <label className="text-xs text-white/60 mb-2 block font-medium">Select Investor Fund</label>
                  <select 
                     className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-gold-500/50"
                     value={selectedInvestorId}
                     onChange={(e) => setSelectedInvestorId(e.target.value)}
                  >
                     {investors.map(inv => (
                        <option key={inv.id} value={inv.id}>{inv.name} ({inv.email})</option>
                     ))}
                  </select>
               </div>

               <div>
                  <label className="text-xs text-white/60 mb-2 block font-medium">Pitch Message (Funding Ask & Rationale)</label>
                  <textarea 
                     className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-gold-500/50 min-h-[150px] resize-none"
                     placeholder="State what your startup does, why it is exceptional, how much capital you are asking for, and why they should back you..."
                     value={pitchMessage}
                     onChange={(e) => setPitchMessage(e.target.value)}
                  />
               </div>

               <button
                  onClick={handleSendPitch}
                  disabled={sending || !pitchMessage}
                  className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {sending ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                  Send Pitch Message
               </button>
            </div>
         </div>
      )}
    </div>
  );
}
