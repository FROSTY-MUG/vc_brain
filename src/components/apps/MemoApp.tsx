"use client";

import React, { useState } from "react";
import { memos, startups, applications } from "@/data/seed";
import { CheckCircle2, AlertTriangle, HelpCircle, FileText, Download } from "lucide-react";

const MemoApp = () => {
  const [selectedMemoId, setSelectedMemoId] = useState("memo_01");
  const memo = memos.find(m => m.id === selectedMemoId);
  const application = applications.find(a => a.id === memo?.applicationId);
  const startup = startups.find(s => s.id === application?.startupId);

  if (!memo) return <div className="p-6 text-white">Loading memo...</div>;

  return (
    <div className="text-white h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <FileText className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Investment Memo</h2>
            <p className="text-[10px] text-white/50">Generated at {new Date(memo.generatedAt).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="bg-black/50 border border-white/20 rounded-md px-2 py-1.5 text-xs outline-none focus:border-purple-500/50"
            value={selectedMemoId}
            onChange={(e) => setSelectedMemoId(e.target.value)}
          >
            {memos.map(m => {
               const app = applications.find(a => a.id === m.applicationId);
               const st = startups.find(s => s.id === app?.startupId);
               return <option key={m.id} value={m.id}>{st?.name || m.id}</option>;
            })}
          </select>
          <button className="flex items-center gap-2 px-3 py-1.5 glass-button rounded-md text-xs">
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Memo Content */}
      <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full">
        <div className="glass-panel p-10 rounded-xl bg-white/[0.02]">
          
          {/* Title */}
          <div className="text-center mb-10 pb-6 border-b border-white/10">
            <h1 className="text-3xl font-serif font-bold text-gold-400 mb-2">{startup?.name}</h1>
            <p className="text-white/60 uppercase tracking-widest text-xs font-semibold">24-Hour Deployment Memo</p>
          </div>

          {/* Recommendation Box */}
          <div className={`p-4 rounded-lg border mb-10 ${
            memo.recommendation.action === 'deploy' ? 'bg-green-500/10 border-green-500/30' :
            memo.recommendation.action === 'diligence' ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                memo.recommendation.action === 'deploy' ? 'text-green-400' :
                memo.recommendation.action === 'diligence' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                Recommendation: {memo.recommendation.action} (Confidence: {memo.recommendation.confidence})
              </span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed font-medium">{memo.recommendation.reasoning}</p>
          </div>

          <div className="space-y-8 font-serif text-sm text-white/80 leading-relaxed">
            
            {/* Snapshot */}
            <section>
              <h3 className="text-lg font-bold text-white mb-2 font-sans border-b border-white/10 pb-1">1. Company Snapshot</h3>
              <p>{memo.companySnapshot}</p>
            </section>

            {/* Hypotheses */}
            <section>
              <h3 className="text-lg font-bold text-white mb-2 font-sans border-b border-white/10 pb-1">2. Investment Hypotheses</h3>
              <ul className="list-disc pl-5 space-y-1">
                {memo.investmentHypotheses.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </section>

            {/* Trust Summary */}
            <section className="bg-black/30 p-4 rounded-lg border border-white/5 my-6">
              <h3 className="text-sm font-bold text-white mb-3 font-sans flex items-center gap-2">
                <ShieldCheck size={16} className="text-gold-400" /> Data Trust Summary
              </h3>
              <div className="flex gap-6 mb-3 text-xs font-sans">
                <div><span className="text-white/50">Verified Claims:</span> <span className="font-bold text-green-400">{memo.trustSummary.verifiedClaims}</span></div>
                <div><span className="text-white/50">Contradictions:</span> <span className="font-bold text-red-400">{memo.trustSummary.contradictions}</span></div>
                <div><span className="text-white/50">Avg Trust:</span> <span className="font-bold">{memo.trustSummary.avgTrustScore}/100</span></div>
              </div>
              {memo.trustSummary.flags.length > 0 && (
                <div className="text-xs text-yellow-200/80 font-sans border-l-2 border-yellow-500/50 pl-3">
                  {memo.trustSummary.flags.map((f, i) => <div key={i}>• {f}</div>)}
                </div>
              )}
            </section>

            {/* Problem & Product */}
            <section>
              <h3 className="text-lg font-bold text-white mb-2 font-sans border-b border-white/10 pb-1">3. Problem & Product</h3>
              <p>{memo.problemAndProduct}</p>
            </section>

            {/* Sections Loop */}
            {[
              { title: "4. Traction & KPIs", data: memo.tractionAndKPIs },
              { title: "5. Team & History", data: memo.teamAndHistory },
              { title: "6. Technology & Defensibility", data: memo.technologyAndDefensibility },
              { title: "7. Market Sizing", data: memo.marketSizing },
              { title: "8. Competition", data: memo.competition },
            ].map(section => (
              <section key={section.title}>
                <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-2">
                  <h3 className="text-lg font-bold text-white font-sans">{section.title}</h3>
                  <span className={`text-[10px] uppercase font-sans font-bold px-2 py-0.5 rounded ${
                    section.data.dataStatus === 'available' ? 'bg-green-500/10 text-green-400' :
                    section.data.dataStatus === 'partial' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {section.data.dataStatus}
                  </span>
                </div>
                {section.data.dataStatus === 'missing' ? (
                  <p className="text-white/40 italic">Data not provided in application materials.</p>
                ) : (
                  <>
                    <p>{section.data.content}</p>
                    {section.data.citations.length > 0 && (
                      <p className="text-[10px] text-white/40 font-sans mt-2">
                        Citations: {section.data.citations.join(", ")}
                      </p>
                    )}
                  </>
                )}
              </section>
            ))}

            {/* SWOT */}
            <section>
              <h3 className="text-lg font-bold text-white mb-4 font-sans border-b border-white/10 pb-1">9. SWOT Analysis</h3>
              <div className="grid grid-cols-2 gap-6 text-xs font-sans">
                <div>
                  <h4 className="font-bold text-green-400 mb-2">Strengths</h4>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">{memo.swot.strengths.map((s,i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div>
                  <h4 className="font-bold text-red-400 mb-2">Weaknesses</h4>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">{memo.swot.weaknesses.map((s,i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div>
                  <h4 className="font-bold text-blue-400 mb-2">Opportunities</h4>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">{memo.swot.opportunities.map((s,i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div>
                  <h4 className="font-bold text-orange-400 mb-2">Threats</h4>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">{memo.swot.threats.map((s,i) => <li key={i}>{s}</li>)}</ul>
                </div>
              </div>
            </section>

            {/* Open Questions */}
            <section className="bg-white/5 p-5 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-3 font-sans flex items-center gap-2">
                <HelpCircle size={18} className="text-purple-400" /> Open Questions for Diligence
              </h3>
              <ul className="list-decimal pl-5 space-y-2 text-white/90">
                {memo.openQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoApp;
