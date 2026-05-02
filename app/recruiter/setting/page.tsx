"use client";
import { useState, useEffect, useRef } from "react";
import { User, Palette, Camera, Loader2, CheckCircle, Moon, Sun, UploadCloud } from "lucide-react";

export default function RecruiterSettings() {
  const [activeTab, setActiveTab] = useState("account");
  const [darkMode, setDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    Name: "",
    imageUrl: "",
    companyName: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // 1. Fetch initial data
  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch("/api/recruiter/setting");
      if (res.ok) {
        const data = await res.json();
        setFormData({
          Name: data.Name || "",
          imageUrl: data.imageUrl || "",
          companyName: data.companyName || "",
        });
      }
    }
    fetchProfile();
  }, []);

  // 2. Handle Image Upload (Preview logic)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to Cloudinary/S3 here
      // For now, we create a local preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch("/api/recruiter/setting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-slate-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-5xl mx-auto p-4 md:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className={darkMode ? "text-slate-400" : "text-gray-500"}>Manage your recruiter profile and UI preferences.</p>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 space-y-2">
            <button
              onClick={() => setActiveTab("account")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "account" 
                ? (darkMode ? "bg-blue-600 text-white" : "bg-white shadow-sm text-blue-600 border border-gray-200") 
                : (darkMode ? "text-slate-400 hover:bg-slate-900" : "text-gray-600 hover:bg-gray-100")
              }`}
            >
              <User size={18} /> Account
            </button>
            <button
              onClick={() => setActiveTab("appearance")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "appearance" 
                ? (darkMode ? "bg-blue-600 text-white" : "bg-white shadow-sm text-blue-600 border border-gray-200") 
                : (darkMode ? "text-slate-400 hover:bg-slate-900" : "text-gray-600 hover:bg-gray-100")
              }`}
            >
              <Palette size={18} /> Appearance
            </button>
          </aside>

          {/* Main Content */}
          <main className={`flex-1 border rounded-2xl shadow-sm overflow-hidden transition-colors ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              
              {activeTab === "account" ? (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold">Profile Information</h2>
                    <p className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-500"}`}>Click the avatar to upload a new photo.</p>
                  </div>

                  <div className={`flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border-2 border-dashed ${darkMode ? "bg-slate-950/50 border-slate-700" : "bg-gray-50 border-gray-200"}`}>
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <img
                        src={formData.imageUrl || "https://ui-avatars.com/api/?name=User"}
                        alt="Profile"
                        className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-500/20"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold">
                        <Camera size={24} className="mb-1" />
                        CHANGE
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        className="hidden" 
                        accept="image/*" 
                      />
                    </div>
                    
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex items-center gap-2 text-blue-500 text-sm font-semibold">
                        <UploadCloud size={16} />
                        Quick Update
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste an Image URL here..."
                        className={`w-full text-sm p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border border-gray-200 text-gray-900"}`}
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Full Name</label>
                      <input
                        type="text"
                        className={`w-full p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border border-gray-200"}`}
                        value={formData.Name}
                        onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Company Name</label>
                      <input
                        type="text"
                        className={`w-full p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border border-gray-200"}`}
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>
                  </div>
                </section>
              ) : (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold">Appearance</h2>
                    <p className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-500"}`}>Toggle between light and dark themes.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setDarkMode(false)}
                      className={`p-4 rounded-2xl cursor-pointer border-2 transition-all ${!darkMode ? "border-blue-500 bg-blue-50/50" : "border-slate-800 bg-slate-950"}`}
                    >
                      <div className="flex items-center gap-3 mb-3 font-bold">
                        <Sun className="text-orange-500" /> Light
                      </div>
                      <div className="h-20 bg-white rounded-lg border border-gray-200 shadow-sm"></div>
                    </div>

                    <div 
                      onClick={() => setDarkMode(true)}
                      className={`p-4 rounded-2xl cursor-pointer border-2 transition-all ${darkMode ? "border-blue-500 bg-blue-900/20" : "border-gray-200 bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-3 mb-3 font-bold">
                        <Moon className="text-blue-400" /> Dark
                      </div>
                      <div className="h-20 bg-slate-900 rounded-lg border border-slate-700 shadow-sm"></div>
                    </div>
                  </div>
                </section>
              )}

              {/* Save Footer */}
              <div className={`pt-6 border-t flex items-center justify-between ${darkMode ? "border-slate-800" : "border-gray-100"}`}>
                <div className="flex items-center gap-2 text-green-500 transition-opacity" style={{ opacity: saved ? 1 : 0 }}>
                  <CheckCircle size={18} />
                  <span className="text-sm font-bold">Updated!</span>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:bg-gray-500 transition-all active:scale-95"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}