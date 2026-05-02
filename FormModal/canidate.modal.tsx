import React, { useState } from "react";
import { Candidate, CandidateStatus, Job } from "@/types/index";

interface ModalProps {
  candidate: Candidate | null;
  jobs: Job[];
  onClose: () => void;
  onSave: (data: Partial<Candidate>, id?: string) => void;
}

const STATUSES: CandidateStatus[] = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];

export const CandidateModal: React.FC<ModalProps> = ({ candidate, jobs, onClose, onSave }) => {
  const isEdit = !!candidate;
  const [form, setForm] = useState<Partial<Candidate>>(
    candidate || { name: "", email: "", status: "Applied", rating: 0, notes: "", jobId: "" }
  );

  const handleSave = () => {
    if (!form.name || !form.email) return alert("Required fields missing");
    onSave(form, candidate?.id);
    onClose();
  };

  const inputClass = "w-full p-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white";
  const labelClass = "block text-xs font-bold mb-1 text-slate-500 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">{isEdit ? "Review Candidate" : "Add Candidate"}</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <div className={isEdit ? "opacity-60" : ""}>
            <label className={labelClass}>Full Name</label>
            <input 
              className={inputClass} 
              value={form.name} 
              readOnly={isEdit} 
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>
          <div className={isEdit ? "opacity-60" : ""}>
            <label className={labelClass}>Email</label>
            <input 
              className={inputClass} 
              value={form.email} 
              readOnly={isEdit} 
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div>
            <label className={labelClass}>Job Assignment</label>
            <select 
              className={inputClass} 
              value={form.jobId} 
              onChange={e => setForm({...form, jobId: e.target.value, jobTitle: jobs.find(j => j.id === e.target.value)?.title})}
            >
              <option value="">Select Job</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select 
              className={inputClass} 
              value={form.status} 
              onChange={e => setForm({...form, status: e.target.value as CandidateStatus})}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Rating (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => setForm({...form, rating: num})}
                  className={`w-10 h-10 rounded-lg border font-bold ${form.rating === num ? 'bg-indigo-600 text-white' : 'bg-transparent'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Internal Notes</label>
            <textarea 
              className={inputClass} 
              rows={3} 
              value={form.notes} 
              onChange={e => setForm({...form, notes: e.target.value})}
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 font-semibold">Cancel</button>
          <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">
            {isEdit ? "Save Changes" : "Create Candidate"}
          </button>
        </div>
      </div>
    </div>
  );
};