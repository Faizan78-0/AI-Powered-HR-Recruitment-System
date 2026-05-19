"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  CalendarCheck,
  BookmarkCheck,
  TrendingUp,
  ChevronRight,
  Clock,
  ArrowUpRight,
  Bell,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { JobSeekerDashboard as DashboardData } from "@/types/index";
import LoadingSpinner from "@/components/UI/LoadingSpinner";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  APPLIED: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400",
    label: "Applied",
  },
  SCREENING: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    label: "Screening",
  },
  INTERVIEW: {
    bg: "bg-violet-50 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
    label: "Interview",
  },
  ASSESSMENT: {
    bg: "bg-orange-50 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
    label: "Assessment",
  },
  OFFER: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    label: "Offer",
  },
  HIRED: {
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    label: "Hired",
  },
  REJECTED: {
    bg: "bg-red-50 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    label: "Rejected",
  },
  WITHDRAWN: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-400",
    label: "Withdrawn",
  },
};

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
    </div>
  );
}

export default function JobSeekerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FIX: was calling /api/jobseeker/dashboard with no seekerId → 400/401.
  // The API now reads seekerId from the session server-side, no param needed.
  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobseeker/dashboard");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const result: DashboardData = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
          <LoadingSpinner />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-9 w-56 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse mb-2" />
            <div className="h-4 w-80 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-lg mb-1">
            Failed to load dashboard
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            {error ?? "Unknown error"}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Applied Jobs",
      value: data.stats.appliedJobs,
      icon: Briefcase,
      color: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50 dark:bg-blue-900/20",
      path: "/jobseeker/jobs",
      change: "View applications",
    },
    {
      label: "Interviews",
      value: data.stats.interviews,
      icon: CalendarCheck,
      color: "from-violet-500 to-violet-600",
      lightBg: "bg-violet-50 dark:bg-violet-900/20",
      path: "/jobseeker/interviews",
      change: "Upcoming",
    },
    {
      label: "Saved Jobs",
      value: data.stats.savedJobs,
      icon: BookmarkCheck,
      color: "from-amber-500 to-orange-500",
      lightBg: "bg-amber-50 dark:bg-amber-900/20",
      path: "/jobseeker/jobs?tab=saved",
      change: "Total saved",
    },
    {
      label: "Open Roles",
      value: data.stats.openPositions,
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-500",
      lightBg: "bg-emerald-50 dark:bg-emerald-900/20",
      path: "/jobseeker/jobs",
      change: "Browse all",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Your Job Search
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Track your applications and upcoming interviews.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <Link
            href="/jobseeker/jobs"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 text-sm"
          >
            <Briefcase size={16} /> Browse Jobs
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link key={i} href={card.path} className="block group">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${card.lightBg} flex items-center justify-center`}
                  >
                    <div
                      className={`bg-linear-to-br ${card.color} w-8 h-8 rounded-lg flex items-center justify-center`}
                    >
                      <Icon size={16} className="text-white" />
                    </div>
                  </div>
                  <ArrowUpRight
                    size={18}
                    className="text-gray-300 dark:text-gray-700 group-hover:text-indigo-500 transition-colors"
                  />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {card.label}
                </p>
                <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                  {card.value}
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                  {card.change}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Recent Applications
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Your latest job activity
              </p>
            </div>
            <Link
              href="./jobs"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {/* FIX: added empty state — was silently showing nothing */}
          {data.recentApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <Briefcase
                size={36}
                className="text-gray-200 dark:text-gray-700 mb-3"
              />
              <p className="font-semibold text-gray-500 dark:text-gray-400 text-sm">
                No applications yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1 mb-4">
                Start applying to jobs to track your progress here
              </p>
              <Link
                href="/jobseeker/jobs"
                className="text-xs px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {data.recentApplications.map((app: any) => {
                const sc =
                  STATUS_CONFIG[app.status] ?? STATUS_CONFIG["APPLIED"];
                const job = app.jobId;
                const initials =
                  job?.company?.substring(0, 2).toUpperCase() ?? "JB";
                return (
                  <div
                    key={app._id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {job?.title ?? "Job Title"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {job?.company ?? "Company"}
                        {job?.location ? ` · ${job.location}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                        />
                        {/* FIX: show human-readable label instead of raw enum e.g. "APPLIED" */}
                        {sc.label}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {app.appliedAt
                          ? new Date(app.appliedAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Upcoming Interviews
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {data.upcomingInterviews.length} scheduled
              </p>
            </div>

            <div className="p-4 space-y-3">
              {data.upcomingInterviews.length > 0 ? (
                data.upcomingInterviews.map((iv) => (
                  <div
                    key={iv.id}
                    className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {/* FIX: show role as title, recruiter name as subtitle */}
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {iv.role}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          with {iv.candidate}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium shrink-0">
                        {iv.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarCheck size={11} /> {iv.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {iv.time}
                      </span>
                    </div>
                    {iv.meetingLink && (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                      >
                        <Bell size={11} /> Join Meeting
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <CalendarCheck
                    size={28}
                    className="mx-auto text-gray-200 dark:text-gray-700 mb-2"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-600">
                    No upcoming interviews
                  </p>
                </div>
              )}
            </div>

            {/* Profile Completion */}
            <div className="m-4 p-4 bg-linear-to-br from-indigo-600 to-violet-600 rounded-xl text-white">
              <p className="font-bold text-sm mb-1">Profile Strength</p>
              <p className="text-xs text-indigo-100 mb-3">
                Complete your profile to stand out to recruiters
              </p>
              <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${data.profileCompletion}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-indigo-200">
                  {data.profileCompletion}% complete
                </p>
                {data.profileCompletion < 100 && (
                  <Link
                    href="/jobseeker/setting"
                    className="text-xs font-semibold text-white underline underline-offset-2 hover:text-indigo-200 transition-colors"
                  >
                    Complete →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
