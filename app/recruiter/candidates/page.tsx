"use client";
import React, { useState, useEffect } from "react";
import { Candidate, Job, CandidateStatus } from "@/types/index";
import { CandidateModal } from "@/FormModal/canidate.modal";

const STATUS_COLORS: Record<CandidateStatus, string> = {
  Applied: "bg-amber-100 text-amber-700",
  Screening: "bg-blue-100 text-blue-700",
  Interview: "bg-purple-100 text-purple-700",
  Offer: "bg-teal-100 text-teal-700",
  Hired: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Initial Fetch (Simulated)
  useEffect(() => {
    // Replace with your fetch("/api/candidates")
    const mockJobs = [{ id: "1", title: "Frontend Developer" }, { id: "2", title: "Product Manager" }];
    // setJobs(mockJobs);
  }, []);

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data: Partial<Candidate>, id?: string) => {
    if (id) {
      // API PUT Logic
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...data } as Candidate : c));
    } else {
      // API POST Logic
      const newCandidate = { ...data, id: Math.random().toString(), appliedDate: "Today" } as Candidate;
      setCandidates(prev => [newCandidate, ...prev]);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this candidate?")) {
      setCandidates(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto dark:bg-slate-950 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold">Candidates</h1>
          <p className="text-slate-500">{candidates.length} total applications</p>
        </div>
        <button 
          onClick={() => { setSelectedCandidate(null); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold"
        >
          + Add Candidate
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
          <input 
            className="w-full pl-10 pr-4 py-2 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500">
              <th className="p-4">Candidate</th>
              <th className="p-4">Applied For</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {filteredCandidates.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-4">
                  <div className="font-bold">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.email}</div>
                </td>
                <td className="p-4 text-sm">{c.jobTitle}</td>
                <td className="p-4">
                  <div className="text-amber-500">
                    {"★".repeat(c.rating)}{"☆".repeat(5 - c.rating)}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <button 
                    onClick={() => { setSelectedCandidate(c); setIsModalOpen(true); }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Review
                  </button>
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCandidates.length === 0 && (
          <div className="p-20 text-center text-slate-500">No candidates found.</div>
        )}
      </div>

      {isModalOpen && (
        <CandidateModal 
          candidate={selectedCandidate} 
          jobs={jobs} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave}
        />
      )}
    </div>
  );
}