"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, FormEvent } from "react";
import {
  Loader,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Briefcase,
  UserCircle,
  Sparkles,
  ArrowLeft,
  ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/UI/Input";
import PasswordStrengthMeter from "@/components/UI/PasswordStrengthMeter";
import { useAuthStore } from "@/Authstore/store";
import Profile from "@/components/UI/profile";
import toast from "react-hot-toast";

const roles = [
  {
    key: "Recruiter",
    title: "Recruiter",
    desc: "Hire smarter & faster",
    icon: Briefcase,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "hover:border-green-400",
    activeBorder: "border-green-400 bg-green-500/20"
  },
  {
    key: "Job Seeker",
    title: "Job Seeker",
    desc: "Find your dream job",
    icon: UserCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "hover:border-emerald-400",
    activeBorder: "border-emerald-400 bg-emerald-500/20"
  },
] as const;

type RoleType = (typeof roles)[number]["key"];

export default function SignUp() {
  const router = useRouter();
  const { signup, isLoading, uploadImage } = useAuthStore();

  // --- STEP LOGIC ---
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<RoleType>("Recruiter");
  
  // --- FORM STATE ---
  const [Name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

  const handleRoleSelect = (selectedRole: RoleType) => {
    setRole(selectedRole);
    setStep("details");
  };

  const validateForm = () => {
    if (!Name.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all required fields.");
      return false;
    }
    if (Name.trim().length < 3) {
      toast.error("Name must be at least 3 characters.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Enter a valid email address.");
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let imageUrl = "";
      if (profilePicFile) {
        const res = await uploadImage(profilePicFile);
        if (res?.imageUrl) imageUrl = res.imageUrl;
      }

      await signup(email, password, Name, imageUrl, role);
      toast.success("Account created!");
      router.push(`./verifyEmail`);
    } catch (err: any) {
      toast.error(err?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#020617] text-white overflow-hidden relative">
      {/* BACKGROUND GRADIENTS */}
      <div className="absolute top-0 left-1/4 w-125 h-125 bg-green-500/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-125 h-125 bg-emerald-500/20 blur-[140px] pointer-events-none" />

      {/* LEFT SIDE (HERO) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center px-20 z-10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <ZapIcon className="text-green-400" />
            <h1 className="text-2xl font-bold">HR_RECRUITER</h1>
          </div>
          <h2 className="text-6xl font-extrabold leading-tight mb-6">
            {role === "Job Seeker" ? "Step into your future career." : "Build your dream team."}
          </h2>
          <p className="text-slate-400 text-lg max-w-md">
            Experience a new era of hiring powered by AI precision and speed.
          </p>
        </motion.div>
      </div>

      {/* RIGHT SIDE (FORM CARD) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 z-10">
        <motion.div
          layout
          className="w-full max-w-md p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(0,255,150,0.15)]"
        >
          <AnimatePresence mode="wait">
            {step === "role" ? (
              <motion.div
                key="role-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="mb-8 text-center">
                  <h2 className="text-3xl font-bold">I am joining as a...</h2>
                  <p className="text-slate-400 text-sm mt-2">Select your role to continue</p>
                </div>

                <div className="flex flex-col gap-4">
                  {roles.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => handleRoleSelect(r.key)}
                      className={`group relative flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        role === r.key ? r.activeBorder : `bg-white/5 border-white/10 ${r.border}`
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-xl ${r.bg} flex items-center justify-center transition-colors`}>
                        <r.icon className={r.color} size={28} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-lg">{r.title}</h3>
                        <p className="text-slate-400 text-xs">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                
                <p className="text-center text-sm text-slate-400 mt-8">
                  Already have an account? <Link href="./login" className="text-green-400 font-semibold hover:underline">Login</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="details-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button 
                  onClick={() => setStep("role")}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm cursor-pointer"
                >
                  <ArrowLeft size={16} /> Change role
                </button>

                <div className="mb-6">
                  <h2 className="text-3xl font-bold">Complete profile</h2>
                  <div className="inline-block mt-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                    {role} Account
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex justify-center mb-2">
                    <Profile
                      imagePreview={profilePicPreview}
                      setImagePreview={setProfilePicPreview}
                      setImageFile={setProfilePicFile}
                    />
                  </div>

                  <Input icon={User} type="text" placeholder="Full Name" value={Name} onChange={(e) => setName(e.target.value)} />
                  <Input icon={Mail} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />

                  {role === "Recruiter" ? (
                    <Input icon={Briefcase} type="text" placeholder="Company Name" value={company} onChange={(e) => setCompany(e.target.value)} />
                  ) : (
                    <Input icon={User} type="text" placeholder="Profession (e.g. Designer)" value={title} onChange={(e) => setTitle(e.target.value)} />
                  )}

                  <div className="relative">
                    <Input icon={Lock} type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-green-400 cursor-pointer">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <PasswordStrengthMeter password={password} />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-xl font-bold bg-linear-to-r from-green-500 to-emerald-500 hover:opacity-90 transition flex justify-center items-center cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? <Loader className="animate-spin" /> : "Create Account"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}