"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase, Plus, Pencil, Trash2, Search, X, MapPin,
  DollarSign, Clock, Users, CheckCircle, AlertCircle,
  ToggleLeft, ToggleRight, Loader2, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type JobStatus = "DRAFT" | "OPEN" | "PAUSED" | "CLOSED" | "FILLED";
type JobType   = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE";

interface Job {
  id: string;
  _id?: string; // MongoDB uses _id
  title: string;
  company: string;
  department: string;
  location: string;
  type: JobType;
  status: JobStatus;
  salary: string;
  description: string;
  requiredSkills: string[];
  remote: boolean;
  experienceLevel: string;
  benefits: string[];
  createdAt: string;
  updatedAt: string;
}

interface FormState {
  title: string;
  company: string;
  department: string;
  location: string;
  type: JobType;
  status: JobStatus;
  salary: string;
  description: string;
  requiredSkills: string[];
  remote: boolean;
  experienceLevel: string;
  benefits: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_FORM: FormState = {
  title: "", company: "TechCorp Inc.", department: "", location: "",
  type: "FULL_TIME", status: "OPEN", salary: "", description: "",
  requiredSkills: [], remote: false, experienceLevel: "MID", benefits: [],
};

const JOB_TYPES: JobType[]     = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE"];
const JOB_STATUSES: JobStatus[] = ["DRAFT", "OPEN", "PAUSED", "CLOSED", "FILLED"];
const EXP_LEVELS               = ["ENTRY", "MID", "SENIOR", "LEAD", "EXECUTIVE"];
const BENEFIT_OPTIONS          = [
  "Health Insurance", "Dental & Vision", "401k", "Stock Options",
  "Remote Work", "Flexible Hours", "Learning Budget", "Gym Membership",
  "Commuter Benefits", "Unlimited PTO",
];

const SKILL_POOL = [
  "React","TypeScript","JavaScript","Node.js","Python","Go","Java","Rust","C++",
  "AWS","Docker","Kubernetes","PostgreSQL","MongoDB","Redis","GraphQL","Next.js",
  "Figma","Agile","Tailwind CSS","REST API","CI/CD","Terraform","Vue.js","Angular",
];

const STATUS_CFG: Record<JobStatus, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT:  { label: "Draft",  bg: "bg-slate-100 dark:bg-slate-800",       text: "text-slate-600 dark:text-slate-300",    dot: "bg-slate-400" },
  OPEN:   { label: "Open",   bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  PAUSED: { label: "Paused", bg: "bg-amber-50 dark:bg-amber-900/30",     text: "text-amber-700 dark:text-amber-300",     dot: "bg-amber-500" },
  CLOSED: { label: "Closed", bg: "bg-red-50 dark:bg-red-900/30",         text: "text-red-700 dark:text-red-300",         dot: "bg-red-500" },
  FILLED: { label: "Filled", bg: "bg-blue-50 dark:bg-blue-900/30",       text: "text-blue-700 dark:text-blue-300",       dot: "bg-blue-500" },
};

// ─── Helper: resolve job ID (handles both MongoDB _id and plain id) ───────────
const resolveId = (job: Job): string => job._id ?? job.id;

// ─── Shared input style ───────────────────────────────────────────────────────
const CLS = "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all";

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RecruiterJobsPage() {
  const [jobs, setJobs]                 = useState<Job[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetching, setFetching]         = useState(false);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatus]       = useState("ALL");
  const [showModal, setShowModal]       = useState(false);
  const [editJob, setEditJob]           = useState<Job | null>(null);
  const [form, setForm]                 = useState<FormState>({ ...EMPTY_FORM });
  const [skillInput, setSkillInput]     = useState("");
  const [benefitInput, setBenefitInput] = useState("");
  const [saving, setSaving]             = useState(false);
  const [deleteId, setDeleteId]         = useState<string | null>(null);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);
  const [errors, setErrors]             = useState<Partial<Record<keyof FormState, string>>>({});
  const [totalJobs, setTotalJobs]       = useState(0);

  // ── Fetch jobs ───────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setFetching(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search.trim())          params.set("search", search.trim());
      const res  = await fetch(`/api/recruiter/jobs?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setJobs(Array.isArray(json.data) ? json.data : []);
      setTotalJobs(json.total ?? 0);
    } catch {
      showToast("Failed to load jobs. Showing cached data.", false);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Open create modal ─────────────────────────────────────────────────────
  const openCreate = () => {
    setEditJob(null);
    setForm({ ...EMPTY_FORM });
    setSkillInput("");
    setBenefitInput("");
    setErrors({});
    setShowModal(true);
  };

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = (job: Job) => {
    setEditJob(job);
    setForm({
      title:           job.title,
      company:         job.company,
      department:      job.department,
      location:        job.location,
      type:            job.type,
      status:          job.status,
      salary:          job.salary,
      description:     job.description,
      requiredSkills:  [...job.requiredSkills],
      remote:          job.remote,
      experienceLevel: job.experienceLevel,
      benefits:        [...(job.benefits ?? [])],
    });
    setSkillInput("");
    setBenefitInput("");
    setErrors({});
    setShowModal(true);
  };

  // ── Skill helpers ─────────────────────────────────────────────────────────
  const addSkill = (s: string) => {
    const t = s.trim();
    if (t && !form.requiredSkills.includes(t))
      setForm(p => ({ ...p, requiredSkills: [...p.requiredSkills, t] }));
    setSkillInput("");
  };
  const removeSkill = (s: string) =>
    setForm(p => ({ ...p, requiredSkills: p.requiredSkills.filter(x => x !== s) }));

  // ── Benefit helpers ───────────────────────────────────────────────────────
  const toggleBenefit = (b: string) =>
    setForm(p => ({
      ...p,
      benefits: p.benefits.includes(b) ? p.benefits.filter(x => x !== b) : [...p.benefits, b],
    }));
  const addBenefit = (b: string) => {
    const t = b.trim();
    if (t && !form.benefits.includes(t))
      setForm(p => ({ ...p, benefits: [...p.benefits, t] }));
    setBenefitInput("");
  };

  // ── Validate form ─────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim())       errs.title       = "Job title is required";
    if (!form.company.trim())     errs.company     = "Company is required";
    if (!form.location.trim())    errs.location    = "Location is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.type)               errs.type        = "Job type is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const isEdit = Boolean(editJob);
      const jobId  = editJob ? resolveId(editJob) : undefined;
      const url    = isEdit ? `/api/recruiter/jobs?id=${jobId}` : "/api/recruiter/jobs";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? `HTTP Error ${res.status}`);
      }

      const saved: Job = await res.json();

      if (isEdit) {
        setJobs(prev => prev.map(j => resolveId(j) === jobId ? saved : j));
      } else {
        setJobs(prev => [saved, ...prev]);
        setTotalJobs(t => t + 1);
      }

      setShowModal(false);
      showToast(isEdit ? "Job updated!" : "Job posted!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error occurred", false);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete job ────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/recruiter/jobs?id=${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      setJobs(prev => prev.filter(j => resolveId(j) !== id));
      setTotalJobs(t => t - 1);
      setDeleteId(null);
      showToast("Job deleted.");
    } catch {
      showToast("Failed to delete job.", false);
    }
  };

  // ── Quick status toggle ───────────────────────────────────────────────────
  const toggleStatus = async (job: Job) => {
    const next: JobStatus = job.status === "OPEN" ? "PAUSED" : "OPEN";
    const jobId = resolveId(job);
    try {
      const res = await fetch(`/api/recruiter/jobs?id=${jobId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      const updated: Job = await res.json();
      setJobs(prev => prev.map(j => resolveId(j) === jobId ? updated : j));
    } catch {
      showToast("Failed to update status.", false);
    }
  };

  const displayed = jobs;

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white transition-all ${toast.ok ? "bg-gray-900" : "bg-red-600"}`}>
          {toast.ok
            ? <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            : <AlertCircle size={18} className="text-white shrink-0" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Job Postings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {jobs.filter(j => j.status === "OPEN").length} open &middot; {totalJobs} total
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchJobs(true)} disabled={fetching} title="Refresh"
            className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <RefreshCw size={17} className={fetching ? "animate-spin" : ""} />
          </button>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-200 dark:shadow-none cursor-pointer">
            <Plus size={18} /> Post New Job
          </button>
        </div>
      </div>

      {/* Status summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {JOB_STATUSES.map(s => {
          const cfg   = STATUS_CFG[s];
          const count = jobs.filter(j => j.status === s).length;
          return (
            <button key={s} onClick={() => setStatus(prev => prev === s ? "ALL" : s)}
              className={`rounded-2xl p-4 text-left transition-all cursor-pointer ${statusFilter === s ? `${cfg.bg} ring-2 ring-indigo-400` : cfg.bg}`}>
              <p className={`text-2xl font-bold ${cfg.text}`}>{count}</p>
              <p className={`text-xs font-semibold mt-0.5 ${cfg.text}`}>{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") fetchJobs(); }}
            placeholder="Search title, department, or skills… press Enter"
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", ...JOB_STATUSES].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${statusFilter === s ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-indigo-300"}`}>
              {s === "ALL" ? "All" : STATUS_CFG[s as JobStatus]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse h-56" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          <Briefcase size={44} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="font-semibold text-gray-600 dark:text-gray-400">No jobs found</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Try adjusting your filters or post your first job</p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer">
            <Plus size={16} /> Post a Job
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-1 xl:grid-cols-1 gap-5">
          {/* FIX: Included index tracking parameter (idx) inside mapped dataset execution context */}
          {displayed.map((job, idx) => {
            const sc    = STATUS_CFG[job.status];
            const idValue = resolveId(job);
            const trackingKey = idValue || `job-fallback-${idx}`;
            
            return (
              <div key={trackingKey} className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{job.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{job.department || job.company}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} /> {job.location}
                      {job.remote && <span className="ml-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded font-medium">Remote</span>}
                    </span>
                    <span className="flex items-center gap-1.5"><DollarSign size={12} /> {job.salary || "Salary not specified"}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {job.type} &middot; {job.experienceLevel}</span>
                    <span className="flex items-center gap-1.5">
                      <Users size={12} /> Posted {new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  {job.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.requiredSkills.slice(0, 4).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-lg font-medium">{s}</span>
                      ))}
                      {job.requiredSkills.length > 4 && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs rounded-lg font-medium">+{job.requiredSkills.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-800 flex items-center gap-2">
                  {(job.status === "OPEN" || job.status === "PAUSED") && (
                    <button onClick={() => toggleStatus(job)} title={job.status === "OPEN" ? "Pause" : "Activate"}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      {job.status === "OPEN"
                        ? <ToggleRight size={18} className="text-emerald-500" />
                        : <ToggleLeft  size={18} className="text-amber-500" />}
                    </button>
                  )}
                  <button onClick={() => openEdit(job)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer">
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => setDeleteId(idValue)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer ml-auto">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[94vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editJob ? "Edit Job Posting" : "Post a New Job"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {editJob ? "Update the details below" : "Fill in all required fields to publish a new listing"}
                </p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Row 1: Title + Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Job Title" required>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Senior Frontend Developer" className={`${CLS} ${errors.title ? "border-red-400 ring-1 ring-red-400" : ""}`} />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </Field>
                <Field label="Department">
                  <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    placeholder="e.g. Engineering" className={CLS} />
                </Field>
              </div>

              {/* Row 2: Company + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Company" required>
                  <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                    placeholder="TechCorp Inc." className={`${CLS} ${errors.company ? "border-red-400 ring-1 ring-red-400" : ""}`} />
                  {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
                </Field>
                <Field label="Location" required>
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. San Francisco, CA or Remote" className={`${CLS} ${errors.location ? "border-red-400 ring-1 ring-red-400" : ""}`} />
                  {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                </Field>
              </div>

              {/* Row 3: Type + Status + Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Job Type" required>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as JobType }))} className={CLS}>
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as JobStatus }))} className={CLS}>
                    {JOB_STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                  </select>
                </Field>
                <Field label="Salary / Rate">
                  <input value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))}
                    placeholder="e.g. $120k – $160k" className={CLS} />
                </Field>
              </div>

              {/* Row 4: Experience level + Remote */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <Field label="Experience Level">
                  <select value={form.experienceLevel} onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))} className={CLS}>
                    {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
                <div className="flex items-center gap-3 pb-1">
                  <button type="button" onClick={() => setForm(p => ({ ...p, remote: !p.remote }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${form.remote ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-700"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.remote ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Remote Friendly</p>
                    <p className="text-xs text-gray-400">Candidates can work remotely</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <Field label="Job Description" required>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={5} placeholder="Describe the role, day-to-day responsibilities, team setup, and what success looks like in this position…"
                  className={`${CLS} resize-none ${errors.description ? "border-red-400 ring-1 ring-red-400" : ""}`} />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </Field>

              {/* Skills */}
              <Field label="Required Skills" hint="Press Enter or comma to add. Click suggestions below.">
                <div className="flex gap-2 mb-2">
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(skillInput); } }}
                    placeholder="e.g. React, TypeScript…" className={CLS} />
                  <button type="button" onClick={() => addSkill(skillInput)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer shrink-0">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SKILL_POOL.filter(s => !form.requiredSkills.includes(s)).slice(0, 12).map(s => (
                    <button key={s} type="button" onClick={() => addSkill(s)}
                      className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 text-gray-600 dark:text-gray-400 text-xs rounded-lg transition-colors cursor-pointer">
                      + {s}
                    </button>
                  ))}
                </div>
                {form.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl">
                    {form.requiredSkills.map(s => (
                      <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-lg">
                        {s}
                        <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-500 cursor-pointer"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>

              {/* Benefits */}
              <Field label="Benefits" hint="Click to toggle. Add custom ones below.">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {BENEFIT_OPTIONS.map(b => (
                    <button key={b} type="button" onClick={() => toggleBenefit(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${form.benefits.includes(b) ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                      {form.benefits.includes(b) ? "✓ " : ""}{b}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={benefitInput} onChange={e => setBenefitInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addBenefit(benefitInput); } }}
                    placeholder="Custom benefit…" className={`${CLS} flex-1`} />
                  <button type="button" onClick={() => addBenefit(benefitInput)}
                    className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium cursor-pointer shrink-0">Add</button>
                </div>
              </Field>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-5 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {saving ? "Saving Changes..." : editJob ? "Save Changes" : "Publish Job"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}