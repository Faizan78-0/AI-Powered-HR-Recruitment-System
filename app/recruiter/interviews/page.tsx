"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from '@/context/userContext';
import { api, norm } from "@/services/user.service";
// Replaced custom icons with Lucide
import { 
  Calendar as CalendarIcon, 
  Search as SearchIcon, 
  X as XIcon, 
  Video as VideoIcon, 
  Phone as PhoneIcon, 
  Building as BuildingIcon,
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

/* ── Interfaces ────────────────────────────────────────────────────────── */

interface Candidate {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  jobTitle?: string;
}

interface Interview {
  id?: string;
  _id?: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  type: string;
  date: string;
  time: string;
  duration: number;
  interviewers: string[];
  interviewer?: string; // For legacy/single field support
  meetingType: string;
  meetingLink: string;
  notes: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  cancelReason?: string;
  feedback?: {
    decision?: "Move Forward" | "Rejected" | "Waitlist";
  };
}

interface User {
  name?: string;
}

/* ── Constants ────────────────────────────────────────────────────────── */

const TYPES = ["Phone Screen", "Technical", "HR Round", "Cultural Fit", "Final Round", "Panel"];
const STATUSES: Interview["status"][] = ["Scheduled", "Completed", "Cancelled"];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Scheduled: { bg: "var(--blue-dim)", color: "var(--blue)" },
  Completed: { bg: "var(--green-dim)", color: "var(--green)" },
  Cancelled: { bg: "var(--red-dim)", color: "var(--red)" },
};

const MEETING_TYPES = ["Video (Google Meet)", "Video (Zoom)", "Video (Teams)", "Phone Call", "In-Person"];

