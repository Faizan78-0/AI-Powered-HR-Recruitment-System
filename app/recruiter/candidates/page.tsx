"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  X,
  Loader2,
  AlertCircle,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  User,
  Briefcase,
  FileText,
  Eye,
} from "lucide-react";
import LoadingSpinner from "@/components/UI/LoadingSpinner";
import { ApplicationStatus } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────


// Shape returned by /api/recruiter/candidates
interface Candidate {
  id: string;
  _id: string;
  applicationId: string;
  seekerId: string | null;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  jobId: string | null;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  rating: number;
  experience?: string | null;
  skills?: string[];
  notes?: string | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  appliedAt: string | null;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string }
> = {
  APPLIED: {
    label: "Applied",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  SCREENING: {
    label: "Screening",
    color: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-900/20",
  },
  REVIEWING: {
    label: "Reviewing",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  INTERVIEW_SCHEDULED: {
    label: "Interview Scheduled",
    color: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-50 dark:bg-violet-900/20",
  },
  OFFER: {
    label: "Offer",
    color: "text-indigo-700 dark:text-indigo-300",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  HIRED: {
    label: "Hired",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  ACCEPTED: {
    label: "Accepted",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    color: "text-gray-500",
    bg: "bg-gray-100 dark:bg-gray-800",
  },
  INTERVIEW: {
    label: "",
    color: "",
    bg: ""
  },
  ASSESSMENT: {
    label: "",
    color: "",
    bg: ""
  }
};

const FILTER_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "REVIEWING",
  "INTERVIEW_SCHEDULED",
  "ACCEPTED",
  "REJECTED",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruiterCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [jobFilter, setJobFilter] = useState<string>("ALL");
  const [jobs, setJobs] = useState<{ _id: string; title: string }[]>([]);

  const [selected, setSelected] = useState<Candidate | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Schedule interview modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleAppId, setScheduleAppId] = useState<string | null>(null);
  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: "",
    type: "VIDEO" as "VIDEO" | "PHONE" | "IN_PERSON",
    notes: "",
    meetingLink: "",
  });
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const LIMIT = 20;

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch candidates — the API now returns a `jobs` array in the response
  const fetchCandidates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (jobFilter !== "ALL") params.set("jobId", jobFilter);

      const res = await fetch(`/api/recruiter/candidates?${params}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();

      setCandidates(Array.isArray(json.data) ? json.data : []);
      setTotal(json.total ?? 0);
      // Jobs come from the same response — no separate fetch needed
      if (Array.isArray(json.jobs)) setJobs(json.jobs);
    } catch (err: any) {
      setError(err.message ?? "Failed to load candidates");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, jobFilter]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // ── Status update ────────────────────────────────────────────────────────
  const updateStatus = async (
    candidateId: string,
    status: ApplicationStatus
  ) => {
    setUpdatingId(candidateId);
    try {
      const res = await fetch(`/api/recruiter/candidates?id=${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setCandidates((prev) =>
        prev.map((c) => (c._id === candidateId ? { ...c, status } : c))
      );
      setSelected((prev) =>
        prev?._id === candidateId ? { ...prev, status } : prev
      );
    } catch {
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Schedule interview ───────────────────────────────────────────────────
  const handleSchedule = async () => {
    if (!scheduleAppId || !interviewForm.scheduledAt) {
      setScheduleError("Please select a date and time.");
      return;
    }
    setScheduling(true);
    setScheduleError(null);
    try {
      const res = await fetch("/api/recruiter/interview", {
        // ← plural, correct path
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: scheduleAppId,
          scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
          type: interviewForm.type,
          notes: interviewForm.notes || undefined,
          meetingLink: interviewForm.meetingLink || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule");

      // API sets application status → INTERVIEW_SCHEDULED; mirror locally
      if (selected) await updateStatus(selected._id, "INTERVIEW_SCHEDULED");

      setShowScheduleModal(false);
      setScheduleAppId(null);
      setInterviewForm({
        scheduledAt: "",
        type: "VIDEO",
        notes: "",
        meetingLink: "",
      });
    } catch (err: any) {
      setScheduleError(err.message);
    } finally {
      setScheduling(false);
    }
  };

  const openScheduleModal = (c: Candidate) => {
    // Use applicationId for the interview POST (API expects applicationId)
    setScheduleAppId(c.applicationId);
    setScheduleError(null);
    setInterviewForm({
      scheduledAt: "",
      type: "VIDEO",
      notes: "",
      meetingLink: "",
    });
    setShowScheduleModal(true);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6">
      {/* Left: list */}
      <div
        className={`flex flex-col ${
          selected ? "w-full lg:w-2/5" : "w-full"
        } transition-all`}
      >
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Candidates
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isLoading ? "Loading…" : `${total} total applicants`}
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search candidates…"
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black dark:text-white"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(["ALL", ...FILTER_STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === s
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-indigo-300"
                }`}
              >
                {s === "ALL"
                  ? "All"
                  : STATUS_CONFIG[s as ApplicationStatus].label}
              </button>
            ))}
          </div>

          {jobs.length > 0 && (
            <select
              value={jobFilter}
              onChange={(e) => {
                setJobFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-300"
            >
              <option value="ALL">All Positions</option>
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Candidate cards */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-16 text-red-400 gap-2">
              <AlertCircle size={28} />
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchCandidates}
                className="text-xs underline mt-1"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && candidates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <User
                size={36}
                className="mb-3 text-gray-300 dark:text-gray-700"
              />
              <p className="font-medium">No candidates yet</p>
            </div>
          )}

          {!isLoading &&
            candidates.map((c) => {
              const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.APPLIED;
              const isSelected = selected?._id === c._id;
              return (
                <div
                  key={c._id}
                  onClick={() => setSelected(isSelected ? null : c)}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                    isSelected
                      ? "border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-800"
                      : "border-gray-100 dark:border-gray-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {(c.name ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {c.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Briefcase size={11} /> {c.jobTitle}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {c.appliedAt
                            ? new Date(c.appliedAt).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {!isLoading && total > LIMIT && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {page} of {Math.ceil(total / LIMIT)}
              </span>
              <button
                disabled={page >= Math.ceil(total / LIMIT)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: detail panel */}
      {selected && (
        <div className="hidden lg:flex lg:flex-1 flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {(selected.name ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selected.name}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {selected.email}
                    </p>
                    <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-1">
                      <Briefcase size={13} /> {selected.jobTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_CONFIG[selected.status].color
                  } ${STATUS_CONFIG[selected.status].bg}`}
                >
                  {STATUS_CONFIG[selected.status].label}
                </span>
                <span className="text-sm text-gray-400">
                  Applied{" "}
                  {selected.appliedAt
                    ? new Date(selected.appliedAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {selected.skills && selected.skills.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.skills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selected.coverLetter ? (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-sm">
                    <FileText size={15} /> Cover Letter
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                    {selected.coverLetter}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No cover letter provided.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex gap-2 flex-wrap mb-3">
              {selected.status === "APPLIED" && (
                <button
                  onClick={() => updateStatus(selected._id, "REVIEWING")}
                  disabled={!!updatingId}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Eye size={14} /> Mark as Reviewing
                </button>
              )}
              {(selected.status === "APPLIED" ||
                selected.status === "REVIEWING") && (
                <button
                  onClick={() => openScheduleModal(selected)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-medium hover:bg-violet-100 transition-colors cursor-pointer"
                >
                  <Calendar size={14} /> Schedule Interview
                </button>
              )}
              {!["ACCEPTED", "HIRED", "REJECTED", "WITHDRAWN"].includes(
                selected.status
              ) && (
                <button
                  onClick={() => updateStatus(selected._id, "ACCEPTED")}
                  disabled={!!updatingId}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle size={14} /> Accept
                </button>
              )}
              {!["REJECTED", "WITHDRAWN"].includes(selected.status) && (
                <button
                  onClick={() => updateStatus(selected._id, "REJECTED")}
                  disabled={!!updatingId}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <XCircle size={14} /> Reject
                </button>
              )}
            </div>

            <button
              onClick={() => (window.location.href = "./chat")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              <MessageSquare size={16} /> Message {selected.name?.split(" ")[0]}
            </button>

            {updatingId === selected._id && (
              <div className="flex items-center justify-center mt-2 text-xs text-gray-400 gap-1">
                <Loader2 size={12} className="animate-spin" /> Updating…
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && scheduleAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Schedule Interview
              </h3>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleError(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {scheduleError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                  <AlertCircle size={16} /> {scheduleError}
                </div>
              )}

              {selected && (
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {(selected.name ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selected.name}
                    </p>
                    <p className="text-xs text-gray-500">{selected.jobTitle}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={interviewForm.scheduledAt}
                  onChange={(e) =>
                    setInterviewForm((f) => ({
                      ...f,
                      scheduledAt: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Interview Type
                </label>
                <select
                  value={interviewForm.type}
                  onChange={(e) =>
                    setInterviewForm((f) => ({
                      ...f,
                      type: e.target.value as any,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                >
                  <option value="VIDEO">Video Call</option>
                  <option value="PHONE">Phone Call</option>
                  <option value="IN_PERSON">In-Person</option>
                </select>
              </div>

              {interviewForm.type === "VIDEO" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/…"
                    value={interviewForm.meetingLink}
                    onChange={(e) =>
                      setInterviewForm((f) => ({
                        ...f,
                        meetingLink: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes for Candidate
                </label>
                <textarea
                  rows={3}
                  placeholder="Preparation instructions, address, etc."
                  value={interviewForm.notes}
                  onChange={(e) =>
                    setInterviewForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleError(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={scheduling}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold cursor-pointer"
              >
                {scheduling ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Calendar size={16} />
                )}
                {scheduling ? "Scheduling…" : "Confirm Interview"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
