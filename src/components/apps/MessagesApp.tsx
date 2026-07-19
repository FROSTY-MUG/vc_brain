"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Send, Loader2, Plus, Search, MessageSquare, ArrowLeft, Check, CheckCheck, Image, Smile } from "lucide-react";

interface UserProfile {
  email: string;
  name: string;
  avatar_url: string;
  role: string;
}

interface Conversation {
  other_email: string;
  other_name?: string;
  last_message: string;
  last_message_at: string;
  unread_count?: number;
}

interface ChatMessage {
  id: string;
  sender_email: string;
  recipient_email: string;
  content: string;
  sent_at: string;
  read: boolean;
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const AVATAR_COLORS = [
  "from-purple-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-blue-500 to-cyan-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-blue-600",
];

function getColor(email: string) {
  const idx = email.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function Avatar({ name, email, size = 10 }: { name: string; email: string; size?: number }) {
  const letter = (name || email || "?")[0].toUpperCase();
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${getColor(email)} flex items-center justify-center font-bold text-white shrink-0`}
      style={{ width: size * 4, height: size * 4, fontSize: size * 1.4 }}>
      {letter}
    </div>
  );
}

function timeLabel(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffH < 48) return `Yesterday ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesApp() {
  const { data: session } = useSession();
  const currentUserEmail = session?.user?.email || "";
  const currentUserName = session?.user?.name || currentUserEmail;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [view, setView] = useState<"inbox" | "compose">("inbox");
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<UserProfile | null>(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const fetchConversations = useCallback(async () => {
    if (!currentUserEmail) return;
    try {
      const res = await fetch(`${API}/py-api/messages/conversations/${encodeURIComponent(currentUserEmail)}`);
      if (res.ok) setConversations(await res.json());
    } catch {}
  }, [currentUserEmail]);

  const fetchMessages = useCallback(async (otherEmail: string) => {
    if (!currentUserEmail || !otherEmail) return;
    try {
      const res = await fetch(`${API}/py-api/messages/conversation/${encodeURIComponent(currentUserEmail)}/${encodeURIComponent(otherEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setTimeout(scrollToBottom, 50);
      }
    } catch {}
  }, [currentUserEmail]);

  // User search
  useEffect(() => {
    if (view !== "compose") return;
    const search = async () => {
      try {
        const res = await fetch(`${API}/py-api/profile/search/?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults((data || []).filter((u: UserProfile) => u.email !== currentUserEmail));
        }
      } catch {}
    };
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [searchQuery, view, currentUserEmail]);

  // Initial load + polling
  useEffect(() => {
    fetchConversations();
    pollRef.current = setInterval(() => {
      fetchConversations();
      if (selectedEmail) fetchMessages(selectedEmail);
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [currentUserEmail, selectedEmail, fetchConversations, fetchMessages]);

  useEffect(() => {
    if (selectedEmail) fetchMessages(selectedEmail);
  }, [selectedEmail, fetchMessages]);

  const handleSelectConvo = (email: string, name?: string) => {
    setSelectedEmail(email);
    setSelectedName(name || email);
    setView("inbox");
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    const recipient = view === "compose" ? selectedRecipient?.email : selectedEmail;
    if (!recipient || !draft.trim() || !currentUserEmail) return;
    const content = draft.trim();
    setDraft("");

    // Optimistic UI: add message locally immediately
    const optimistic: ChatMessage = {
      id: `opt_${Date.now()}`,
      sender_email: currentUserEmail,
      recipient_email: recipient,
      content,
      sent_at: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(scrollToBottom, 50);

    setSending(true);
    try {
      const res = await fetch(`${API}/py-api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_email: currentUserEmail, recipient_email: recipient, content }),
      });
      if (res.ok) {
        if (view === "compose") {
          setSelectedEmail(recipient);
          setSelectedName(selectedRecipient?.name || recipient);
          setView("inbox");
        } else {
          fetchMessages(recipient);
        }
        fetchConversations();
      }
    } catch {} finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date for Instagram-style separators
  const groupedMessages = messages.reduce<{ date: string; msgs: ChatMessage[] }[]>((acc, msg) => {
    const date = new Date(msg.sent_at).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    const last = acc[acc.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      acc.push({ date, msgs: [msg] });
    }
    return acc;
  }, []);

  return (
    <div className="absolute inset-0 flex bg-[#08090c] text-white overflow-hidden">
      {/* LEFT: Conversation Sidebar */}
      <div className={`${selectedEmail ? "hidden md:flex" : "flex"} w-full md:w-[320px] flex-col border-r border-white/5 bg-[#0a0b0f] shrink-0`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">{currentUserName.split(" ")[0]}'s Messages</h2>
            <button
              onClick={() => { setView("compose"); setSelectedRecipient(null); setSearchQuery(""); }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
            <Search size={14} className="text-white/30" />
            <input placeholder="Search messages..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-white/20">
              <MessageSquare size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs mt-1">Click + to start a conversation.</p>
            </div>
          ) : (
            conversations.map(c => {
              const isActive = selectedEmail === c.other_email;
              const name = c.other_name || c.other_email;
              return (
                <button
                  key={c.other_email}
                  onClick={() => handleSelectConvo(c.other_email, c.other_name)}
                  className={`w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/[0.03] ${isActive ? "bg-white/8" : ""}`}
                >
                  <div className="relative">
                    <Avatar name={name} email={c.other_email} size={10} />
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0b0f]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate">{name}</p>
                      <span className="text-[10px] text-white/30 shrink-0 ml-2">{timeLabel(c.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">{c.last_message}</p>
                  </div>
                  {c.unread_count && c.unread_count > 0 && (
                    <div className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] flex items-center justify-center shrink-0 font-bold">
                      {c.unread_count}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Chat or Compose View */}
      <div className={`${selectedEmail || view === "compose" ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {view === "compose" ? (
          /* Compose View */
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <button onClick={() => setView("inbox")} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
                <ArrowLeft size={18} />
              </button>
              <h3 className="font-semibold">New Message</h3>
            </div>

            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <Search size={14} className="text-white/30" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {selectedRecipient ? (
                <div className="flex items-center gap-3 p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl mb-4">
                  <Avatar name={selectedRecipient.name} email={selectedRecipient.email} size={8} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{selectedRecipient.name}</p>
                    <p className="text-xs text-white/40">{selectedRecipient.email}</p>
                  </div>
                  <button onClick={() => setSelectedRecipient(null)} className="text-xs text-white/30 hover:text-white transition-colors">✕</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(u => (
                    <button
                      key={u.email}
                      onClick={() => setSelectedRecipient(u)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/3 hover:bg-white/8 transition-colors text-left"
                    >
                      <Avatar name={u.name} email={u.email} size={9} />
                      <div>
                        <p className="font-semibold text-sm">{u.name}</p>
                        <p className="text-xs text-white/40">{u.email} · {u.role}</p>
                      </div>
                    </button>
                  ))}
                  {searchResults.length === 0 && searchQuery && (
                    <p className="text-center text-white/20 text-sm mt-8">No users found matching "{searchQuery}"</p>
                  )}
                  {!searchQuery && (
                    <p className="text-center text-white/20 text-sm mt-8">Search for someone to message</p>
                  )}
                </div>
              )}
            </div>

            {selectedRecipient && (
              <div className="p-4 border-t border-white/5">
                <div className="flex gap-2 items-end">
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${selectedRecipient.name}...`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-sky-500/50 transition-colors"
                    autoFocus
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !draft.trim()}
                    className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center disabled:opacity-40 transition-colors shrink-0"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : selectedEmail ? (
          /* Chat Thread */
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-[#0c0d12]">
              <button
                onClick={() => setSelectedEmail(null)}
                className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-white/50 mr-1"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="relative">
                <Avatar name={selectedName} email={selectedEmail} size={10} />
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0c0d12]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">{selectedName}</h3>
                <p className="text-[11px] text-emerald-400">Active now</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1 custom-scrollbar">
              {groupedMessages.map(({ date, msgs }) => (
                <div key={date}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] text-white/25 shrink-0">{date}</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  {msgs.map((m, i) => {
                    const isMe = m.sender_email === currentUserEmail;
                    const showAvatar = !isMe && (i === 0 || msgs[i - 1]?.sender_email !== m.sender_email);
                    const isLast = i === msgs.length - 1 || msgs[i + 1]?.sender_email !== m.sender_email;
                    return (
                      <div key={m.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"} ${isLast ? "mb-2" : "mb-0.5"}`}>
                        {!isMe && (
                          <div className="w-7 shrink-0">
                            {showAvatar && <Avatar name={selectedName} email={selectedEmail} size={7} />}
                          </div>
                        )}
                        <div className={`max-w-[72%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                            isMe
                              ? `bg-sky-500 text-white ${isLast ? "rounded-2xl rounded-br-md" : "rounded-2xl"}`
                              : `bg-white/10 text-white/90 ${isLast ? "rounded-2xl rounded-bl-md" : "rounded-2xl"}`
                          }`}>
                            {m.content}
                          </div>
                          {isLast && (
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? "flex-row" : "flex-row-reverse"}`}>
                              <span className="text-[10px] text-white/25">{timeLabel(m.sent_at)}</span>
                              {isMe && (
                                <span className="text-[10px] text-sky-400">
                                  {m.read ? <CheckCheck size={12} /> : <Check size={12} className="text-white/30" />}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-end gap-2 justify-start mb-2">
                  <div className="w-7 shrink-0">
                    <Avatar name={selectedName} email={selectedEmail} size={7} />
                  </div>
                  <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1 items-center">
                    {[0, 0.2, 0.4].map(delay => (
                      <div key={delay} className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: `${delay}s` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-white/5 bg-[#0c0d12]">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-sky-500/40 transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${selectedName || "..."}...`}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/25"
                  />
                  <button className="text-white/20 hover:text-white/50 transition-colors">
                    <Smile size={18} />
                  </button>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    draft.trim()
                      ? "bg-sky-500 hover:bg-sky-400 text-white scale-100"
                      : "bg-white/5 text-white/20 scale-95"
                  }`}
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center text-white/20">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <MessageSquare size={40} className="opacity-40" />
            </div>
            <p className="text-lg font-semibold text-white/40">Your Messages</p>
            <p className="text-sm mt-2">Select a conversation or start a new one</p>
            <button
              onClick={() => { setView("compose"); setSelectedRecipient(null); }}
              className="mt-6 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> New Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
