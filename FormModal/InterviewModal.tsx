"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Interview {
  _id?: string;
  candidateName: string;
  role: string;
  date: string;
  time: string;
  type: "video" | "phone" | "in-person";
  status: "scheduled" | "completed" | "cancelled" | "pending";
  notes?: string;
}

interface Props {
  isOpen: boolean;
  initialData?: Interview | null;
  onClose: () => void;
  onSave: (data: Interview) => Promise<void>;
}

const INITIAL_STATE: Interview = {
  candidateName: "",
  role: "",
  date: "",
  time: "",
  type: "video",
  status: "scheduled",
  notes: "",
};

export default function InterviewModal({ isOpen, initialData, onClose, onSave }: Props) {
  const [form, setForm] = useState<Interview>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fix: Ensure form resets to initial state when creating new, or fills when editing
  useEffect(() => {
    if (isOpen) {
      setForm(initialData || INITIAL_STATE);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidateName || !form.role) return;
    
    setIsSubmitting(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = "w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Update Interview' : 'Schedule Interview'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Candidate Name</label>
            <input
              required
              value={form.candidateName}
              onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
              placeholder="e.g. Sarah Johnson"
              className={inputStyle}
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Role</label>
            <input
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. Senior Frontend Dev"
              className={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date</label>
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Time</label>
              <input
                required
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Interview Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className={inputStyle}
            >
              <option value="video">🎥 Video Call</option>
              <option value="phone">📞 Phone Call</option>
              <option value="in-person">🏢 In Person</option>
            </select>
          </div>

          {initialData && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Interview feedback..."
                rows={3}
                className={`${inputStyle} resize-none`}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:bg-indigo-400 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : (initialData ? "Update Details" : "Schedule Now")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}