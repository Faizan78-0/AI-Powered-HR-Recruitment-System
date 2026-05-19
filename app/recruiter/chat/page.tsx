"use client";
import React, { useState, useRef, useEffect } from "react";
import { Search, Send, Phone, Video, MoreVertical, Paperclip, Smile, CheckCheck, ArrowLeft } from "lucide-react";


interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  read: boolean;
}

interface Conversation {
  id: string;
  name: string;
  role: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

export default function RecruiterChatPage() {
  // State initialized as empty
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selected = convos.find(c => c.id === selectedId) || null;

  // Placeholder for fetching data from your API
  // /*
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/recruiter/chat');
        const data = await response.json();
        setConvos(data);
        if (data.length > 0) setSelectedId(data[0].id);
      } catch (error) {
        console.error("Failed to fetch conversations", error);
      }
    };
    fetchConversations();
  }, []);
  // */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedId) return;

    const msg: Message = { 
      id: Date.now().toString(), 
      text: input, 
      sender: "me", 
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), 
      read: false 
    };

    // Optimistic UI update
    setConvos(prev => prev.map(c => 
      c.id === selectedId 
        ? { ...c, messages: [...c.messages, msg], lastMessage: input, time: "Just now", unread: 0 } 
        : c
    ));
    setInput("");

    // Realistically, you would call your API here:
    await fetch(`/api/recruiter/chat`, { method: 'POST', body: JSON.stringify({ convoId: selectedId, text: input }) });
  };

  const selectConvo = (id: string) => {
    setSelectedId(id);
    setConvos(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
    setMobileView("chat");
  };

  const filtered = convos.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className={`${mobileView === "chat" ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-80 border-r border-gray-100 dark:border-gray-800 shrink-0`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Messages</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search conversations..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black dark:text-white" 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map(c => (
              <div key={c.id} onClick={() => selectConvo(c.id)}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-800/60 ${selectedId === c.id ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500" : "hover:bg-gray-50 dark:hover:bg-gray-800/40"}`}>
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {c.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  {c.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{c.name}</span>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{c.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">{c.role}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{c.lastMessage}</p>
                    {c.unread > 0 && <span className="ml-2 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold shrink-0">{c.unread}</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 text-sm mt-10">No conversations found</p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${mobileView === "list" ? "hidden" : "flex"} lg:flex flex-col flex-1 min-w-0`}>
        {selected ? (
          <>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <button onClick={() => setMobileView("list")} className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"><ArrowLeft size={18} /></button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                  {selected.name.split(" ").map(n => n[0]).join("")}
                </div>
                {selected.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{selected.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selected.online ? "Online" : "Offline"} · {selected.role}</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"><Phone size={18} /></button>
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"><Video size={18} /></button>
                <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"><MoreVertical size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selected.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] ${msg.sender === "me" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.sender === "me" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"}`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 text-xs text-gray-400 ${msg.sender === "me" ? "justify-end" : ""}`}>
                      <span>{msg.time}</span>
                      {msg.sender === "me" && <CheckCheck size={12} className={msg.read ? "text-blue-500" : "text-gray-300"} />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2">
                <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><Paperclip size={18} /></button>
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none" 
                />
                <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><Smile size={18} /></button>
                <button onClick={sendMessage} disabled={!input.trim()} className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer">
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
              <p className="text-sm mt-1">Choose a candidate to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}