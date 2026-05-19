"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, Save, Eye, EyeOff, Lock, Bell, Shield, CheckCircle,
  Building2, Briefcase, Phone, User as UserIcon 
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/UI/LoadingSpinner";
import { useUser } from "@/context/userContext";

const TABS = ["Profile", "Security", "Notifications"] as const;
type Tab = (typeof TABS)[number];

// Reusable Styles
const inputCls = "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all";
const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5";

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className={labelCls}>{label} {required && <span className="text-red-500">*</span>}</label>
    {children}
  </div>
);

export default function RecruiterSettingPage() {
  const { user, userProfile } = useUser(); // userProfile acts as the refresh function
  
  const [activeTab, setActiveTab] = useState<Tab>("Profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [form, setForm] = useState({
    Name: "",
    jobTitle: "",
    company: "",
   
    bio: "",
  });

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [notifs, setNotifs] = useState({ newApplication: true, interviewReminder: true, candidateMessage: true });

  // Sync context user data to local form on load
  useEffect(() => {
    const fetchRecruiterDetails = async () => {
      try {
        const res = await fetch("/api/recruiter/setting");
        const data = await res.json();
        
        setForm({
          Name: user?.Name || "",
          jobTitle: data.jobTitle || "",
          company: data.company || "",
         
          bio: data.bio || "",
        });
      } catch (err) {
        toast.error("Failed to load recruiter  settings");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchRecruiterDetails();
  }, [user]);

  // Handle Image Upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setUploading(true);
      try {
        const res = await fetch("/api/auth/bx/user-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: base64 }),
        });
        if (!res.ok) throw new Error();
        
        await userProfile(); // Refresh Global Context
        toast.success("Profile photo updated!");
      } catch (err) {
        toast.error("Upload failed");
      } finally {
        setUploading(false);
      }
    };
  };

  // Handle Full Profile Save
  const handleSave = async () => {
    if (!form.Name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/auth/bx/user-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.Name }),
        }),
        fetch("/api/recruiter/setting", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: form.jobTitle,
            company: form.company,
         
            bio: form.bio,
          }),
        }),
      ]);

      await userProfile(); // Refresh Global Context to update Name everywhere
      toast.success("Settings saved");
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><LoadingSpinner /></div>;

  const initials = user?.Name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-sm text-gray-500">Manage your recruitment profile and security</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === tab ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-white shadow-sm" : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Profile" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          {/* Avatar Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden border-2 border-indigo-50 dark:border-gray-800">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  initials
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <Camera size={14} className="text-indigo-600" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{user?.Name}</h3>
              <p className="text-xs text-gray-500">{user?.role} • {user?.recruiterProfile?.company || "No Company"}</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <input value={form.Name} onChange={e => setForm({...form, Name: e.target.value})} className={inputCls} />
              </Field>
              <Field label="Job Title">
                <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} className={inputCls} />
              </Field>
              <Field label="Company Name">
                <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className={inputCls} />
              </Field>
             
              <div className="md:col-span-2">
                <Field label="Bio">
                  <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} className={`${inputCls} resize-none`} />
                </Field>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Security" && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 pb-4">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg"><Lock className="text-indigo-600" size={20} /></div>
            <h2 className="font-bold text-gray-900 dark:text-white">Security & Password</h2>
          </div>
          <div className="max-w-md space-y-4">
            {(["current", "next", "confirm"] as const).map((key) => (
              <Field key={key} label={key === "current" ? "Current Password" : key === "next" ? "New Password" : "Confirm Password"}>
                <div className="relative">
                  <input
                    type={showPw[key] ? "text" : "password"}
                    value={pwForm[key]}
                    onChange={(e) => setPwForm({...pwForm, [key]: e.target.value})}
                    className={inputCls}
                    placeholder="••••••••"
                  />
                  <button onClick={() => setShowPw({...showPw, [key]: !showPw[key]})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            ))}
            <button className="px-6 py-2.5 bg-gray-900 dark:bg-white dark:text-black text-white rounded-xl font-bold text-sm">
              Update Password
            </button>
          </div>
        </div>
      )}

      {activeTab === "Notifications" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800 animate-in fade-in slide-in-from-bottom-3 duration-500">
          {Object.entries(notifs).map(([key, val]) => (
            <div key={key} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                <p className="text-xs text-gray-500">Receive email alerts for this activity</p>
              </div>
              <button
                onClick={() => setNotifs({...notifs, [key]: !val})}
                className={`w-12 h-6 rounded-full transition-all relative ${val ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-700"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${val ? "left-7" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}