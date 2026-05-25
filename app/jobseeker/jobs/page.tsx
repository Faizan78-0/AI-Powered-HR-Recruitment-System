"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Send,
  X,
  Loader2,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { JobType } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "REVIEWING"
  | "INTERVIEW_SCHEDULED"
  | "OFFER"
  | "HIRED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  salary: string | null;
  description: string;
  requiredSkills: string[];
  postedDate: string | null;
  remote: boolean;
  applicationStatus: ApplicationStatus | null;
  applicationId: string | null;
  isSaved: boolean; // NEW
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<JobType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
};

const STATUS_BADGE: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  APPLIED: {
    label: "✓ Applied",
    className: "text-indigo-600 dark:text-indigo-400",
  },
  SCREENING: {
    label: "🔍 Screening",
    className: "text-blue-600 dark:text-blue-400",
  },
  REVIEWING: {
    label: "👁 In Review",
    className: "text-amber-600 dark:text-amber-400",
  },
  INTERVIEW_SCHEDULED: {
    label: "📅 Interview Scheduled",
    className: "text-violet-600 dark:text-violet-400",
  },
  OFFER: {
    label: "🎁 Offer Received",
    className: "text-sky-600 dark:text-sky-400",
  },
  HIRED: {
    label: "🎉 Hired",
    className: "text-emerald-600 dark:text-emerald-400",
  },
  ACCEPTED: {
    label: "🎉 Accepted",
    className: "text-emerald-600 dark:text-emerald-400",
  },
  REJECTED: {
    label: "✗ Not Selected",
    className: "text-red-500 dark:text-red-400",
  },
  WITHDRAWN: { label: "Withdrawn", className: "text-gray-400" },
};

const ACTIVE_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "REVIEWING",
  "INTERVIEW_SCHEDULED",
  "OFFER",
];

const LOGO_PALETTE = [
  "from-blue-400 to-blue-600",
  "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600",
  "from-pink-400 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
  "from-indigo-400 to-indigo-600",
];

