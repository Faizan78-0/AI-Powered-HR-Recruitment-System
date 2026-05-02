"use client";
import React, { useState, useEffect } from "react";
import JobModal from "@/FormModal/job.modal";
import { Job, JobInput } from "@/types";
import { Plus, Pencil, Trash2, Search, MapPin, Briefcase } from "lucide-react";
import LoadingSpinner from "@/components/UI/LoadingSpinner";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      // Add cache: 'no-store' to ensure we get fresh data from the DB
      const response = await fetch("/api/recruiter/jobs", {
        cache: "no-store",
      });
      const data = await response.json();

      if (Array.isArray(data)) {
        setJobs(data);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // FIX: Updated to handle both Create (POST) and Edit (PATCH) correctly
  const handleSaveJob = async (data: JobInput) => {
    try {
      // If editing, use the query param ?id=... and method PATCH
      const url = editingJob
        ? `/api/recruiter/jobs?id=${editingJob.id}`
        : "/api/recruiter/jobs";

      const method = editingJob ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchJobs(); // Refresh list to get updated data
        setIsModalOpen(false);
        setEditingJob(null);
      } else {
        alert(result.message || "Something went wrong while saving");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const response = await fetch(`/api/recruiter/jobs?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Optimistic UI update: remove from state immediately
        setJobs((prev) => prev.filter((job) => job.id !== id));
      } else {
        const err = await response.json();
        alert(err.message || "Failed to delete");
      }
    } catch (error) {
      alert("Network error");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto transition-colors duration-300 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Job Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and track your active listings
          </p>
        </div>
        <button
          onClick={() => {
            setEditingJob(null);
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none font-medium cursor-pointer"
        >
          <Plus size={20} /> Create Job
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative mb-8 group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by job title or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
        />
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <LoadingSpinner />
          <p className="text-slate-400 animate-pulse">
            Loading your dashboard...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
              No jobs found.
            </div>
          )}

          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="group p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-900 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${
                      job.status === "Open"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {job.status}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Briefcase size={14} /> {job.type}
                  </span>
                </div>

                <h3 className="text-xl font-bold dark:text-white group-hover:text-indigo-600 transition-colors">
                  {job.title}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-slate-500 dark:text-slate-400 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {job.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {job.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-none pt-4 md:pt-0">
                <button
                  onClick={() => {
                    setEditingJob(job);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors"
                >
                  <Pencil size={18} />
                  <span className="md:hidden lg:inline text-sm font-semibold">
                    Edit
                  </span>
                </button>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <JobModal
        isOpen={isModalOpen}
        initialData={editingJob}
        onClose={() => {
          setIsModalOpen(false);
          setEditingJob(null);
        }}
        onSave={handleSaveJob}
      />
    </div>
  );
}
