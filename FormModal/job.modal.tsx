"use client";

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Job, JobInput, JobStatus, JobType } from '@/types/index';

interface Props {
  isOpen: boolean;
  initialData?: Job | null; // Data passed when editing
  onClose: () => void;
  onSave: (data: JobInput) => Promise<void>;
}

const INITIAL_STATE: JobInput = {
  title: '',
  company: '',
  department: '',
  location: '',
  type: 'Full-time',
  status: 'Draft',
  salary: '',
  description: '',
  requiredSkills: [],
};

export default function JobModal({ isOpen, initialData, onClose, onSave }: Props) {
  const [form, setForm] = useState<JobInput>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form state with initialData when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm(initialData);
      } else {
        setForm(INITIAL_STATE);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save job posting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? 'Edit Job Posting' : 'Create Job Posting'}
            </h2>
            <p className="text-sm text-gray-500">
              {initialData ? 'Update the details of this role.' : 'Fill in the details to reach top talent.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form Body */}
        <form id="job-form" onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 dark:text-slate-800">
          <div className="grid grid-cols-2 gap-6 ">
            <div className="col-span-2">
              <label className={labelClass}>Job Title *</label>
              <input 
                required 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                className={inputClass} 
                placeholder="e.g. Senior Frontend Developer" 
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Company Name *</label>
              <input 
                required
                value={form.company} 
                onChange={e => setForm({...form, company: e.target.value})} 
                className={inputClass} 
                placeholder="e.g. TechCorp Inc." 
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Department</label>
              <select 
                value={form.department} 
                onChange={e => setForm({...form, department: e.target.value})} 
                className={inputClass}
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Location</label>
              <input 
                value={form.location} 
                onChange={e => setForm({...form, location: e.target.value})} 
                className={inputClass} 
                placeholder="Remote / New York" 
              />
            </div>

            <div>
              <label className={labelClass}>Type</label>
              <select 
                value={form.type} 
                onChange={e => setForm({...form, type: e.target.value as JobType})} 
                className={inputClass}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Salary Range</label>
              <input 
                value={form.salary} 
                onChange={e => setForm({...form, salary: e.target.value})} 
                className={inputClass} 
                placeholder="e.g. $120k - $150k" 
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea 
              rows={4} 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
              className={`${inputClass} resize-none`} 
              placeholder="Describe the role..." 
            />
          </div>

          <div>
            <label className={labelClass}>Posting Status</label>
            <div className="flex gap-4">
              {(['Open'] as JobStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({...form, status: s})}
                  className={`px-6 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    form.status === s 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3  ">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-500 cursor-pointer">
            Cancel
          </button>
          <button 
            form="job-form"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl font-bold transition-all min-w-35 justify-center  cursor-pointer"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin  " />
            ) : (
              <>
                <Save size={18}/> 
                <span>{initialData ? 'Update Job' : 'Post Job'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}