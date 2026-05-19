"use client";

import { useState, useEffect } from "react";
import { 
  User, FileText, Target, Bell, Shield, 
  Upload, Check, Save, Trash2, MapPin, 
  Globe, Github, Linkedin, Briefcase, Camera
} from "lucide-react";
import { useUser } from "@/context/userContext"; 
import LoadingSpinner from "@/components/UI/LoadingSpinner";

export default function JobseekerSettingsPage() {
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState("profile");
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/auth/bx/user-profile");
        const data = await res.json();
        
        setSettings({
          ...data,
          profile: {
            ...data.profile,
            Name: user?.Name || data.profile.Name ,
            Role: user?.role,
          }
        });
      } catch (err) {
        console.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/jobseeker/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 3000);
    } catch (err) {
      console.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return (
    <LoadingSpinner/>
  );

  const sections = [
    { id: "profile", label: "Profile", icon: <User size={18} /> },
    { id: "resume", label: "Resume & Skills", icon: <FileText size={18} /> },
    { id: "preferences", label: "Job Preferences", icon: <Target size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "privacy", label: "Privacy", icon: <Shield size={18} /> },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto dark:bg-slate-750 text-slate-600 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Personalize your profile and application preferences.</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Vertical Navigation */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeSection === sec.id
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "text-slate-500 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {sec.icon}
                  {sec.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Card */}
          <main className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-8">
              
              {activeSection === "profile" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {/* Profile Header */}
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-black shadow-lg uppercase">
                        {settings.profile.Name?.substring(0, 2)}
                      </div>
                      <button className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 hover:scale-110 transition">
                        <Camera size={16} className="text-indigo-600" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Display Profile</h3>
                      <p className="text-sm text-slate-500 mb-3">Visible to recruiters and hiring managers.</p>
                    </div>
                  </div>

                  {/* Form Grid */}
                  <div className="grid gap-6">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Full Name</label>
                      <input 
                        value={settings.profile.Name} 
                        onChange={(e) => setSettings({...settings, profile: {...settings.profile, Name: e.target.value}})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Professional Headline</label>
                      <input 
                        value={settings.profile.headline} 
                        onChange={(e) => setSettings({...settings, profile: {...settings.profile, headline: e.target.value}})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        placeholder="e.g. Senior Frontend Developer | UX Enthusiast"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Bio</label>
                      <textarea 
                        rows={4}
                        value={settings.profile.bio} 
                        onChange={(e) => setSettings({...settings, profile: {...settings.profile, bio: e.target.value}})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "preferences" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Open to New Opportunities</h4>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400/70">Let recruiters find your profile in searches.</p>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, preferences: {...settings.preferences, openToWork: !settings.preferences.openToWork}})}
                        className={`w-12 h-6 rounded-full transition-all relative ${settings.preferences.openToWork ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.preferences.openToWork ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 block">Preferred Work Style</label>
                      <div className="flex gap-3">
                        {['remote', 'hybrid', 'onsite'].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setSettings({...settings, preferences: {...settings.preferences, remotePreference: mode}})}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all border ${
                              settings.preferences.remotePreference === mode 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Footer */}
              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {savedStatus && (
                    <p className="flex items-center gap-2 text-emerald-500 text-sm font-bold animate-pulse">
                      <Check size={16} /> All changes saved
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-10 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-xl"
                >
                  {saving ? "Processing..." : <><Save size={18} /> Update Settings</>}
                </button>
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}