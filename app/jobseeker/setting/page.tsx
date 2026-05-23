"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera, Save, Eye, EyeOff, User as UserIcon,
  FileText, Target, Bell, Shield, Check, Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/UI/LoadingSpinner";
import { useUser } from "@/context/userContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "Profile" | "Preferences" | "Notifications" | "Security";

type RemotePreference = "remote" | "hybrid" | "onsite";

interface ProfileForm {
  name:             string;
  headline:         string;
  seekerBio:        string;
}

interface PreferencesForm {
  openToWork:       boolean;
  remotePreference: RemotePreference;
}

interface NotifSettings {
  jobAlerts:        boolean;
  applicationUpdate:boolean;
  recruiterMessage: boolean;
}

interface PasswordForm {
  current: string;
  next:    string;
  confirm: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: Tab[] = ["Profile", "Preferences", "Notifications"];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  Profile:       <UserIcon size={16} />,
  Preferences:   <Target   size={16} />,
  Notifications: <Bell     size={16} />,
  Security:      <Lock     size={16} />,
};

const REMOTE_OPTIONS: { value: RemotePreference; label: string }[] = [
  { value: "remote", label: "Remote"  },
  { value: "hybrid", label: "Hybrid"  },
  { value: "onsite", label: "On-site" },
];

const NOTIF_LABELS: Record<keyof NotifSettings, { title: string; desc: string }> = {
  jobAlerts:         { title: "Job alerts",          desc: "New jobs matching your preferences"         },
  applicationUpdate: { title: "Application updates", desc: "Status changes on your applications"        },
  recruiterMessage:  { title: "Recruiter messages",  desc: "A recruiter reaches out to you directly"    },
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 " +
  "dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 " +
  "focus:ring-indigo-500 text-gray-900 dark:text-white transition-all placeholder:text-gray-400";

const labelCls =
  "block text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5";

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

export default function JobSeekerSettingPage() {
  const { user, userProfile } = useUser();

  const [activeTab, setActiveTab]   = useState<Tab>("Profile");
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [pwSaving, setPwSaving]     = useState(false);
  const [uploading, setUploading]   = useState(false);
 

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Form state ──
  const [profile, setProfile] = useState<ProfileForm>({
    name: "", headline: "", seekerBio: "",
  });

  const [prefs, setPrefs] = useState<PreferencesForm>({
    openToWork: true, remotePreference: "remote",
  });

  const [notifs, setNotifs] = useState<NotifSettings>({
    jobAlerts: true, applicationUpdate: true, recruiterMessage: true,
  });

  const [pwForm, setPwForm] = useState<PasswordForm>({
    current: "", next: "", confirm: "",
  });

  // const [showPw, setShowPw] = useState<Record<keyof PasswordForm, boolean>>({
  //   current: false, next: false, confirm: false,
  // });

  // ── Load settings ──
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const res = await fetch("/api/jobseeker/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();

        setProfile({
          name:      data.Name      ?? user.Name ?? "",
          headline:  data.headline  ?? "",
          seekerBio: data.seekerBio ?? "",
        });
        setPrefs({
          openToWork:       data.openToWork       ?? true,
          remotePreference: data.remotePreference ?? "remote",
        });
      } catch {
        toast.error("Could not load settings");
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
        if (!res.ok) throw new Error();
        await userProfile();
        toast.success("Profile photo updated!");
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
  };

  // ── Save profile + preferences ──
  const handleSave = async () => {
    if (!profile.name.trim()) {
      toast.error("Full name is required");
      return;
    }

    setSaving(true);
    try {
      const [profileRes, settingsRes] = await Promise.all([
        fetch("/api/auth/bx/user-profile", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ name: profile.name.trim() }),
        }),
        fetch("/api/jobseeker/settings", {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            headline:         profile.headline.trim(),
            seekerBio:        profile.seekerBio.trim(),
            openToWork:       prefs.openToWork,
            remotePreference: prefs.remotePreference,
          }),
        }),
      ]);

      if (!profileRes.ok || !settingsRes.ok) throw new Error("Save failed");

      await userProfile();
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ──
  const handleChangePassword = async () => {
    if (!pwForm.current)               { toast.error("Enter your current password"); return; }
    if (pwForm.next.length < 8)        { toast.error("New password must be at least 8 characters"); return; }
    if (pwForm.next !== pwForm.confirm) { toast.error("Passwords do not match"); return; }

    setPwSaving(true);
    try {
      const res = await fetch("/api/auth/bx/change-password", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          currentPassword: pwForm.current,
          newPassword:     pwForm.next,
        }),
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
          Manage your job seeker profile, preferences, and security
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {TAB_ICONS[tab]}
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
                <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
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
                  {profile.headline && ` · ${profile.headline}`}
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
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className={inputCls}
                  placeholder="Jane Smith"
                />
              </Field>

              <Field label="Professional Headline">
                <input
                  value={profile.headline}
                  onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Frontend Developer · React"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Bio">
                  <textarea
                    value={profile.seekerBio}
                    onChange={(e) => setProfile({ ...profile, seekerBio: e.target.value })}
                    rows={4}
                    className={`${inputCls} resize-none`}
                    placeholder="Tell recruiters a bit about yourself…"
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSave}
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
          PREFERENCES TAB
      ════════════════════════════════════════ */}
      {activeTab === "Preferences" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* Open to work banner */}
          <div
            className={`p-5 rounded-2xl border transition-colors ${
              prefs.openToWork
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-700/30"
                : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-sm font-semibold ${prefs.openToWork ? "text-emerald-800 dark:text-emerald-300" : "text-gray-700 dark:text-gray-300"}`}>
                  Open to new opportunities
                </p>
                <p className={`text-xs mt-0.5 ${prefs.openToWork ? "text-emerald-600 dark:text-emerald-400/80" : "text-gray-500"}`}>
                  Let recruiters find your profile in candidate searches
                </p>
              </div>

              <button
                role="switch"
                aria-checked={prefs.openToWork}
                onClick={() => setPrefs({ ...prefs, openToWork: !prefs.openToWork })}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  prefs.openToWork ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                    prefs.openToWork ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Work style */}
          <SectionCard>
            <p className={labelCls}>Preferred Work Style</p>
            <div className="grid grid-cols-3 gap-3">
              {REMOTE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setPrefs({ ...prefs, remotePreference: value })}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all border cursor-pointer ${
                    prefs.remotePreference === value
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-transparent border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSave}
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

      {/* ════════════════════════════════════════
          SECURITY TAB
      ════════════════════════════════════════ */}
      {/* {activeTab === "Security" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <SectionCard>
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                <Lock size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Change Password</h2>
                <p className="text-xs text-gray-500 mt-0.5">Use a strong, unique password for your account</p>
              </div>
            </div>

            <div className="space-y-4 max-w-sm">
              {(["current", "next", "confirm"] as const).map((key) => (
                <Field
                  key={key}
                  label={
                    key === "current" ? "Current Password"
                    : key === "next"  ? "New Password"
                    :                   "Confirm New Password"
                  }
                >
                  <div className="relative">
                    <input
                      type={showPw[key] ? "text" : "password"}
                      value={pwForm[key]}
                      onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                      className={`${inputCls} pr-10`}
                      placeholder="••••••••"
                      autoComplete={key === "current" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw({ ...showPw, [key]: !showPw[key] })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      aria-label={showPw[key] ? "Hide password" : "Show password"}
                    >
                      {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>
              ))}

              <button
                onClick={handleChangePassword}
                disabled={pwSaving}
                className="px-6 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-60 transition-all cursor-pointer"
              >
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </SectionCard>
        </div>
      )} */}
    </div>
  );
}