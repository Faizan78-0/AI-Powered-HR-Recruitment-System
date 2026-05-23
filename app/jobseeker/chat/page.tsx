"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, Send, ArrowLeft, Loader2,
  CheckCheck, Paperclip, Smile, Phone, Video, MoreVertical,
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  senderId: string;
  sender: string;
  senderRole: string;
  time: string;
  read: boolean;
  createdAt: string;
  conversationId: string;
}

interface Conversation {
  id: string;
  name: string;
  role: string;
  company: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

export default function JobSeekerChatPage() {
  const [convos, setConvos]           = useState<Conversation[]>([]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [input, setInput]             = useState("");
  const [sending, setSending]         = useState(false);
  const [search, setSearch]           = useState("");
  const [mobileView, setMobileView]   = useState<"list" | "chat">("list");
  const messagesEndRef                = useRef<HTMLDivElement>(null);

  const selected = convos.find((c) => c.id === selectedId) ?? null;

  // ── Load conversation list ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoadingList(true);
        const res  = await fetch("/api/jobseeker/chats");
        const data = await res.json();
        if (Array.isArray(data)) setConvos(data);
      } catch (e) {
        console.error("Failed to load conversations", e);
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  // ── Scroll to bottom ──────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages?.length]);

  // ── Select conversation ───────────────────────────────────────────────
  const selectConvo = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setMobileView("chat");
      setConvos((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));

      const alreadyLoaded = convos.find((c) => c.id === id && c.messages.length > 0);
      if (alreadyLoaded) return;

      setLoadingMsgs(true);
      try {
        const res  = await fetch(`/api/jobseeker/chats?conversationId=${id}`);
        const data = await res.json();
        setConvos((prev) =>
          prev.map((c) => (c.id === id ? { ...c, messages: data.messages ?? [] } : c))
        );
      } catch (e) {
        console.error("Failed to load messages", e);
      } finally {
        setLoadingMsgs(false);
      }
    },
    [convos]
  );

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !selectedId || sending) return;
    setSending(true);

    const text         = input.trim();
    const optimisticId = `tmp-${Date.now()}`;
    const optimistic: Message = {
      id:             optimisticId,
      text,
      senderId:       "me",
      sender:         "me",
      senderRole:     "JOB_SEEKER",
      time:           new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      read:           false,
      createdAt:      new Date().toISOString(),
      conversationId: selectedId,
    };

    setInput("");
    setConvos((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, messages: [...c.messages, optimistic], lastMessage: text, time: "Just now" }
          : c
      )
    );

    try {
      const res   = await fetch("/api/jobseeker/chats", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ conversationId: selectedId, text }),
      });
      const saved = await res.json();

      setConvos((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === optimisticId ? { ...saved, senderId: "me", sender: "me" } : m
                ),
              }
            : c
        )
      );
    } catch (e) {
      console.error("Send failed", e);
      setConvos((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, messages: c.messages.filter((m) => m.id !== optimisticId) }
            : c
        )
      );
    } finally {
      setSending(false);
    }
  };

  const filtered = convos.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* ── Sidebar ── */}
      <div
        className={`${
          mobileView === "chat" ? "hidden" : "flex"
        } lg:flex flex-col w-full lg:w-80 border-r border-gray-100 dark:border-gray-800 shrink-0`}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Messages</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-gray-400" />
            </div>
          )}

          {!loadingList && filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 mt-10 px-6">
              {convos.length === 0
                ? "No messages yet. Your conversations will appear here once a recruiter accepts your application."
                : "No matches found."}
            </p>
          )}

          {!loadingList &&
            filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => selectConvo(c.id)}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-800/60 ${
                  selectedId === c.id
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  {c.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {c.name}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{c.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                    {c.role}{c.company ? ` · ${c.company}` : ""}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {c.lastMessage || "Conversation started"}
                    </p>
                    {c.unread > 0 && (
                      <span className="ml-2 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div
        className={`${
          mobileView === "list" ? "hidden" : "flex"
        } lg:flex flex-col flex-1 min-w-0`}
      >
        {selected ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setMobileView("list")}
                className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {selected.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{selected.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selected.role}{selected.company ? ` · ${selected.company}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 cursor-pointer">
                  <Phone size={18} />
                </button>
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 cursor-pointer">
                  <Video size={18} />
                </button>
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 cursor-pointer">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMsgs && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={22} className="animate-spin text-gray-400" />
                </div>
              )}

              {!loadingMsgs && selected.messages.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-8">
                  Start the conversation with {selected.name.split(" ")[0]}!
                </p>
              )}

              {!loadingMsgs &&
                selected.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] flex flex-col gap-1 ${
                        msg.senderId === "me" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.senderId === "me"
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div
                        className={`flex items-center gap-1 text-xs text-gray-400 ${
                          msg.senderId === "me" ? "justify-end" : ""
                        }`}
                      >
                        <span>{msg.time}</span>
                        {msg.senderId === "me" && (
                          <CheckCheck
                            size={12}
                            className={msg.read ? "text-blue-500" : "text-gray-300"}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2">
                <button className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <Paperclip size={18} />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none"
                />
                <button className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <Smile size={18} />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer"
                >
                  {sending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={16} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send size={24} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose a recruiter to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}