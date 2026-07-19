"use client";
import React, { useState } from "react";
import {
  Activity, Send, Clock, CheckCircle2, XCircle, Loader2,
  ChevronRight, Mail, Link2, GitFork, MessageSquare, Plus, Search
} from "lucide-react";

interface Message {
  id: string;
  founder: string;
  company: string;
  channel: "email" | "linkedin" | "github";
  subject: string;
  preview: string;
  status: "sent" | "opened" | "replied" | "bounced";
  sent_at: string;
  avatar: string;
  avatarColor: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: "m1", founder: "Alex Rivera", company: "Electron AI",
    channel: "email", subject: "Following up — edge LLM runtime",
    preview: "Hi Alex, we came across your GitHub repo electron-runtime and were impressed by the 4x latency benchmarks. We invest in early-stage AI infra at Seed...",
    status: "replied", sent_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    avatar: "AR", avatarColor: "from-blue-600 to-cyan-600"
  },
  {
    id: "m2", founder: "Mei Lin", company: "CarbonZero",
    channel: "linkedin", subject: "Carbon accounting SaaS — quick intro",
    preview: "Hi Mei, saw your carbonledger project gaining serious traction (500+ stars, enterprise DMs). We back climate tech founders at the earliest stage...",
    status: "opened", sent_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    avatar: "ML", avatarColor: "from-green-600 to-emerald-600"
  },
  {
    id: "m3", founder: "Rohan Verma", company: "MedScan",
    channel: "email", subject: "ETH Global winner — congrats + intro",
    preview: "Hi Rohan, congrats on the ETH Global win for MedScan. HIPAA-compliant AI diagnostics is exactly where we see transformative potential...",
    status: "sent", sent_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    avatar: "RV", avatarColor: "from-rose-600 to-pink-600"
  },
  {
    id: "m4", founder: "Zara Ahmed", company: "EduFlow",
    channel: "github", subject: "Issue comment re: AI tutoring architecture",
    preview: "Great work on the adaptive pacing algorithm — we're impressed by the 10k DAU traction. Would love to chat about the next phase...",
    status: "bounced", sent_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    avatar: "ZA", avatarColor: "from-amber-600 to-yellow-600"
  },
];

const DRAFT_TEMPLATE = `Hi {founder_name},

We came across {company_name} through {source} and were impressed by {signal}.

We invest in {stage} {sector} companies and typically write {check_size} checks. Based on what we've seen publicly, we think there could be a strong fit with our thesis.

Not a pitch — just a quick 20-minute call to learn more.

Would you be open to connecting this week?

Best,
[Your Name]
VC Brain Fund`;

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  sent:    { color: "text-white/40 bg-white/5 border-white/10",       icon: Clock,        label: "Sent" },
  opened:  { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: CheckCircle2, label: "Opened" },
  replied: { color: "text-green-400 bg-green-500/10 border-green-500/20", icon: MessageSquare, label: "Replied" },
  bounced: { color: "text-red-400 bg-red-500/10 border-red-500/20",   icon: XCircle,      label: "Bounced" },
};

const channelConfig: Record<string, { icon: React.ElementType; color: string }> = {
  email:    { icon: Mail,   color: "text-amber-400" },
  linkedin: { icon: Link2,  color: "text-blue-400"  },
  github:   { icon: GitFork, color: "text-emerald-400" },
};

