"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, X, Check, CheckCheck, Trash2,
  Briefcase, UserCheck, Calendar, MessageSquare,
  AlertCircle, TrendingUp, FileText, Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType =
  | "APPLICATION_RECEIVED"
  | "APPLICATION_REVIEWED"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_UPDATED"
  | "INTERVIEW_REMINDER"
  | "MESSAGE_RECEIVED"
  | "JOB_POSTED"
  | "APPLICATION_WITHDRAWN"
  | "OFFER_EXTENDED";

interface Notification {
  id:          string;
  type:        NotificationType;
  title:       string;
  message:     string;
  isRead:      boolean;
  link?:       string;
  meta?:       { applicationId?: string; interviewId?: string; jobId?: string; chatId?: string };
  createdAt:   string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; bg: string; dot: string }> = {
  APPLICATION_RECEIVED:  { icon: FileText,      color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/30",    dot: "bg-blue-500" },
  APPLICATION_REVIEWED:  { icon: Clock,         color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/30",  dot: "bg-amber-500" },
  APPLICATION_ACCEPTED:  { icon: UserCheck,     color: "text-emerald-600 dark:text-emerald-400",bg:"bg-emerald-50 dark:bg-emerald-900/30",dot:"bg-emerald-500" },
  APPLICATION_REJECTED:  { icon: AlertCircle,   color: "text-red-500 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-900/30",      dot: "bg-red-500" },
  INTERVIEW_SCHEDULED:   { icon: Calendar,      color: "text-violet-600 dark:text-violet-400",bg: "bg-violet-50 dark:bg-violet-900/30",dot: "bg-violet-500" },
  INTERVIEW_UPDATED:     { icon: Calendar,      color: "text-orange-600 dark:text-orange-400",bg: "bg-orange-50 dark:bg-orange-900/30",dot: "bg-orange-500" },
  INTERVIEW_REMINDER:    { icon: Clock,         color: "text-indigo-600 dark:text-indigo-400",bg: "bg-indigo-50 dark:bg-indigo-900/30",dot: "bg-indigo-500" },
  MESSAGE_RECEIVED:      { icon: MessageSquare, color: "text-sky-600 dark:text-sky-400",      bg: "bg-sky-50 dark:bg-sky-900/30",      dot: "bg-sky-500" },
  JOB_POSTED:            { icon: Briefcase,     color: "text-teal-600 dark:text-teal-400",    bg: "bg-teal-50 dark:bg-teal-900/30",    dot: "bg-teal-500" },
  APPLICATION_WITHDRAWN: { icon: TrendingUp,    color: "text-gray-500 dark:text-gray-400",    bg: "bg-gray-100 dark:bg-gray-800",      dot: "bg-gray-400" },
  OFFER_EXTENDED:        { icon: CheckCheck,    color: "text-emerald-600 dark:text-emerald-400",bg:"bg-emerald-50 dark:bg-emerald-900/30",dot:"bg-emerald-500" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationBell() {
  const router = useRouter();
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [isLoading,     setIsLoading]     = useState(false);
  const [filter,        setFilter]        = useState<"ALL" | "UNREAD">("ALL");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef     = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch notifications ──────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (filter === "UNREAD") params.set("unreadOnly", "true");

      const res = await fetch(`/api/notification?${params}`);
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.data ?? []);
      setUnreadCount(json.unreadCount ?? 0);
    } catch {
      // silent fail — notifications are non-critical
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  // Initial load + filter change
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Poll every 30s for new notifications
  useEffect(() => {
    pollRef.current = setInterval(() => fetchNotifications(true), 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const markRead = async (ids?: string[]) => {
    try {
      await fetch("/api/notification", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(ids ? { ids } : {}),
      });
      setNotifications((prev) =>
        ids
          ? prev.map((n) => ids.includes(n.id) ? { ...n, isRead: true } : n)
          : prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(ids ? Math.max(0, unreadCount - ids.filter(id => notifications.find(n => n.id === id && !n.isRead)).length) : 0);
    } catch {}
  };

  const markAllRead = () => markRead();

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notification?id=${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const wasUnread = notifications.find((n) => n.id === id && !n.isRead);
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const clearAll = async () => {
    try {
      await fetch("/api/notifications", { method: "DELETE" });
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  const handleClick = (notif: Notification) => {
    if (!notif.isRead) markRead([notif.id]);
    setOpen(false);
    if (notif.link) router.push(notif.link);
  };

  const displayed = filter === "UNREAD"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative" ref={dropdownRef}>

      {/* ── Bell Button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
        aria-label="Notifications"
      >
        <Bell
          size={20}
          className={`transition-all ${open ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"}`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full leading-none animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[32rem] flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl shadow-black/10 dark:shadow-black/40 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-medium"
                  title="Mark all read"
                >
                  <CheckCheck size={14} /> All read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 px-4 py-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
            {(["ALL", "UNREAD"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {f === "ALL" ? "All" : `Unread ${unreadCount > 0 ? `(${unreadCount})` : ""}`}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!isLoading && displayed.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <Bell size={20} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-medium">
                  {filter === "UNREAD" ? "All caught up!" : "No notifications yet"}
                </p>
                <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
                  {filter === "UNREAD" ? "You have no unread notifications" : "Activity will appear here"}
                </p>
              </div>
            )}

            {!isLoading && displayed.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG["APPLICATION_RECEIVED"];
              const Icon = cfg.icon;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-all border-b border-gray-50 dark:border-gray-800/50 last:border-0 ${
                    !notif.isRead
                      ? "bg-indigo-50/40 dark:bg-indigo-900/10 hover:bg-indigo-50/70 dark:hover:bg-indigo-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {/* Unread dot */}
                  {!notif.isRead && (
                    <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                  )}

                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={16} className={cfg.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={`text-sm leading-snug ${!notif.isRead ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 font-medium">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => deleteNotification(notif.id, e)}
                    className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all cursor-pointer"
                    title="Dismiss"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {displayed.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <button
                onClick={() => { setOpen(false); router.push("/notifications"); }}
                className="w-full text-center text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}