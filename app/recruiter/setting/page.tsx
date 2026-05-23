"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Camera, Save, Eye, EyeOff, Lock, Bell, Shield, CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/UI/LoadingSpinner";
import { useUser } from "@/context/userContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "Profile" | "Notifications";

interface ProfileForm {
  name: string;
  jobTitle: string;
  company: string;
  bio: string;
}

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

interface NotifSettings {
  newApplication: boolean;
  interviewReminder: boolean;
  candidateMessage: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: Tab[] = ["Profile", "Notifications"];

const NOTIF_LABELS: Record<keyof NotifSettings, { title: string; desc: string }> = {
  newApplication:   { title: "New application",    desc: "Someone applies to one of your job posts" },
  interviewReminder:{ title: "Interview reminder",  desc: "Upcoming scheduled interviews" },
  candidateMessage: { title: "Candidate message",   desc: "A candidate sends you a direct message" },
};

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 " +
  "dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 " +
  "focus:ring-indigo-500 text-gray-900 dark:text-white transition-all placeholder:text-gray-400";

const labelCls =
  "block text-[11px] font-semibold uppercase tracking-widest text-gray-400 " +
  "dark:text-gray-500 mb-1.5";

// ─── Sub-components ───────────────────────────────────────────────────────────

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <label className={labelCls}>
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RecruiterSettingPage() {
  const { user, userProfile } = useUser();

  const [activeTab, setActiveTab] = useState<Tab>("Profile");
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pwSaving, setPwSaving]   = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Form state ──
  const [form, setForm] = useState<ProfileForm>({
    name: "", jobTitle: "", company: "", bio: "",
  });

  const [pwForm, setPwForm] = useState<PasswordForm>({
    current: "", next: "", confirm: "",
  });

  const [showPw, setShowPw] = useState<Record<keyof PasswordForm, boolean>>({
    current: false, next: false, confirm: false,
  });

  const [notifs, setNotifs] = useState<NotifSettings>({
    newApplication: true, interviewReminder: true, candidateMessage: true,
  });

  // ── Load recruiter profile ──
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const res  = await fetch("/api/recruiter/setting");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();

        setForm({
          name:     user.Name     ?? "",
          jobTitle: data.jobTitle ?? "",
          company:  data.company  ?? "",
          bio:      data.bio      ?? "",
        });
      } catch {
        toast.error("Could not load recruiter settings");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // ── Avatar upload ──
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
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ avatar: base64 }),
        });
        if (!res.ok) throw new Error("Upload failed");
        await userProfile();
        toast.success("Profile photo updated!");
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
        // Reset input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
  };

  // ── Save profile ──
  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      toast.error("Full name is required");
      return;
    }

    setSaving(true);
    try {
      const [nameRes, settingsRes] = await Promise.all([
        fetch("/api/auth/bx/user-profile", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ name: form.name.trim() }),
        }),
        fetch("/api/recruiter/setting", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            jobTitle: form.jobTitle.trim(),
            company:  form.company.trim(),
            bio:      form.bio.trim(),
          }),
        }),
      ]);

      if (!nameRes.ok || !settingsRes.ok) throw new Error("Save failed");

      await userProfile();
      toast.success("Profile saved successfully");
    } catch {
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ──
  const handleChangePassword = async () => {
    if (!pwForm.current)              { toast.error("Enter your current password"); return; }
    if (pwForm.next.length < 8)       { toast.error("New password must be at least 8 characters"); return; }
    if (pwForm.next !== pwForm.confirm){ toast.error("Passwords do not match"); return; }

    setPwSaving(true);
    try {
      const res = await fetch("/api/auth/bx/change-password", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? "Failed");
      }
      toast.success("Password updated successfully");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update password");
    } finally {
      setPwSaving(false);
    }
  };

  // ── Derived ──
  const initials = (user?.Name ?? "??")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your recruiter profile, security, and notification preferences
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          PROFILE TAB
      ════════════════════════════════════════ */}
      {activeTab === "Profile" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* Avatar card */}
          <SectionCard>
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    initials
                  )}

                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  aria-label="Change profile photo"
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow hover:scale-110 transition-transform cursor-pointer disabled:opacity-50"
                >
                  <Camera size={13} className="text-indigo-600 dark:text-indigo-400" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>

              <div>
                <p className="font-bold text-gray-900 dark:text-white">{user?.Name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {user?.role}
                  {form.company && ` · ${form.company}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
              </div>
            </div>
          </SectionCard>

          {/* Profile fields */}
          <SectionCard>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  placeholder="Jane Smith"
                />
              </Field>

              <Field label="Job Title">
                <input
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  className={inputCls}
                  placeholder="Senior Recruiter"
                />
              </Field>

              <Field label="Company">
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className={inputCls}
                  placeholder="Acme Corp"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Bio">
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="A short bio about yourself…"
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Save size={16} />
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </SectionCard>
        </div>
      )}

     

      {/* ════════════════════════════════════════
          NOTIFICATIONS TAB
      ════════════════════════════════════════ */}
      {activeTab === "Notifications" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
            {(Object.keys(notifs) as Array<keyof NotifSettings>).map((key) => (
              <div
                key={key}
                className="flex items-center justify-between px-6 py-5 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {NOTIF_LABELS[key].title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{NOTIF_LABELS[key].desc}</p>
                </div>

                {/* Toggle switch */}
                <button
                  role="switch"
                  aria-checked={notifs[key]}
                  aria-label={`Toggle ${NOTIF_LABELS[key].title}`}
                  onClick={() => setNotifs({ ...notifs, [key]: !notifs[key] })}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    notifs[key] ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                      notifs[key] ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}