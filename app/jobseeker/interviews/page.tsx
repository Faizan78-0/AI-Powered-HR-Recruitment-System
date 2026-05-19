"use client";
// app/(jobseeker)/jobseeker/interviews/page.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, Clock, Video, Phone, Users,
  CheckCircle, XCircle, Link2, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type InterviewType   =
  | "PHONE_SCREEN" | "VIDEO_CALL" | "TECHNICAL"
  | "HR_INTERVIEW" | "FINAL_INTERVIEW" | "PANEL";

export interface Interview {
  id:            string;
  company:       string;
  role:          string;
  recruiterName: string;
  date:          string;        // "YYYY-MM-DD"
  time:          string;        // "HH:mm"
  type:          InterviewType;
  status:        InterviewStatus;
  meetingLink?:  string | null;
  location?:     string | null;
  notes?:        string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  InterviewType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  PHONE_SCREEN:    { label: "Phone Screen",    icon: Phone, color: "text-slate-600 dark:text-slate-300",    bg: "bg-slate-100 dark:bg-slate-800" },
  VIDEO_CALL:      { label: "Video Call",      icon: Video, color: "text-blue-600 dark:text-blue-300",      bg: "bg-blue-50 dark:bg-blue-900/30" },
  TECHNICAL:       { label: "Technical",       icon: Users, color: "text-violet-600 dark:text-violet-300",  bg: "bg-violet-50 dark:bg-violet-900/30" },
  HR_INTERVIEW:    { label: "HR Interview",    icon: Users, color: "text-emerald-600 dark:text-emerald-300",bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  FINAL_INTERVIEW: { label: "Final Interview", icon: Users, color: "text-amber-600 dark:text-amber-300",    bg: "bg-amber-50 dark:bg-amber-900/30" },
  PANEL:           { label: "Panel",           icon: Users, color: "text-rose-600 dark:text-rose-300",      bg: "bg-rose-50 dark:bg-rose-900/30" },
};

const STATUS_CONFIG: Record<
  InterviewStatus,
  { label: string; color: string; bg: string; dot: string; icon: React.ElementType }
> = {
  SCHEDULED: { label: "Scheduled", color: "text-blue-700 dark:text-blue-300",      bg: "bg-blue-50 dark:bg-blue-900/30",      dot: "bg-blue-500",    icon: Clock        },
  COMPLETED: { label: "Completed", color: "text-emerald-700 dark:text-emerald-300",bg: "bg-emerald-50 dark:bg-emerald-900/30",dot: "bg-emerald-500", icon: CheckCircle  },
  CANCELLED: { label: "Cancelled", color: "text-red-700 dark:text-red-300",        bg: "bg-red-50 dark:bg-red-900/30",        dot: "bg-red-500",     icon: XCircle      },
  NO_SHOW:   { label: "No Show",   color: "text-orange-700 dark:text-orange-300",  bg: "bg-orange-50 dark:bg-orange-900/30",  dot: "bg-orange-500",  icon: XCircle      },
};

// ─── Date helpers (timezone-safe) ────────────────────────────────────────────

function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function getDaysUntil(dateStr: string): string | null {
  const target = parseLocalDate(dateStr);
  if (!target) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0)  return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

function formatDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatDateShort(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobSeekerInterviewsPage() {
  const [interviews,   setInterviews]   = useState<Interview[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchInterviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobseeker/interviews");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server error ${res.status}`);
      }
      const json = await res.json();
      setInterviews(Array.isArray(json.data) ? json.data : []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load interviews");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  const filtered =
    statusFilter === "ALL"
      ? interviews
      : interviews.filter((iv) => iv.status === statusFilter);

  const upcoming = filtered.filter((iv) => iv.status === "SCHEDULED");
  const past     = filtered.filter((iv) => iv.status !== "SCHEDULED");

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="flex items-center justify-center py-24">
          <Loader2 size={30} className="animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchInterviews}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader />
        <button
          onClick={fetchInterviews}
          title="Refresh"
          className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Upcoming",  value: interviews.filter((i) => i.status === "SCHEDULED").length, color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Completed", value: interviews.filter((i) => i.status === "COMPLETED").length, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Cancelled", value: interviews.filter((i) => i.status === "CANCELLED").length, color: "text-red-600",     bg: "bg-red-50 dark:bg-red-900/20" },
          { label: "Total",     value: interviews.length,                                          color: "text-indigo-600",  bg: "bg-indigo-50 dark:bg-indigo-900/20" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "SCHEDULED", "COMPLETED", "CANCELLED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              statusFilter === s
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-indigo-300"
            }`}
          >
            {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Upcoming interviews */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-4">
            {upcoming.map((iv) => {
              const tc        = TYPE_CONFIG[iv.type]    ?? TYPE_CONFIG.VIDEO_CALL;
              const sc        = STATUS_CONFIG[iv.status] ?? STATUS_CONFIG.SCHEDULED;
              const Icon      = tc.icon;
              const daysUntil = getDaysUntil(iv.date);

              return (
                <div
                  key={iv.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                  {daysUntil === "Today" && (
                    <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                  )}
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${tc.bg} flex items-center justify-center shrink-0`}>
                        <Icon size={22} className={tc.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Company + status + days-until badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 dark:text-white text-lg">
                            {iv.company}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                          {daysUntil && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                              {daysUntil}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 font-medium">{iv.role}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {tc.label} · with {iv.recruiterName || "Recruiter"}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} /> {formatDate(iv.date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} /> {iv.time}
                          </span>
                        </div>

                        {iv.notes && (
                          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl text-sm text-amber-800 dark:text-amber-300">
                            📝 {iv.notes}
                          </div>
                        )}

                        {iv.meetingLink && (
                          <a
                            href={iv.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all"
                          >
                            <Link2 size={14} /> Join Meeting
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Past interviews */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 mt-6">
            Past Interviews ({past.length})
          </h2>
          <div className="space-y-3">
            {past.map((iv) => {
              const tc   = TYPE_CONFIG[iv.type]    ?? TYPE_CONFIG.VIDEO_CALL;
              const sc   = STATUS_CONFIG[iv.status] ?? STATUS_CONFIG.COMPLETED;
              const Icon = tc.icon;
              return (
                <div
                  key={iv.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${tc.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={18} className={tc.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white">{iv.company}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {iv.role} · {tc.label}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateShort(iv.date)}</p>
                      <p className="text-xs text-gray-400">{iv.time}</p>
                    </div>
                  </div>
                  {iv.notes && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic border-t border-gray-50 dark:border-gray-800 pt-2">
                      Note: {iv.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          <Calendar size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {statusFilter === "ALL"
              ? "No interviews yet"
              : `No ${statusFilter.toLowerCase()} interviews`}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
            {statusFilter === "ALL"
              ? "Apply to jobs and interviews will appear here when scheduled by recruiters"
              : "Try selecting a different filter"}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        My Interviews
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">
        View and prepare for your upcoming interviews
      </p>
    </div>
  );
}