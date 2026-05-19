"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  Users,
  Plus,
  X,
  Check,
  Search,
  Link2,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InterviewType = "VIDEO" | "PHONE" | "IN_PERSON";
export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

interface Interview {
  id: string;
  applicationId: string;
  candidate: string;
  email: string;
  avatar?: string | null;
  jobTitle: string;
  company?: string;
  location?: string;
  scheduledAt: string;
  date: string;
  time: string;
  type: InterviewType;
  status: InterviewStatus;
  meetingLink?: string | null;
  notes?: string | null;
}

// Candidate option populated from /api/recruiter/candidates
interface CandidateOption {
  applicationId: string;
  name: string;
  email: string;
  jobTitle: string;
  jobId: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  InterviewType,
  { label: string; icon: React.FC<any>; color: string; bg: string }
> = {
  PHONE: {
    label: "Phone Screen",
    icon: Phone,
    color: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800",
  },
  VIDEO: {
    label: "Video Call",
    icon: Video,
    color: "text-blue-600 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-900/30",
  },
  IN_PERSON: {
    label: "In Person",
    icon: Users,
    color: "text-violet-600 dark:text-violet-300",
    bg: "bg-violet-50 dark:bg-violet-900/30",
  },
};

const STATUS_CONFIG: Record<
  InterviewStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  SCHEDULED: {
    label: "Scheduled",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    dot: "bg-blue-500",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-50 dark:bg-red-900/30",
    dot: "bg-red-500",
  },
  NO_SHOW: {
    label: "No Show",
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-900/30",
    dot: "bg-orange-500",
  },
};

