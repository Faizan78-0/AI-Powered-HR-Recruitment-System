"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  CheckCheck,
  ArrowLeft,
} from "lucide-react";

export interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  recruiterName: string;
  company: string;
  role: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

interface JobSeekerChatPageProps {
  initialConversations?: Conversation[];
}

export default function JobSeekerChatPage({
  initialConversations = [],
}: JobSeekerChatPageProps) {
  const [convos, setConvos] = useState<Conversation[]>(initialConversations);
  // Defaulting to null instead of a hardcoded ID since the array starts empty
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].id : null
  );
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selected = convos.find((c) => c.id === selectedId) || null;

  // Sync selectedId if initialConversations dynamically populates later
  useEffect(() => {
    if (!selectedId && convos.length > 0) {
      setSelectedId(convos[0].id);
    }
  }, [convos, selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);

  const sendMessage = () => {
    if (!input.trim() || !selectedId) return;
    const msg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "me",
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: false,
    };
    setConvos((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              messages: [...c.messages, msg],
              lastMessage: input,
              time: "Just now",
            }
          : c
      )
    );
    setInput("");
  };

  const selectConvo = (id: string) => {
    setSelectedId(id);
    setConvos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
    setMobileView("chat");
  };

  const filtered = convos.filter(
    (c) =>
      c.recruiterName.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          mobileView === "chat" ? "hidden" : "flex"
        } lg:flex flex-col w-full lg:w-80 border-r border-gray-100 dark:border-gray-800 shrink-0`}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Messages
          </h2>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recruiters..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              No conversations found
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => selectConvo(c.id)}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-b-gray-50 dark:border-b-gray-800/60 ${
                  selectedId === c.id
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {c.recruiterName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  {c.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {c.recruiterName}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {c.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                    {c.company} · {c.role}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {c.lastMessage}
                    </p>
                    {c.unread > 0 && (
                      <span className="ml-2 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`${
          mobileView === "list" ? "hidden" : "flex"
        } lg:flex flex-col flex-1 min-w-0`}
      >
        {selected ? (
          <>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setMobileView("list")}
                className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  {selected.recruiterName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                {selected.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  {selected.recruiterName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selected.company} · Recruiter
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer text-gray-500 dark:text-gray-400">
                  <Phone size={18} />
                </button>
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer text-gray-500 dark:text-gray-400">
                  <Video size={18} />
                </button>
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer text-gray-500 dark:text-gray-400">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selected.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "me" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] flex flex-col gap-1 ${
                      msg.sender === "me" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "me"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs text-gray-400 ${
                        msg.sender === "me" ? "justify-end" : ""
                      }`}
                    >
                      <span>{msg.time}</span>
                      {msg.sender === "me" && (
                        <CheckCheck
                          size={12}
                          className={
                            msg.read ? "text-blue-500" : "text-gray-300"
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

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
                  disabled={!input.trim()}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer"
                >
                  <Send size={16} />
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
              <p className="text-sm mt-1">
                Your recruiter messages appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
