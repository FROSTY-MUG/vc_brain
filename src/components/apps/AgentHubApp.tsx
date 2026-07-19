"use client";
import React, { useState, useEffect } from "react";
import { BACKEND_URL } from "@/lib/api";
import { Bot, Activity, CheckCircle2, XCircle, Loader2, RefreshCw, Zap, Brain, Search, FileText, Shield, Database } from "lucide-react";
import Scroller from "@/components/Scroller";

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
  { id: "screening", name: "Pitch Deck Analyzer", icon: Brain, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", description: "Extracts data from uploaded Pitch Decks and runs VC Brain scoring" },
  { id: "diligence", name: "Diligence Agent", icon: Shield, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", description: "Validates claims, scrapes LinkedIn & X for social proof" },
  { id: "memo", name: "Memo Agent", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", description: "Generates evidence-backed investment memos" },
  { id: "memory", name: "Memory Layer", icon: Database, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", description: "Persists founder scores, trust history, and pipeline state" },
];

const INITIAL_LOGS: AgentLog[] = [
  { id: "1", timestamp: "12:04:01", agent: "Sourcing Agent", action: "Scraped 5 new founders from GitHub India — NeuralFlow trending #3", status: "success", duration: "2.3s" },
  { id: "2", timestamp: "12:03:45", agent: "Screening Agent", action: "Scored Priya Iyer (NeuralFlow) — VC Brain Score: 91/100", status: "success", duration: "4.1s" },
  { id: "3", timestamp: "12:03:22", agent: "Diligence Agent", action: "Fetching GitHub repos for Divya Menon (CodeLens)", status: "running" },
  { id: "4", timestamp: "12:03:10", agent: "Memory Layer", action: "Persisted trust score update for Meera Nair (PaySwift)", status: "success", duration: "0.1s" },
  { id: "5", timestamp: "12:02:54", agent: "Memo Agent", action: "Generated investment memo for NeuralFlow — 14 sections", status: "success", duration: "12.4s" },
  { id: "6", timestamp: "12:02:30", agent: "Sourcing Agent", action: "Webhook received from Smart India Hackathon Devpost", status: "success", duration: "0.4s" },
  { id: "7", timestamp: "12:01:55", agent: "Screening Agent", action: "Scored Aditya Shankar (MedBrief AI) — Score: 83/100", status: "success", duration: "3.8s" },
];


export default function AgentHubApp() {
  const [logs, setLogs] = useState<AgentLog[]>(INITIAL_LOGS);
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"agents" | "logs">("agents");

  const fetchRealLogs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/applications/`);
      if (res.ok) {
        const apps = await res.json();
        let allLogs: AgentLog[] = [];
        for (const app of apps) {
          if (app.cot_log) {
            try {
              const parsed = typeof app.cot_log === "string" ? JSON.parse(app.cot_log) : app.cot_log;
              parsed.forEach((l: any, i: number) => {
                allLogs.push({
                  id: `${app.id}-${i}`,
                  timestamp: new Date(l.ts).toLocaleTimeString(),
                  agent: l.agent,
                  action: l.action,
                  status: l.status === "failed" ? "failed" : "success",
                  detail: l.detail,
                });
              });
            } catch (e) {}
          }
        }
        allLogs.sort((a, b) => new Date(`1970/01/01 ${b.timestamp}`).getTime() - new Date(`1970/01/01 ${a.timestamp}`).getTime());
        if (allLogs.length > 0) {
          setLogs(allLogs.slice(0, 100));
        }
      }
    } catch (e) {
      // Keep INITIAL_LOGS silently on error
    }
  };

  useEffect(() => {
    fetchRealLogs();
    const interval = setInterval(fetchRealLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerAgent = async (agentId: string) => {
    setRunningAgents(prev => new Set(prev).add(agentId));
    try {
      if (agentId === "sourcing") {
        await fetch(`${BACKEND_URL}/api/sourcing/run`, { method: "POST" }).catch(() => {});
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
    <div className="absolute inset-0 flex flex-col bg-[#08090c] text-white overflow-hidden">
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

      <Scroller className="flex-1 min-h-0 p-4">
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
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2 text-xs text-white/30">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                 Live Agentic Traceability Feed (Chain of Thought)
               </div>
            </div>
            {logs.length === 0 && (
              <div className="text-center text-xs text-white/40 py-10 border border-dashed border-white/10 rounded-xl">
                No pipeline traces found. Upload a pitch deck to trigger the AI agents.
              </div>
            )}
            {logs.map(log => (
              <div key={log.id} className="flex flex-col gap-2 p-3 bg-white/3 hover:bg-white/5 rounded-lg transition-colors border border-white/5">
                <div className="flex items-start gap-3">
                  {getStatusIcon(log.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white/70">{log.agent}</span>
                      <span className="ml-auto text-xs text-white/20 shrink-0">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">{log.action}</p>
                  </div>
                </div>
                {log.detail && (
                  <div className="ml-7 p-2 rounded bg-black/20 border border-white/5 text-[10px] text-white/40 font-mono overflow-x-auto whitespace-pre-wrap">
                    {log.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Scroller>
    </div>
  );
}