export default function MessagesApp() {
  const [now] = useState(() => Date.now());
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [selected, setSelected] = useState<Message | null>(messages[0]);
  const [view, setView] = useState<"inbox" | "compose">("inbox");
  const [draft, setDraft] = useState(DRAFT_TEMPLATE);
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const filtered = messages.filter(m =>
    !query ||
    m.founder.toLowerCase().includes(query.toLowerCase()) ||
    m.company.toLowerCase().includes(query.toLowerCase())
  );

  const timeAgo = (iso: string) => {
    const d = Math.floor((now - new Date(iso).getTime()) / 86400000);
    return d === 0 ? "today" : d === 1 ? "yesterday" : `${d}d ago`;
  };

  const handleSend = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    setTimeout(() => { setSent(false); setView("inbox"); }, 2000);
  };

  const openedCount = messages.filter(m => m.status === "opened").length;
  const repliedCount = messages.filter(m => m.status === "replied").length;
  const replyRate = messages.length ? Math.round((repliedCount / messages.length) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-[#08090c] text-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="text-sky-400" size={22} />
            Outreach Messages
          </h2>
          <button
            onClick={() => setView(view === "compose" ? "inbox" : "compose")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 text-xs transition-colors"
          >
            <Plus size={12} /> New Outreach
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-white">{messages.length}</p>
            <p className="text-xs text-white/30">Total Sent</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-blue-400">{openedCount}</p>
            <p className="text-xs text-white/30">Opened</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-400">{replyRate}%</p>
            <p className="text-xs text-white/30">Reply Rate</p>
          </div>
        </div>
      </div>

      {/* Compose View */}
      {view === "compose" && (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-white/50">Draft a cold outreach message. Variables will be filled by the AI from founder data.</p>
          <div>
            <label className="text-xs text-white/30 mb-1.5 block">Channel</label>
            <div className="flex gap-2">
              {(["email", "linkedin", "github"] as const).map(ch => {
                const { icon: Icon, color } = channelConfig[ch];
                return (
                  <button key={ch} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/8 text-xs text-white/60 transition-colors capitalize">
                    <Icon size={13} className={color} /> {ch}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs text-white/30 mb-1.5 block">Message Template</label>
            <textarea
              rows={14}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/70 outline-none resize-none font-mono focus:border-sky-500/50 leading-relaxed"
            />
          </div>
          {sent ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
              <CheckCircle2 size={16} /> Message sent successfully!
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full py-2.5 bg-sky-500/15 border border-sky-500/30 text-sky-400 rounded-xl hover:bg-sky-500/25 transition-colors font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? "Sending…" : "Send Outreach"}
            </button>
          )}
        </div>
      )}

      {/* Inbox View */}
      {view === "inbox" && (
        <div className="flex flex-1 overflow-hidden">
          {/* List */}
          <div className="w-48 border-r border-white/5 flex flex-col shrink-0">
            <div className="p-3 border-b border-white/5">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">
                <Search size={12} className="text-white/30" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-white/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(m => {
                const { icon: StatusIcon, color } = statusConfig[m.status];
                const { icon: ChIcon, color: chColor } = channelConfig[m.channel];
                const isActive = selected?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className={`w-full text-left p-3 border-b border-white/3 hover:bg-white/4 transition-colors ${isActive ? "bg-white/6" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${m.avatarColor} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                        {m.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{m.founder}</p>
                        <p className="text-xs text-white/30 truncate">{m.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusIcon size={10} className={color.split(" ")[0]} />
                      <span className={`text-xs ${color.split(" ")[0]}`}>{statusConfig[m.status].label}</span>
                      <span className="text-xs text-white/20 ml-auto">{timeAgo(m.sent_at)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          {selected ? (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-start gap-3 mb-5">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selected.avatarColor} flex items-center justify-center font-bold text-white shrink-0`}>
                  {selected.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white">{selected.founder}</h3>
                    <span className="text-xs text-white/30">@ {selected.company}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => { const { icon: CI, color: cc } = channelConfig[selected.channel]; return <CI size={12} className={cc} />; })()}
                    <span className="text-xs text-white/30 capitalize">{selected.channel}</span>
                    <span className="text-xs text-white/20">· {timeAgo(selected.sent_at)}</span>
                    {(() => {
                      const { icon: SI, color: sc, label } = statusConfig[selected.status];
                      return (
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${sc}`}>
                          <SI size={10} /> {label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="bg-white/3 border border-white/8 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-white mb-2">{selected.subject}</p>
                <p className="text-sm text-white/60 leading-relaxed">{selected.preview}</p>
              </div>
              {selected.status === "replied" && (
                <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
                  <p className="text-xs text-green-400 font-semibold mb-2">✓ Founder replied — move to diligence?</p>
                  <button className="px-4 py-2 bg-green-500/15 border border-green-500/30 text-green-400 rounded-lg text-xs hover:bg-green-500/25 transition-colors">
                    Open Application
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
              Select a message
            </div>
          )}
        </div>
      )}
    </div>
  );
}
