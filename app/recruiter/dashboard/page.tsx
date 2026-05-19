"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase, Users, CalendarCheck, TrendingUp,
  ChevronRight, Clock, Star, ArrowUpRight,
  FileText, MessageSquare, Video, Phone, Building2, Loader2,
} from "lucide-react";
import { useUser } from "@/context/userContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatData {
  activeJobs: number;
  newCandidates: number;
  interviews: number;
  hireRate: string;
  totalApplications: number;
}

interface DashApplication {
  id: string;
  candidateName: string;
  email: string;
  avatar: string | null;
  jobRole: string;
  company: string;
  status: string;
  appliedAt: string;
  score: number;
  coverLetter: string | null;
}

interface DashInterview {
  id: string;
  candidate: string;
  email: string;
  role: string;
  date: string;
  time: string;
  type: "VIDEO" | "PHONE" | "IN_PERSON";
  meetingLink: string | null;
  notes: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

// Keys match the exact status strings returned by the API (SCREAMING_SNAKE_CASE)
const STATUS_CFG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  APPLIED:             { bg: "bg-slate-100 dark:bg-slate-800",   text: "text-slate-600 dark:text-slate-300",   dot: "bg-slate-400",   label: "Applied" },
  SCREENING:           { bg: "bg-blue-50 dark:bg-blue-900/30",   text: "text-blue-700 dark:text-blue-300",     dot: "bg-blue-500",    label: "Screening" },
  REVIEWING:           { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300",   dot: "bg-amber-500",   label: "Reviewing" },
  INTERVIEW_SCHEDULED: { bg: "bg-violet-50 dark:bg-violet-900/30",text:"text-violet-700 dark:text-violet-300", dot: "bg-violet-500",  label: "Interview" },
  OFFER:               { bg: "bg-sky-50 dark:bg-sky-900/30",     text: "text-sky-700 dark:text-sky-300",       dot: "bg-sky-500",     label: "Offer" },
  ACCEPTED:            { bg: "bg-emerald-50 dark:bg-emerald-900/30",text:"text-emerald-700 dark:text-emerald-300",dot:"bg-emerald-500",label: "Accepted" },
  HIRED:               { bg: "bg-emerald-50 dark:bg-emerald-900/30",text:"text-emerald-700 dark:text-emerald-300",dot:"bg-emerald-500",label: "Hired" },
  REJECTED:            { bg: "bg-red-50 dark:bg-red-900/30",     text: "text-red-700 dark:text-red-300",       dot: "bg-red-500",     label: "Rejected" },
  WITHDRAWN:           { bg: "bg-gray-100 dark:bg-gray-800",     text: "text-gray-500 dark:text-gray-400",     dot: "bg-gray-400",    label: "Withdrawn" },
};
const STATUS_FALLBACK = { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500", dot: "bg-gray-400", label: "—" };

// Interview type → icon component
const IV_ICON: Record<string, React.ElementType> = {
  VIDEO:     Video,
  PHONE:     Phone,
  IN_PERSON: Building2,
};

// ─── Greeting hook ────────────────────────────────────────────────────────────

function useGreeting(): string {
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
    };
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, []);
  return greeting;
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function RecruiterDashboard() {
  const greeting = useGreeting();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [stats, setStats] = useState<StatData>({
    activeJobs: 0, newCandidates: 0, interviews: 0,
    hireRate: "0%", totalApplications: 0,
  });
  // FIX: renamed to dashApps / dashIvs — avoids collision with any local
  // type name or import named "Application" / "Interview".
  const [dashApps, setDashApps] = useState<DashApplication[]>([]);
  const [dashIvs,  setDashIvs]  = useState<DashInterview[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setFetchError(false);
        const res = await fetch("/api/recruiter/dashboard");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        setStats({
          activeJobs:        data.stats?.activeJobs        ?? 0,
          newCandidates:     data.stats?.newCandidates     ?? 0,
          interviews:        data.stats?.interviews        ?? 0,
          hireRate:          data.stats?.hireRate          ?? "0%",
          totalApplications: data.stats?.totalApplications ?? 0,
        });
        // FIX: guard arrays — API may return null if recruiter has no data yet
        setDashApps(Array.isArray(data.recentApplications) ? data.recentApplications : []);
        setDashIvs( Array.isArray(data.upcomingInterviews) ? data.upcomingInterviews  : []);
      } catch (err) {
        console.error("[Dashboard] fetch error:", err);
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const statCards = useMemo(() => [
    { label: "Active jobs",           value: stats.activeJobs,    icon: Briefcase,    iconBg: "bg-blue-50 dark:bg-blue-900/20",    iconColor: "text-blue-600 dark:text-blue-400",    href: "./jobs" },
    { label: "New candidates",        value: stats.newCandidates, icon: Users,        iconBg: "bg-violet-50 dark:bg-violet-900/20", iconColor: "text-violet-600 dark:text-violet-400", href: "./candidates" },
    { label: "Interviews scheduled",  value: stats.interviews,    icon: CalendarCheck,iconBg: "bg-amber-50 dark:bg-amber-900/20",   iconColor: "text-amber-600 dark:text-amber-400",   href: "./interviews" },
    { label: "Hire rate",             value: stats.hireRate,      icon: TrendingUp,   iconBg: "bg-emerald-50 dark:bg-emerald-900/20",iconColor:"text-emerald-600 dark:text-emerald-400",href: "#" },
  ], [stats]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {greeting}{user?.Name ? `, ${user.Name}` : ""}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Here's what's happening with your hiring pipeline today.
          </p>
        </div>
        <Link href="/recruiter/jobs"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 active:scale-95">
          <Briefcase size={16} /> Post a job
        </Link>
      </div>

      {/* Error banner */}
      {fetchError && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          Failed to load dashboard data — please refresh the page.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="block group">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm group-hover:shadow-lg group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <card.icon size={20} className={card.iconColor} />
                </div>
                <ArrowUpRight size={16} className="text-gray-300 dark:text-gray-700 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{card.label}</p>
              {/* FIX: show spinner while loading instead of misleading "0" */}
              {isLoading ? (
                <div className="mt-2 flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin text-gray-300" />
                  <span className="text-sm text-gray-300">Loading…</span>
                </div>
              ) : (
                <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white tabular-nums">{card.value}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent applications */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent applications</h2>
            <Link href="/recruiter/candidates"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-semibold flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3 w-[32%]">Candidate</th>
                  <th className="px-5 py-3 w-[24%]">Role</th>
                  <th className="px-5 py-3 w-[14%]">Score</th>
                  <th className="px-5 py-3 w-[18%]">Status</th>
                  <th className="px-5 py-3 w-[12%] text-right">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-5 py-14 text-center">
                    <Loader2 size={22} className="animate-spin text-gray-300 mx-auto" />
                  </td></tr>
                ) : dashApps.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-14 text-center text-gray-400 text-sm">
                    No recent applications.
                  </td></tr>
                ) : (
                  dashApps.map((app) => {
                    const sc = STATUS_CFG[app.status] ?? STATUS_FALLBACK;
                    const initials = (app.candidateName || "?")
                      .split(" ").map((n: string) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
                    return (
                      <tr key={app.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {initials}
                            </div>
                            <span className="font-semibold text-sm text-gray-900 dark:text-white truncate max-w-25">
                              {app.candidateName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 truncate max-w-30">
                          {app.jobRole || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${app.score ?? 0}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{app.score ?? 0}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-400 text-right">
                          {app.appliedAt
                            ? new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Upcoming interviews</h2>
              <Link href="/recruiter/interviews"
                className="text-xs font-semibold text-indigo-500 uppercase tracking-widest hover:underline">
                Manage
              </Link>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {isLoading ? (
                <div className="py-10 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-gray-300" />
                </div>
              ) : dashIvs.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-gray-400">No interviews scheduled.</p>
              ) : (
                dashIvs.map((iv) => {
                  // FIX: safe fallback for unrecognised type values
                  const IvIcon: React.ElementType = IV_ICON[iv.type] ?? CalendarCheck;
                  return (
                    <div key={iv.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/40">
                        <IvIcon size={16} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{iv.candidate}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{iv.role}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Clock size={11} />
                          <span>{iv.time}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">{iv.date}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold uppercase tracking-tight shrink-0 mt-0.5">
                        {(iv.type ?? "").replace("_", " ")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick actions */}
            <div className="px-4 py-4 border-t border-gray-50 dark:border-gray-800 space-y-1">
              <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Quick actions</p>
              {[
                { label: "Analyze resume", icon: FileText,      href: "./analyze-resume" },
                { label: "Review talent",  icon: Star,          href: "./candidates" },
                { label: "Open messages",  icon: MessageSquare, href: "./chat" },
              ].map((action) => (
                <Link key={action.label} href={action.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-indigo-600 hover:text-white text-gray-700 dark:text-gray-300 transition-all group">
                  <action.icon size={15} className="group-hover:text-white text-indigo-500 transition-colors shrink-0" />
                  <span className="text-sm font-semibold">{action.label}</span>
                  <ChevronRight size={13} className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}