const MEETING_ICONS: Record<string, React.ReactNode> = {
  "Video (Google Meet)": <VideoIcon size={14} />,
  "Video (Zoom)": <VideoIcon size={14} />,
  "Video (Teams)": <VideoIcon size={14} />,
  "Phone Call": <PhoneIcon size={14} />,
  "In-Person": <BuildingIcon size={14} />,
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const pad = (n: number) => String(n).padStart(2, "0");

const fmtTime = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr < 12 ? "AM" : "PM"}`;
};

const fmtDate = (d: string) => {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
};

const isToday = (d: string) => d === new Date().toISOString().split("T")[0];

const EMPTY: Interview = {
  candidateId: "", candidateName: "", candidateEmail: "", jobTitle: "",
  type: "Technical", date: "", time: "09:00", duration: 60,
  interviewers: [], meetingType: "Video (Google Meet)", meetingLink: "", notes: "",
  status: "Scheduled",
};

/* ── Schedule Modal ─────────────────────────────────────────────────── */

interface ScheduleModalProps {
  interview: Interview | null;
  candidates: Candidate[];
  user: User | null;
  onClose: () => void;
  onSave: (form: Interview, id: string | null) => void;
  notify: (msg: string, type?: "success" | "error") => void;
}

function ScheduleModal({ interview, candidates, user, onClose, onSave, notify }: ScheduleModalProps) {
  const [form, setForm] = useState<Interview>(interview
    ? { ...EMPTY, ...interview, interviewers: interview.interviewers || [interview.interviewer || ""].filter(Boolean) }
    : { ...EMPTY });
  
  const [ivInput, setIvInput] = useState("");
  const [cancelMode, setCancelMode] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const setField = <K extends keyof Interview>(k: K, v: Interview[K]) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!(interview?.id || interview?._id);

  const addIv = () => {
    const v = ivInput.trim();
    if (v && !form.interviewers.includes(v)) setField("interviewers", [...form.interviewers, v]);
    setIvInput("");
  };

  const save = () => {
    if (!form.candidateId || !form.date || !form.time) {
      notify("Candidate, date and time required", "error");
      return;
    }
    onSave({ ...form, interviewer: form.interviewers[0] || "" }, isEdit ? (interview!.id || interview!._id!) : null);
    onClose();
  };

  const doCancel = async () => {
    if (!cancelReason.trim()) { notify("Please provide a reason", "error"); return; }
    try {
      await api.put(`/api/interviews/${interview!.id || interview!._id}`, { status: "Cancelled", cancelReason });
      notify("Interview cancelled"); onClose();
    } catch (e: any) { notify(e.message, "error"); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? "Edit Interview" : "Schedule Interview"}</span>
          <button className="modal-close" onClick={onClose}><XIcon size={16} /></button>
        </div>
        <div className="modal-body">
          {cancelMode ? (
            <div className="flex flex-col gap-3">
              <div className="text-sm font-semibold" style={{ color: "var(--red)" }}>Cancel this interview</div>
              <div>
                <label className="form-label">Reason *</label>
                <textarea className="form-textarea" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="e.g. Candidate withdrew..." />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={() => setCancelMode(false)}>Back</button>
                <button className="btn btn-danger" onClick={doCancel}>Confirm Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="form-label">Candidate *</label>
                  <select className="form-select" value={form.candidateId || ""} onChange={e => {
                    const c = candidates.find(c => (c.id || c._id) === e.target.value);
                    setField("candidateId", e.target.value);
                    if (c) {
                      setField("candidateName", c.name);
                      setField("jobTitle", c.jobTitle || "");
                      setField("candidateEmail", c.email || "");
                    }
                  }}>
                    <option value="">Select candidate…</option>
                    {candidates.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}{c.jobTitle ? ` — ${c.jobTitle}` : ""}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Interview Type</label>
                  <select className="form-select" value={form.type} onChange={e => setField("type", e.target.value)}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Format</label>
                  <select className="form-select" value={form.meetingType} onChange={e => setField("meetingType", e.target.value)}>
                    {MEETING_TYPES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setField("date", e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Time *</label>
                  <input type="time" className="form-input" value={form.time} onChange={e => setField("time", e.target.value)} />
                </div>

                <div className="col-span-2">
                  <label className="form-label">Meeting Link</label>
                  <div className="flex gap-2">
                    <input className="form-input flex-1" value={form.meetingLink} onChange={e => setField("meetingLink", e.target.value)} placeholder="Link..." />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="form-label">Interviewer(s)</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.interviewers.map(iv => (
                      <span key={iv} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--amber-dim)", color: "var(--amber)", border: "1px solid var(--amber-glow)" }}>
                        {iv}
                        <button onClick={() => setField("interviewers", form.interviewers.filter(x => x !== iv))} className="border-none bg-transparent cursor-pointer opacity-60 hover:opacity-100"><XIcon size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input className="form-input flex-1" value={ivInput} onChange={e => setIvInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addIv())} placeholder="Add interviewer..." />
                    <button className="btn btn-outline btn-sm" onClick={addIv}>Add</button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                {isEdit && form.status !== "Cancelled" && (
                  <button className="btn btn-danger btn-sm" onClick={() => setCancelMode(true)}>Cancel Interview</button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button className="btn btn-outline" onClick={onClose}>Close</button>
                  <button className="btn btn-primary" onClick={save}>{isEdit ? "Save Changes" : "Schedule"}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Calendar View ──────────────────────────────────────────────────── */

interface CalendarViewProps {
  interviews: Interview[];
  onSelectDay: (day: string) => void;
  selectedDay: string | null;
}

function CalendarView({ interviews, onSelectDay, selectedDay }: CalendarViewProps) {
  const [cursor, setCursor] = useState(new Date());
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dayStr = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;
  const ivForDay = (d: number) => interviews.filter(iv => iv.date === dayStr(d));
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="card p-4 mb-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer border-none bg-[var(--surface-2)] text-[var(--ink-3)]">
          <ChevronLeft size={16} />
        </button>
        <div className="text-[15px] font-black">{MONTHS[month]} {year}</div>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer border-none bg-[var(--surface-2)] text-[var(--ink-3)]">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-black uppercase py-1 opacity-50">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = dayStr(d), ivs = ivForDay(d), isT = ds === todayStr, isSel = ds === selectedDay;
          return (
            <button key={i} onClick={() => onSelectDay(ds)} className="flex flex-col items-center p-1.5 rounded-xl cursor-pointer border-none min-h-[46px]"
              style={{ background: isSel ? "var(--amber)" : isT ? "var(--amber-dim)" : "transparent" }}>
              <span className="text-[12px] font-bold" style={{ color: isSel ? "white" : isT ? "var(--amber)" : "var(--ink)" }}>{d}</span>
              <div className="flex gap-0.5 mt-1">
                {ivs.slice(0, 3).map((iv, j) => <div key={j} className="w-1 h-1 rounded-full bg-current" />)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Interview Card ─────────────────────────────────────────────────── */

interface InterviewCardProps {
  iv: Interview;
  onEdit: (iv: Interview) => void;
  onDelete: (id: string) => void;
}

function InterviewCard({ iv, onEdit, onDelete }: InterviewCardProps) {
  const st = STATUS_STYLE[iv.status] || STATUS_STYLE.Scheduled;
  const icon = MEETING_ICONS[iv.meetingType] || <VideoIcon size={14} />;
  const init = iv.candidateName?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="card p-4 transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="w-12 flex-shrink-0 text-center rounded-xl py-2" style={{ background: isToday(iv.date) ? "var(--amber)" : "var(--amber-dim)" }}>
          <div className="text-[9px] font-black" style={{ color: isToday(iv.date) ? "white" : "var(--amber)" }}>{new Date(iv.date + "T00:00:00").toLocaleDateString("en", { month: "short" })}</div>
          <div className="text-lg font-black" style={{ color: isToday(iv.date) ? "white" : "var(--amber)" }}>{new Date(iv.date + "T00:00:00").getDate()}</div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-[var(--amber)]">{init}</div>
            <div className="text-[14px] font-bold">{iv.candidateName}</div>
            <span className="badge" style={{ background: st.bg, color: st.color }}>{iv.status}</span>
          </div>
          <div className="flex items-center gap-3 text-xs opacity-60">
            <span>{iv.jobTitle}</span>
            <span>•</span>
            <span className="flex items-center gap-1">{icon} {iv.meetingType}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <button className="btn btn-outline btn-sm" onClick={() => onEdit(iv)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete((iv.id || iv._id) as string)}>Del</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */

interface InterviewsProps {
  notify: (msg: string, type?: "success" | "error") => void;
}

export default function Interviews({ notify }: InterviewsProps) {
  const { user } = useUser() as { user: User | null };
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Interview | "new" | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get<Interview[]>("/api/interviews"), api.get<Candidate[]>("/api/candidates")])
      .then(([iv, c]) => {
        setInterviews(norm(iv));
        setCandidates(norm(c));
      })
      .catch((e) => notify(e.message, "error"))
      .finally(() => setLoading(false));
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form: Interview, id: string | null) => {
    try {
      if (id) {
        await api.put(`/api/interviews/${id}`, form);
        notify("Interview updated");
      } else {
        await api.post("/api/interviews", form);
        notify("Interview scheduled");
      }
      load();
    } catch (e: any) { notify(e.message || "Error", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this interview?")) return;
    try {
      await api.delete(`/api/interviews/${id}`);
      notify("Removed");
      load();
    } catch (e: any) { notify(e.message, "error"); }
  };

  const filtered = interviews.filter(iv => {
    const q = search.toLowerCase();
    return (filter === "All" || iv.status === filter)
      && (!selectedDay || iv.date === selectedDay)
      && (!q || iv.candidateName?.toLowerCase().includes(q) || iv.jobTitle?.toLowerCase().includes(q));
  }).sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Interviews</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setModal("new")}>
            <Plus size={16} /> Schedule
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"><SearchIcon size={14} /></span>
          <input className="search-input pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(iv => (
            <InterviewCard key={iv.id || iv._id} iv={iv} onEdit={setModal} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {modal && (
        <ScheduleModal
          interview={modal === "new" ? null : modal}
          candidates={candidates}
          user={user}
          onClose={() => setModal(null)}
          onSave={handleSave}
          notify={notify}
        />
      )}
    </div>
  );
}