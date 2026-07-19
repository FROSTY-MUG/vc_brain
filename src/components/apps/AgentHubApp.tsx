"use client";
import React, { useState, useEffect } from "react";
import { Bot, Activity, CheckCircle2, XCircle, Loader2, RefreshCw, Zap, Brain, Search, FileText, Shield, Database } from "lucide-react";

interface AgentLog {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  status: "success" | "running" | "failed" | "pending";
  detail?: string;
  duration?: string;
}

const AGENT_CONFIGS = [
  { id: "sourcing", name: "Sourcing Agent", icon: Search, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", description: "Scrapes GitHub, ProductHunt, Devpost to discover founders" },
  { id: "screening", name: "Screening Agent", icon: Brain, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", description: "Runs 3-axis VC Brain score across all applications" },
  { id: "diligence", name: "Diligence Agent", icon: Shield, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", description: "Validates claims, scrapes LinkedIn & X for social proof" },
  { id: "memo", name: "Memo Agent", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", description: "Generates evidence-backed investment memos" },
  { id: "memory", name: "Memory Layer", icon: Database, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", description: "Persists founder scores, trust history, and pipeline state" },
];

const INITIAL_LOGS: AgentLog[] = [
  { id: "1", timestamp: "12:04:01", agent: "Sourcing Agent", action: "Scraped 3 new founders from ProductHunt", status: "success", duration: "2.3s" },
  { id: "2", timestamp: "12:03:45", agent: "Screening Agent", action: "Scored application #A-2094 — Score: 82/100", status: "success", duration: "4.1s" },
  { id: "3", timestamp: "12:03:22", agent: "Diligence Agent", action: "Fetching GitHub repos for Arjun Mehta", status: "running" },
  { id: "4", timestamp: "12:03:10", agent: "Memory Layer", action: "Persisted trust score update for founder #F-0031", status: "success", duration: "0.1s" },
  { id: "5", timestamp: "12:02:54", agent: "Memo Agent", action: "Generated memo for Flowbit AI — 11 sections", status: "success", duration: "12.4s" },
  { id: "6", timestamp: "12:02:30", agent: "Sourcing Agent", action: "Webhook received from Devpost", status: "success", duration: "0.4s" },
];

export default function AgentHubApp() {
  const [logs, setLogs] = useState<AgentLog[]>(INITIAL_LOGS);
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"agents" | "logs">("agents");

  // Simulate live log updates
  useEffect(() => {
    const actions = [
      { agent: "Sourcing Agent", action: "Scanning GitHub trending repositories for AI founders" },
      { agent: "Screening Agent", action: "Re-scoring 5 applications against updated thesis" },
      { agent: "Memory Layer", action: "Syncing founder index from Supabase" },
      { agent: "Diligence Agent", action: "Validating LinkedIn claims for new submission" },
      { agent: "Memo Agent", action: "Queuing memo generation for 2 pending applications" },
    ];
    const interval = setInterval(() => {
      const pick = actions[Math.floor(Math.random() * actions.length)];
      const newLog: AgentLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        agent: pick.agent,
        action: pick.action,
        status: Math.random() > 0.1 ? "success" : "running",
        duration: `${(Math.random() * 5).toFixed(1)}s`,
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerAgent = async (agentId: string) => {
    setRunningAgents(prev => new Set(prev).add(agentId));
    try {
      if (agentId === "sourcing") {
        await fetch("http://localhost:8000/api/sourcing/run", { method: "POST" }).catch(() => {});
      }
    } finally {
      setTimeout(() => {
        setRunningAgents(prev => {
          const next = new Set(prev);
          next.delete(agentId);
          return next;
        });
        const agent = AGENT_CONFIGS.find(a => a.id === agentId);
        if (agent) {
          const newLog: AgentLog = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            agent: agent.name,
            action: `Manual trigger completed`,
            status: "success",
            duration: `${(Math.random() * 8 + 1).toFixed(1)}s`,
          };
          setLogs(prev => [newLog, ...prev]);
        }
      }, 3000);
    }
  };

  const getStatusIcon = (status: AgentLog["status"]) => {
    switch (status) {
      case "success": return <CheckCircle2 size={14} className="text-green-400 shrink-0" />;
      case "running": return <Loader2 size={14} className="text-blue-400 animate-spin shrink-0" />;
      case "failed": return <XCircle size={14} className="text-red-400 shrink-0" />;
      default: return <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />;
    }
  };

  const successCount = logs.filter(l => l.status === "success").length;
  const runningCount = logs.filter(l => l.status === "running").length;

  return (
    <div className="h-full flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bot className="text-cyan-400" size={22} />
            Agent Hub
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">All Systems Online</span>
            </div>
          </div>
        </div>
        {/* Live stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-green-400">{successCount}</p>
            <p className="text-xs text-white/30">Completed</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-blue-400">{runningCount}</p>
            <p className="text-xs text-white/30">Running</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-amber-400">{AGENT_CONFIGS.length}</p>
            <p className="text-xs text-white/30">Agents</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 pt-4 shrink-0">
        {(["agents", "logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${activeTab === tab ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400" : "text-white/40 hover:text-white/60"}`}>
            {tab === "logs" ? `Live Logs (${logs.length})` : "Agents"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "agents" && (
          <div className="space-y-3">
            {AGENT_CONFIGS.map(agent => {
              const isRunning = runningAgents.has(agent.id);
              return (
                <div key={agent.id} className={`${agent.bg} border ${agent.border} rounded-xl p-4 flex items-center gap-4`}>
                  <div className={`w-11 h-11 rounded-xl bg-black/30 border ${agent.border} flex items-center justify-center shrink-0`}>
                    <agent.icon size={20} className={agent.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{agent.description}</p>
                  </div>
                  <button
                    onClick={() => triggerAgent(agent.id)}
                    disabled={isRunning}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${isRunning ? "border-white/10 text-white/30" : `${agent.border} ${agent.color} hover:bg-white/5`}`}
                  >
                    {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                    {isRunning ? "Running..." : "Run"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-3 text-xs text-white/30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live activity feed — updates every 5s
            </div>
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-white/3 hover:bg-white/5 rounded-lg transition-colors border border-white/5">
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white/70">{log.agent}</span>
                    {log.duration && <span className="text-xs text-white/20">{log.duration}</span>}
                    <span className="ml-auto text-xs text-white/20 shrink-0">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">{log.action}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
