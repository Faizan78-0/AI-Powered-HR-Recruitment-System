"use client";

import { motion } from "framer-motion";
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
    key: "Job Seeker",
    title: "Job Seeker",
    desc: "Find your dream job",
    icon: UserCircle,
  },
  {
    key: "Recruiter",
    title: "Recruiter",
    desc: "Hire smarter & faster",
    icon: Briefcase,
  },
] as const;

type RoleType = (typeof roles)[number]["key"];

export default function SignUp() {
  const router = useRouter();
  const { signup, isLoading, uploadImage } = useAuthStore();

  const [role, setRole] = useState<RoleType>("Recruiter");
  const [Name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/;
    if (password.length < 8 || !passwordRegex.test(password)) {
      toast.error("Password needs 8+ chars, uppercase, lowercase & a symbol.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let imageUrl = "";

      // 1. Handle Image Upload
      if (profilePicFile) {
        const res = await uploadImage(profilePicFile);
        if (res?.imageUrl) {
          imageUrl = res.imageUrl;
        } else {
          throw new Error("Image upload failed.");
        }
      }

      // 2. Execute Signup
      await signup(email, password, Name, imageUrl, role);
      
      toast.success("Account created!");

      // 3. Logic-Based Routing
      // We route to verifyEmail first. 
      // We can pass the role in the URL so the verification page knows where to send them next.
      const targetDashboard = role === "Recruiter" ? "recruiter" : "jobseeker";
      
      // Use absolute path starting with / to avoid relative pathing issues
      router.push(`./verifyEmail`);

    } catch (err: any) {
      toast.error(err?.message || "Registration failed");
      console.error("Signup Error:", err);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#020617] text-white overflow-hidden relative">
      {/* BACKGROUND GRADIENTS */}
      <div className="absolute top-0 left-1/4 w-125 h-125 bg-green-500/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-125 h-125 bg-emerald-500/20 blur-[140px] pointer-events-none" />

      {/* LEFT SIDE (HERO) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center px-20 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="text-green-400" />
            <h1 className="text-2xl font-bold">HirePulse</h1>
          </div>

          <h2 className="text-6xl font-extrabold leading-tight mb-6 cursor-pointer">
            {role === "Job Seeker"
              ? "Step into your future career."
              : "Build your dream team."}
          </h2>

          <p className="text-slate-400 text-lg max-w-md">
            Experience a new era of hiring powered by AI precision and speed.
          </p>
        </motion.div>
      </div>

      {/* RIGHT SIDE (FORM CARD) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(0,255,150,0.15)]"
        >
          <div className="mb-6">
            <h2 className="text-3xl font-bold">Create account</h2>
            <p className="text-slate-400 text-sm">Join the future of hiring</p>
          </div>

          {/* ROLE SELECTOR */}
          <div className="flex gap-3 mb-6 ">
            {roles.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className={`flex-1 p-3 rounded-xl border text-left transition ${
                  role === r.key
                    ? "bg-green-500/20 border-green-400 cursor-pointer"
                    : "bg-white/5 border-white/10 hover:border-green-400"
                }`}
              >
                <r.icon className="mb-1 text-green-400" size={18} />
                <p className="text-sm font-semibold">{r.title}</p>
                <p className="text-xs text-slate-400">{r.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center">
              <Profile
                imagePreview={profilePicPreview}
                setImagePreview={setProfilePicPreview}
                setImageFile={setProfilePicFile}
              />
            </div>

            <Input
              icon={User}
              type="text"
              placeholder="Full Name"
              value={Name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              icon={Mail}
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {role === "Recruiter" ? (
              <Input
                icon={Briefcase}
                type="text"
                placeholder="Company Name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            ) : (
              <Input
                icon={User}
                type="text"
                placeholder="Your Profession (e.g. Designer)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            )}

            <div className="relative">
              <Input
                icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-green-400 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <PasswordStrengthMeter password={password} />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold bg-linear-to-r from-green-500 to-emerald-500 hover:opacity-90 transition flex justify-center items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader className="animate-spin" /> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-green-400 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}