"use client";

import React, { useState } from "react";
import { applications as defaultApps, outboundSignals } from "@/data/seed";
import { Search, ArrowUpRight, ArrowDownRight, Minus, ExternalLink, Github, FileText, Zap, Globe, GraduationCap, Upload, Loader } from "lucide-react";

const sourceIcons: Record<string, React.ReactNode> = {
  "GitHub Trending": <Github size={14} className="text-white" />,
  "arXiv": <FileText size={14} className="text-orange-400" />,
  "Product Hunt": <Zap size={14} className="text-orange-500" />,
  "Y Combinator W24": <GraduationCap size={14} className="text-orange-400" />,
  "ETHGlobal Hackathon": <Globe size={14} className="text-blue-400" />,
};

const SourcingApp = () => {
  const [tab, setTab] = useState<"inbound" | "outbound">("inbound");
  const [search, setSearch] = useState("");
  const [apps, setApps] = useState(defaultApps);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("Uploading deck...");

    const formData = new FormData();
    formData.append("deck", file);
    formData.append("company_name", file.name.replace(".pdf", ""));

    try {
      // Send to FastAPI backend
      const res = await fetch("http://localhost:8000/api/applications/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok) {
        setUploadStatus("AI Agents extracting claims...");
        // Add optimistic application
        setApps(prev => [{
          id: data.application_id,
          startupId: "new_startup",
          sourceType: "inbound",
          status: "screening",
          rawText: "LangGraph agents are processing this PDF...",
          appliedAt: new Date().toISOString()
        }, ...prev]);
        
        // Wait a few seconds for demo effect (in reality we'd poll or websocket)
        setTimeout(() => {
          setIsUploading(false);
          setUploadStatus("");
        }, 3000);
      } else {
        setUploadStatus("Upload failed.");
        setIsUploading(false);
      }
    } catch (err) {
      console.error(err);
      setUploadStatus("Server connection failed.");
      setIsUploading(false);
    }
  };

  return (
    <div className="p-5 text-white h-full flex flex-col overflow-hidden relative">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gold-gradient">Sourcing Terminal</h2>
          <p className="text-xs text-white/50 mt-0.5">Inbound pipeline &amp; Outbound signal detection</p>
        </div>
        <div className="flex gap-1 glass-panel rounded-lg p-1">
          <button
            onClick={() => setTab("inbound")}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === "inbound" ? "bg-gold-500/20 text-gold-300" : "text-white/50 hover:text-white"
            }`}
          >
            Inbound ({apps.length})
          </button>
          <button
            onClick={() => setTab("outbound")}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === "outbound" ? "bg-gold-500/20 text-gold-300" : "text-white/50 hover:text-white"
            }`}
          >
            Outbound ({outboundSignals.length})
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search founders, sectors, signals..."
            className="w-full bg-black/50 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-gold-500/50 outline-none"
          />
        </div>
        
        {/* Upload Deck Button */}
        {tab === "inbound" && (
          <label className="flex items-center gap-2 px-4 py-2.5 glass-button rounded-lg text-sm cursor-pointer hover:bg-white/10 transition-colors border border-white/20">
             {isUploading ? <Loader size={16} className="animate-spin text-gold-400" /> : <Upload size={16} className="text-gold-400" />}
             {isUploading ? "Processing..." : "Upload Pitch Deck"}
             <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        )}
      </div>

      {uploadStatus && (
        <div className="text-xs text-gold-300 bg-gold-500/10 border border-gold-500/30 rounded-lg p-2 mb-4 animate-pulse">
          {uploadStatus}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto space-y-3">
        {tab === "inbound" ? (
          <>
            {apps.map((app) => (
              <div key={app.id} className="glass-panel rounded-xl p-4 hover:border-gold-500/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-base group-hover:text-gold-300 transition-colors">
                    {app.startupId === "new_startup" ? "New Application" : "Demo Startup"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                    {app.status}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-1 line-clamp-2">{app.rawText}</p>
              </div>
            ))}
          </>
        ) : (
          <>
            {outboundSignals.map((signal) => (
               <div key={signal.id} className="glass-panel rounded-xl p-4 hover:border-gold-500/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-2">
                     {sourceIcons[signal.source]}
                     <h3 className="font-semibold text-sm group-hover:text-gold-300 transition-colors">{signal.title}</h3>
                  </div>
                  <p className="text-xs text-white/50 mt-1">{signal.description}</p>
               </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default SourcingApp;