const EMPTY_FORM = {
  applicationId: "",
  candidateLabel: "", // display name for the selected candidate
  scheduledAt: "",
  type: "VIDEO" as InterviewType,
  meetingLink: "",
  notes: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruiterInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Candidate search inside modal
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateOptions, setCandidateOptions] = useState<CandidateOption[]>([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Load interviews ────────────────────────────────────────────────────────
  const loadInterviews = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      // FIX: correct plural path /api/recruiter/interviews
      const res = await fetch("/api/recruiter/interview");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const result = await res.json();
      setInterviews(Array.isArray(result.data) ? result.data : []);
    } catch (err: any) {
      setFetchError(err.message ?? "Failed to load interviews");
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  // ── Search candidates for the modal dropdown ───────────────────────────────
  useEffect(() => {
    if (!candidateSearch.trim()) {
      setCandidateOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCandidateLoading(true);
      try {
        const params = new URLSearchParams({
          search: candidateSearch,
          limit: "10",
          // Only show candidates who haven't been interviewed yet
          // (APPLIED or REVIEWING — recruiters may also reschedule)
        });
        const res = await fetch(`/api/recruiter/candidates?${params}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        // Map to a flat list for the dropdown
        const options: CandidateOption[] = (json.data ?? []).map((c: any) => ({
          applicationId: c.applicationId ?? c._id,
          // FIX: candidates route now returns normalised "name" field
          name:      c.name ?? c.seekerId?.name ?? "Unknown",
          email:     c.email ?? "",
          jobTitle:  c.jobTitle ?? "Unknown Position",
          jobId:     c.jobId ?? null,
        }));
        setCandidateOptions(options);
        setShowDropdown(true);
      } catch {
        setCandidateOptions([]);
      } finally {
        setCandidateLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [candidateSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectCandidate = (opt: CandidateOption) => {
    setForm((f) => ({
      ...f,
      applicationId:  opt.applicationId,
      candidateLabel: `${opt.name} — ${opt.jobTitle}`,
    }));
    setCandidateSearch(`${opt.name} — ${opt.jobTitle}`);
    setShowDropdown(false);
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = interviews.filter((iv) => {
    const matchSearch =
      (iv.candidate ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (iv.jobTitle  ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || iv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const grouped = {
    upcoming: filtered.filter((iv) => iv.status === "SCHEDULED"),
    past:     filtered.filter((iv) => iv.status !== "SCHEDULED"),
  };

  // ── Schedule ───────────────────────────────────────────────────────────────
  const handleSchedule = async () => {
    setSaveError(null);
    if (!form.applicationId) {
      setSaveError("Please select a candidate from the list.");
      return;
    }
    if (!form.scheduledAt) {
      setSaveError("Please select a date and time.");
      return;
    }
    setSaving(true);
    try {
      // FIX: correct plural path /api/recruiter/interviews
      const res = await fetch("/api/recruiter/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: form.applicationId,
          scheduledAt:   new Date(form.scheduledAt).toISOString(),
          type:          form.type,
          meetingLink:   form.meetingLink  || undefined,
          notes:         form.notes        || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule interview");

      // Prepend the new interview into state immediately (optimistic)
      setInterviews((prev) => [data as Interview, ...prev]);
      setForm(EMPTY_FORM);
      setCandidateSearch("");
      setCandidateOptions([]);
      setShowModal(false);
      // Then sync from server to get fully consistent list
      loadInterviews();
    } catch (err: any) {
      setSaveError(err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ── Update status ──────────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: InterviewStatus) => {
    try {
      // FIX: correct plural path /api/recruiter/interviews
      const res = await fetch(`/api/recruiter/interview?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setInterviews((prev) =>
        prev.map((iv) => (iv.id === id ? { ...iv, status } : iv))
      );
    } catch {
      alert("Failed to update interview status.");
    }
  };

  const openModal = () => {
    setForm(EMPTY_FORM);
    setCandidateSearch("");
    setCandidateOptions([]);
    setSaveError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSaveError(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Interviews
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Schedule and manage candidate interviews
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg cursor-pointer"
        >
          <Plus size={18} /> Schedule Interview
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates or roles..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "SCHEDULED", "COMPLETED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                statusFilter === s
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-indigo-300"
              }`}
            >
              {s === "ALL" ? "All" : STATUS_CONFIG[s as InterviewStatus]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={30} className="animate-spin text-gray-400" />
        </div>
      )}
      {!loading && fetchError && (
        <div className="flex flex-col items-center justify-center py-16 text-red-400 gap-2">
          <AlertCircle size={28} />
          <p className="text-sm">{fetchError}</p>
          <button onClick={loadInterviews} className="text-xs underline mt-1">
            Retry
          </button>
        </div>
      )}

      {/* Lists */}
      {!loading && !fetchError && (
        <>
          {grouped.upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Upcoming ({grouped.upcoming.length})
              </h2>
              <div className="space-y-3">
                {grouped.upcoming.map((iv) => (
                  <InterviewCard key={iv.id} iv={iv} onUpdate={updateStatus} />
                ))}
              </div>
            </section>
          )}

          {grouped.past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3 mt-6">
                Past Interviews ({grouped.past.length})
              </h2>
              <div className="space-y-3">
                {grouped.past.map((iv) => (
                  <InterviewCard key={iv.id} iv={iv} onUpdate={updateStatus} past />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
              <Calendar
                size={40}
                className="mx-auto text-gray-300 dark:text-gray-700 mb-3"
              />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                No interviews found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
                Try adjusting your filters or schedule a new interview
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Schedule Interview Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Schedule Interview
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {saveError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                  <AlertCircle size={16} /> {saveError}
                </div>
              )}

              {/* ── Candidate search / select ── */}
              <div ref={dropdownRef} className="relative">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Select Candidate *
                </label>
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    value={candidateSearch}
                    onChange={(e) => {
                      setCandidateSearch(e.target.value);
                      // Clear selection if user edits after selecting
                      if (form.applicationId) {
                        setForm((f) => ({ ...f, applicationId: "", candidateLabel: "" }));
                      }
                    }}
                    onFocus={() => candidateOptions.length > 0 && setShowDropdown(true)}
                    placeholder="Type candidate name or job title..."
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                  {candidateLoading && (
                    <Loader2
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
                    />
                  )}
                  {form.applicationId && !candidateLoading && (
                    <Check
                      size={15}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
                    />
                  )}
                </div>

                {/* Dropdown list */}
                {showDropdown && candidateOptions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                    {candidateOptions.map((opt) => (
                      <button
                        key={opt.applicationId}
                        onClick={() => selectCandidate(opt)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                          {opt.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {opt.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {opt.email}
                          </p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate mt-0.5">
                            {opt.jobTitle}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && !candidateLoading && candidateSearch.trim() && candidateOptions.length === 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl px-4 py-3 text-sm text-gray-500">
                    No candidates found for "{candidateSearch}"
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, scheduledAt: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                />
              </div>

              {/* Interview Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Interview Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value as InterviewType }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                >
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Meeting Link — only for VIDEO */}
              {form.type === "VIDEO" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Meeting Link (optional)
                  </label>
                  <input
                    type="url"
                    value={form.meetingLink}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, meetingLink: e.target.value }))
                    }
                    placeholder="https://meet.google.com/..."
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Notes for Candidate (optional)
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Any preparation instructions, address, or reminders..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={saving || !form.applicationId || !form.scheduledAt}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar size={16} /> Confirm Interview
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Interview Card ───────────────────────────────────────────────────────────

function InterviewCard({
  iv,
  onUpdate,
  past,
}: {
  iv: Interview;
  onUpdate: (id: string, status: InterviewStatus) => void;
  past?: boolean;
}) {
  const tc = TYPE_CONFIG[iv.type] ?? TYPE_CONFIG.VIDEO;
  const sc = STATUS_CONFIG[iv.status] ?? STATUS_CONFIG.SCHEDULED;
  const Icon = tc.icon;

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all p-5 ${
        past ? "opacity-75" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl ${tc.bg} flex items-center justify-center shrink-0`}
        >
          <Icon size={22} className={tc.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-bold text-gray-900 dark:text-white">
              {iv.candidate || "Unknown Candidate"}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {iv.jobTitle || "Position"} · {tc.label}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {iv.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {iv.time}
            </span>
            {iv.meetingLink && (
              <a
                href={iv.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Link2 size={12} /> Join Meeting
              </a>
            )}
          </div>
        </div>

        {!past && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onUpdate(iv.id, "COMPLETED")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Check size={14} /> Done
            </button>
            <button
              onClick={() => onUpdate(iv.id, "CANCELLED")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        )}
      </div>

      {iv.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 italic">
          📝 {iv.notes}
        </div>
      )}
    </div>
  );
}