function logoGradient(company: string): string {
  let hash = 0;
  for (let i = 0; i < company.length; i++)
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  return LOGO_PALETTE[Math.abs(hash) % LOGO_PALETTE.length];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobSeekerJobsPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [remoteFilter, setRemoteFilter] = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);

  // Apply form fields
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [experience, setExperience] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Tracks which jobs are currently being saved (to show spinner on button)
  const [savingJobIds, setSavingJobIds] = useState<Set<string>>(new Set());

  const LIMIT = 20;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Fetch jobs ──────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (remoteFilter) params.set("remote", "true");

      const res = await fetch(`/api/jobseeker/jobs?${params}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();

      setJobs(Array.isArray(json.data) ? json.data : []);
      setTotal(json.total ?? 0);

      if (json.data?.length > 0 && !selectedJob) {
        setSelectedJob(json.data[0]);
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, remoteFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ── Save / Unsave ───────────────────────────────────────────────────────────
  const handleToggleSave = async (job: Job, e: React.MouseEvent) => {
    e.stopPropagation(); // don't open the detail panel
    if (savingJobIds.has(job.id)) return;

    setSavingJobIds((prev) => new Set(prev).add(job.id));

    // Optimistic update
    const patch = (j: Job): Job =>
      j.id === job.id ? { ...j, isSaved: !j.isSaved } : j;
    setJobs((prev) => prev.map(patch));
    setSelectedJob((prev) => (prev ? patch(prev) : prev));

    try {
      const res = await fetch("/api/jobseeker/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", jobId: job.id }),
      });
      if (!res.ok) {
        // Revert on failure
        setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
        setSelectedJob((prev) => (prev?.id === job.id ? job : prev));
      }
    } catch {
      // Revert on network error
      setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
      setSelectedJob((prev) => (prev?.id === job.id ? job : prev));
    } finally {
      setSavingJobIds((prev) => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  };

  // ── Apply ───────────────────────────────────────────────────────────────────
  const openApplyModal = (job: Job) => {
    setApplyingJob(job);
    setCoverLetter("");
    setResumeUrl("");
    setExperience("");
    setSkillInput("");
    setSkills([]);
    setApplyError(null);
    setShowApplyModal(true);
  };

  const closeApplyModal = () => {
    setShowApplyModal(false);
    setApplyingJob(null);
    setApplyError(null);
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput("");
  };

  const removeSkill = (s: string) =>
    setSkills((prev) => prev.filter((x) => x !== s));

  const handleApply = async () => {
    if (!applyingJob) return;
    setApplying(true);
    setApplyError(null);
    try {
      const res = await fetch("/api/jobseeker/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply", // explicit action
          jobId: applyingJob.id,
          coverLetter: coverLetter.trim() || null,
          resumeUrl: resumeUrl.trim() || null,
          experience: experience.trim() || null,
          skills,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApplyError(data.error ?? "Failed to submit application.");
        return;
      }

      // BUG FIX: the old route returned `id: undefined` and `applicationId: undefined`.
      // The fixed route now returns `applicationId` correctly.
      const patch = (j: Job): Job =>
        j.id === applyingJob.id
          ? {
              ...j,
              applicationStatus: "APPLIED",
              applicationId: data.applicationId ?? null,
            }
          : j;
      setJobs((prev) => prev.map(patch));
      setSelectedJob((prev) => (prev ? patch(prev) : prev));
      closeApplyModal();
    } catch {
      setApplyError("Network error. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  // ── Withdraw ────────────────────────────────────────────────────────────────
  const handleWithdraw = async (job: Job) => {
    if (!job.applicationId) return;
    if (!confirm(`Withdraw your application for ${job.title}?`)) return;
    try {
      const res = await fetch(`/api/jobseeker/jobs?id=${job.applicationId}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error();
      const patch = (j: Job): Job =>
        j.id === job.id
          ? { ...j, applicationStatus: null, applicationId: null }
          : j;
      setJobs((prev) => prev.map(patch));
      setSelectedJob((prev) => (prev ? patch(prev) : prev));
    } catch {
      alert("Failed to withdraw application.");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6">

      {/* ── Left: Job List ── */}
      <div
        className={`flex flex-col ${
          selectedJob ? "w-full lg:w-2/5" : "w-full"
        } transition-all`}
      >
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Find Jobs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isLoading ? "Loading…" : `${total} opportunities`}
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, skills, companies…"
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black dark:text-white"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(
              [
                "ALL",
                "FULL_TIME",
                "PART_TIME",
                "CONTRACT",
                "FREELANCE",
              ] as const
            ).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTypeFilter(t);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  typeFilter === t
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-indigo-300"
                }`}
              >
                {t === "ALL" ? "All Types" : TYPE_LABEL[t]}
              </button>
            ))}
            <button
              onClick={() => {
                setRemoteFilter(!remoteFilter);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                remoteFilter
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-emerald-300"
              }`}
            >
              🌐 Remote Only
            </button>
          </div>
        </div>

        {/* Job cards */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-gray-400" />
            </div>
          )}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-16 text-red-400 gap-2">
              <AlertCircle size={28} />
              <p className="text-sm">{error}</p>
              <button onClick={fetchJobs} className="text-xs underline mt-1">
                Retry
              </button>
            </div>
          )}
          {!isLoading && !error && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Search size={36} className="mb-3 text-gray-300 dark:text-gray-700" />
              <p className="font-medium">No jobs found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}

          {!isLoading &&
            jobs.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              const isSaving = savingJobIds.has(job.id);
              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(isSelected ? null : job)}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                    isSelected
                      ? "border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-800"
                      : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-linear-to-br ${logoGradient(
                        job.company
                      )} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                    >
                      {job.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {job.title}
                        </p>
                        {/* Save button on the card */}
                        <button
                          onClick={(e) => handleToggleSave(job, e)}
                          disabled={isSaving}
                          title={job.isSaved ? "Unsave job" : "Save job"}
                          className="shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isSaving ? (
                            <Loader2
                              size={14}
                              className="animate-spin text-gray-400"
                            />
                          ) : job.isSaved ? (
                            <BookmarkCheck
                              size={14}
                              className="text-indigo-600 dark:text-indigo-400"
                            />
                          ) : (
                            <Bookmark
                              size={14}
                              className="text-gray-400 hover:text-indigo-500"
                            />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {job.company}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {job.location || "Remote"}
                        </span>
                        {job.salary && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={11} /> {job.salary}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                            {TYPE_LABEL[job.type] ?? job.type}
                          </span>
                          {job.remote && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                              Remote
                            </span>
                          )}
                        </div>
                        {job.applicationStatus && (
                          <span
                            className={`text-xs font-semibold ${
                              STATUS_BADGE[job.applicationStatus].className
                            }`}
                          >
                            {STATUS_BADGE[job.applicationStatus].label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Pagination */}
          {!isLoading && total > LIMIT && (
            <div className="flex items-center justify-center gap-3 pt-2 pb-1">
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

      {/* ── Right: Job Detail ── */}
      {selectedJob && (
        <div className="hidden lg:flex lg:flex-1 flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-linear-to-br ${logoGradient(
                      selectedJob.company
                    )} flex items-center justify-center text-white font-bold text-lg shrink-0`}
                  >
                    {selectedJob.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedJob.title}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      {selectedJob.company}
                    </p>
                    {selectedJob.applicationStatus && (
                      <span
                        className={`text-sm font-semibold ${
                          STATUS_BADGE[selectedJob.applicationStatus].className
                        }`}
                      >
                        {STATUS_BADGE[selectedJob.applicationStatus].label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Save button in detail panel */}
                  <button
                    onClick={(e) => handleToggleSave(selectedJob, e)}
                    disabled={savingJobIds.has(selectedJob.id)}
                    title={selectedJob.isSaved ? "Unsave job" : "Save job"}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {savingJobIds.has(selectedJob.id) ? (
                      <Loader2
                        size={18}
                        className="animate-spin text-gray-400"
                      />
                    ) : selectedJob.isSaved ? (
                      <BookmarkCheck
                        size={18}
                        className="text-indigo-600 dark:text-indigo-400"
                      />
                    ) : (
                      <Bookmark
                        size={18}
                        className="text-gray-400 hover:text-indigo-500"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                {selectedJob.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} /> {selectedJob.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} />{" "}
                  {TYPE_LABEL[selectedJob.type] ?? selectedJob.type}
                </span>
                {selectedJob.salary && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign size={14} /> {selectedJob.salary}
                  </span>
                )}
                {selectedJob.postedDate && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> Posted{" "}
                    {new Date(selectedJob.postedDate).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )}
                  </span>
                )}
                {selectedJob.remote && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                    🌐 Remote
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedJob.description && (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    About the Role
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                    {selectedJob.description}
                  </p>
                </div>
              )}
              {selectedJob.requiredSkills?.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-lg"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action bar */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
            {selectedJob.applicationStatus === "ACCEPTED" ||
            selectedJob.applicationStatus === "HIRED" ? (
              <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-semibold">
                🎉 Congratulations! You were accepted.
              </div>
            ) : selectedJob.applicationStatus === "REJECTED" ? (
              <div className="flex-1 flex items-center justify-center px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold">
                ✗ Not selected for this role
              </div>
            ) : selectedJob.applicationStatus === "INTERVIEW_SCHEDULED" ? (
              <div className="flex-1 flex items-center justify-center px-4 py-2.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-xl text-sm font-semibold">
                📅 Interview Scheduled — check your calendar
              </div>
            ) : selectedJob.applicationStatus === "OFFER" ? (
              <div className="flex-1 flex items-center justify-center px-4 py-2.5 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 rounded-xl text-sm font-semibold">
                🎁 Offer received — check your messages
              </div>
            ) : ACTIVE_STATUSES.includes(
                selectedJob.applicationStatus as ApplicationStatus
              ) ? (
              <>
                <div className="flex-1 flex items-center justify-center px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-semibold">
                  {STATUS_BADGE[selectedJob.applicationStatus!].label}
                </div>
                <button
                  onClick={() => handleWithdraw(selectedJob)}
                  className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                >
                  Withdraw
                </button>
              </>
            ) : (
              <button
                onClick={() => openApplyModal(selectedJob)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                <Send size={16} /> Apply Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Apply Modal ── */}
      {showApplyModal && applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Apply for Position
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {applyingJob.title} · {applyingJob.company}
                </p>
              </div>
              <button
                onClick={closeApplyModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {applyError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                  <AlertCircle size={16} /> {applyError}
                </div>
              )}

              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cover Letter{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                  placeholder="Tell the recruiter why you're a great fit…"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900 dark:text-white"
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Years of Experience{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 3 years in frontend development"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                />
              </div>

              {/* Resume URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Resume / CV Link{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/… or LinkedIn"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Key Skills{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="e.g. React, TypeScript…"
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={addSkill}
                    type="button"
                    className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium"
                      >
                        {s}
                        <button
                          onClick={() => removeSkill(s)}
                          className="hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pre-fill hint */}
              {applyingJob.requiredSkills?.length > 0 && skills.length === 0 && (
                <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                  <span className="font-semibold">Tip:</span> This role
                  requires:{" "}
                  {applyingJob.requiredSkills.slice(0, 5).join(", ")}
                  {applyingJob.requiredSkills.length > 5
                    ? ` +${applyingJob.requiredSkills.length - 5} more`
                    : ""}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={closeApplyModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                {applying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {applying ? "Submitting…" : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}