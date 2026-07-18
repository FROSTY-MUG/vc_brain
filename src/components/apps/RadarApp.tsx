"use client";

import React, { useState } from "react";
import { opportunityScores, claims, applications, startups } from "@/data/seed";
import { ShieldCheck, ShieldAlert, ArrowUpRight, ArrowDownRight, Minus, FileText } from "lucide-react";

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "rising") return <ArrowUpRight size={14} className="text-green-400" />;
  if (trend === "declining") return <ArrowDownRight size={14} className="text-red-400" />;
  return <Minus size={14} className="text-white/40" />;
};

const RadarApp = () => {
  // Demo: we use the second application (StackBridge) as the default
  const [selectedAppId, setSelectedAppId] = useState("app_02");
  
  const scores = opportunityScores.find(s => s.applicationId === selectedAppId);
  const appClaims = claims.filter(c => c.applicationId === selectedAppId);
  const application = applications.find(a => a.id === selectedAppId);
  const startup = startups.find(s => s.id === application?.startupId);

  if (!scores || !application) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="p-6 text-white h-full flex flex-col overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gold-gradient">Opportunity Radar</h2>
          <p className="text-xs text-white/50 mt-1">3-Axis Screening & Trust Ledger for {startup?.name}</p>
        </div>
        <select 
          className="bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gold-500/50"
          value={selectedAppId}
          onChange={(e) => setSelectedAppId(e.target.value)}
        >
          {applications.map(app => {
             const s = startups.find(st => st.id === app.startupId);
             return <option key={app.id} value={app.id}>{s?.name || app.id}</option>;
          })}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1">
        
        {/* Left Column: 3-Axis Scores */}
        <div className="col-span-1 space-y-4">
          <h3 className="font-semibold text-gold-300 text-sm border-b border-white/10 pb-2">3-Axis Evaluation</h3>
          
          {/* Founder Axis */}
          <div className="glass-panel p-4 rounded-xl border-l-4 border-l-blue-500">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white/80">Founder</span>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${scores.founder.score >= 80 ? "text-green-400" : scores.founder.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                  {scores.founder.score}
                </span>
                <TrendIcon trend={scores.founder.trend} />
              </div>
            </div>
            <ul className="text-xs text-white/60 space-y-1 list-disc pl-4">
              {scores.founder.signals.map((sig, i) => <li key={i}>{sig}</li>)}
            </ul>
          </div>

          {/* Market Axis */}
          <div className="glass-panel p-4 rounded-xl border-l-4 border-l-purple-500">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white/80">Market</span>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${scores.market.score >= 80 ? "text-green-400" : scores.market.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                  {scores.market.score}
                </span>
                <TrendIcon trend={scores.market.trend} />
              </div>
            </div>
            <ul className="text-xs text-white/60 space-y-1 list-disc pl-4">
              {scores.market.signals.map((sig, i) => <li key={i}>{sig}</li>)}
            </ul>
          </div>

          {/* Idea vs Market Axis */}
          <div className="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white/80">Idea vs Market</span>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${scores.ideaVsMarket.score >= 80 ? "text-green-400" : scores.ideaVsMarket.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                  {scores.ideaVsMarket.score}
                </span>
                <TrendIcon trend={scores.ideaVsMarket.trend} />
              </div>
            </div>
            <ul className="text-xs text-white/60 space-y-1 list-disc pl-4">
              {scores.ideaVsMarket.signals.map((sig, i) => <li key={i}>{sig}</li>)}
            </ul>
          </div>
          
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between bg-gold-500/10 border-gold-500/30">
            <span className="text-sm text-gold-300">Thesis Alignment</span>
            <span className="text-lg font-bold text-gold-400">{scores.thesisAlignment}%</span>
          </div>
        </div>

        {/* Middle Column: Trust Ledger */}
        <div className="col-span-1 glass-panel rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-black/20">
            <h3 className="font-semibold text-gold-300 text-sm">Trust Ledger (Per Claim)</h3>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {appClaims.length === 0 ? (
              <div className="text-center text-white/40 text-sm mt-10">No claims extracted.</div>
            ) : (
              appClaims.map(claim => (
                <div key={claim.id} className={`p-3 rounded-lg border ${claim.trustScore.contradictionFlag ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">{claim.claimType.replace("_", " ")}</span>
                    <div className="flex items-center gap-1.5">
                      {claim.trustScore.contradictionFlag ? (
                        <ShieldAlert size={14} className="text-red-400" />
                      ) : (
                        <ShieldCheck size={14} className={`
                          ${claim.trustScore.score >= 80 ? 'text-green-400' : claim.trustScore.score >= 50 ? 'text-yellow-400' : 'text-red-400'}
                        `} />
                      )}
                      <span className={`text-xs font-bold ${claim.trustScore.contradictionFlag ? 'text-red-400' : 'text-white'}`}>
                        {claim.trustScore.score}/100
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-white/90 mb-2">"{claim.statement}"</p>
                  <div className="text-[10px] text-white/50 space-y-1 border-t border-white/10 pt-2">
                    <p><span className="text-white/30">Source:</span> {claim.source}</p>
                    <p className={claim.trustScore.contradictionFlag ? "text-red-300" : "text-white/60"}>
                      <span className="text-white/30">Reasoning:</span> {claim.trustScore.reasoning}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Original Document View (Mock) */}
        <div className="col-span-1 glass-panel rounded-xl flex flex-col overflow-hidden relative">
          <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
            <h3 className="font-semibold text-gold-300 text-sm flex items-center gap-2">
              <FileText size={16} /> Source Document
            </h3>
            <span className="text-xs text-white/40">{application.deckUrl || "No deck"}</span>
          </div>
          <div className="flex-1 bg-white/5 p-6 overflow-auto">
             {application.rawText ? (
                <div className="text-xs text-white/70 leading-relaxed font-mono whitespace-pre-wrap">
                  [TEXT EXTRACTED FROM UPLOAD]<br/><br/>
                  {application.rawText}
                </div>
             ) : (
                <div className="h-full flex items-center justify-center text-white/30 text-sm">Document viewer unavailable</div>
             )}
          </div>
          
          {/* Recommendation Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-md border-t border-white/10">
             <div className="flex items-center justify-between">
               <span className="text-sm text-white/60">System Recommendation:</span>
               <span className={`px-3 py-1 rounded font-bold text-sm uppercase tracking-wider
                 ${scores.recommendation === 'deploy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                   scores.recommendation === 'diligence' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                   'bg-red-500/20 text-red-400 border border-red-500/30'
                 }
               `}>
                 {scores.recommendation}
               </span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RadarApp;
