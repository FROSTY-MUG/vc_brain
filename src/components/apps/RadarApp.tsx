"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Loader2, ExternalLink, Github, Linkedin, Twitter, Target, TrendingUp, RefreshCw, Star, Code2, AlertCircle } from "lucide-react";

interface Founder {
  id: string;
  name: string;
  bio?: string;
  email?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  location?: string;
  founder_scores?: Array<{
    overall_score: number;
    execution_velocity: number;
    domain_expertise: number;
    resilience_history: number;
    network_centrality: number;
  }>;
  startups?: Array<{ name: string; sector: string; stage: string }>;
}

export default function RadarApp() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchFounders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/founders");
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      setFounders(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFounders();
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => fetchFounders(true), 10000);
    return () => clearInterval(interval);
  }, [fetchFounders]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  if (loading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-amber-400" size={36} />
        <p className="text-white/50 text-sm">Scanning the radar...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="text-amber-400" size={22} />
            Opportunity Radar
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Live founder signals — refreshing every 10s •{" "}
            <span className="text-amber-400/80">
              {lastUpdated.toLocaleTimeString()}
            </span>
          </p>
        </div>
        <button
          onClick={() => fetchFounders(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin text-amber-400" : "text-white/50"} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-white/5 shrink-0">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{founders.length}</div>
          <div className="text-xs text-white/40 mt-0.5">Total Founders</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">
            {founders.filter(f => (f.founder_scores?.[0]?.overall_score || 0) >= 75).length}
          </div>
          <div className="text-xs text-amber-400/60 mt-0.5">High Signal</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">
            {founders.filter(f => f.startups && f.startups.length > 0).length}
          </div>
          <div className="text-xs text-green-400/60 mt-0.5">With Startups</div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="m-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          {error} — Check backend is running on port 8000
        </div>
      )}

      {/* Founder List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {founders.length === 0 && !error ? (
          <div className="text-center p-12 bg-white/3 rounded-xl border border-white/5">
            <Target className="mx-auto text-white/20 mb-4" size={40} />
            <p className="text-white/40 text-sm">No founders detected yet.</p>
            <p className="text-white/25 text-xs mt-1">Upload a pitch deck in Sourcing Engine to begin.</p>
          </div>
        ) : (
          founders.map(founder => {
            const score = founder.founder_scores?.[0];
            const overallScore = score?.overall_score || 0;
            return (
              <div
                key={founder.id}
                className={`rounded-xl border transition-all duration-200 cursor-pointer ${
                  expandedId === founder.id
                    ? "border-amber-500/30 shadow-lg shadow-amber-500/5 bg-[#111114]"
                    : "border-white/5 bg-[#0d0d10] hover:border-white/10"
                }`}
                onClick={() => setExpandedId(expandedId === founder.id ? null : founder.id)}
              >
                {/* Collapsed Header */}
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center shrink-0 text-amber-300 font-bold text-sm border border-amber-500/20">
                      {founder.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{founder.name}</h3>
                      <p className="text-white/40 text-xs truncate">{founder.bio || founder.email || "No bio"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {founder.startups?.[0] && (
                      <span className="hidden sm:block text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
                        {founder.startups[0].name}
                      </span>
                    )}
                    {score ? (
                      <div className={`flex flex-col items-center min-w-[60px] p-2 rounded-lg border ${getScoreBg(overallScore)}`}>
                        <span className={`text-xl font-black ${getScoreColor(overallScore)}`}>
                          {overallScore}
                        </span>
                        <span className="text-xs text-white/30 mt-0.5">score</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center min-w-[60px] p-2 rounded-lg border border-white/5">
                        <span className="text-sm text-white/30">—</span>
                        <span className="text-xs text-white/20">no score</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === founder.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/5" onClick={e => e.stopPropagation()}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      {/* Score Breakdown */}
                      {score && (
                        <div className="md:col-span-2 bg-black/30 rounded-lg p-4 border border-white/5">
                          <h4 className="font-semibold text-white/70 text-xs uppercase tracking-wider mb-3">Score Breakdown</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: "Execution Velocity", value: score.execution_velocity, color: "blue" },
                              { label: "Domain Expertise", value: score.domain_expertise, color: "purple" },
                              { label: "Resilience", value: score.resilience_history, color: "green" },
                              { label: "Network", value: score.network_centrality, color: "amber" },
                            ].map(m => (
                              <div key={m.label}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-white/50">{m.label}</span>
                                  <span className="text-white font-mono">{m.value || 0}</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-${m.color}-400`}
                                    style={{ width: `${m.value || 0}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Startup Info */}
                      {founder.startups?.[0] && (
                        <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                          <h4 className="font-semibold text-white/70 text-xs uppercase tracking-wider mb-3">Startup</h4>
                          <p className="text-white font-semibold">{founder.startups[0].name}</p>
                          <p className="text-white/40 text-xs mt-1">{founder.startups[0].sector}</p>
                          <span className="inline-block mt-2 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400 capitalize">
                            {founder.startups[0].stage}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Social Links */}
                    <div className="flex flex-wrap gap-2">
                      {founder.github_url && (
                        <a
                          href={founder.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/70 transition-colors"
                        >
                          <Github size={13} /> GitHub
                        </a>
                      )}
                      {founder.linkedin_url && (
                        <a
                          href={founder.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-xs text-blue-400 transition-colors"
                        >
                          <Linkedin size={13} /> LinkedIn
                        </a>
                      )}
                      {founder.twitter_url && (
                        <a
                          href={founder.twitter_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg text-xs text-sky-400 transition-colors"
                        >
                          <Twitter size={13} /> X / Twitter
                        </a>
                      )}
                      {founder.email && (
                        <a
                          href={`mailto:${founder.email}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs text-amber-400 transition-colors"
                        >
                          <ExternalLink size={13} /> Reach Out
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
