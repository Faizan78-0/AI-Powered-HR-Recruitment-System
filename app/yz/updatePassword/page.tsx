"use client";

import { useState, FormEvent, ChangeEvent, Suspense } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/Authstore/store";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/UI/Input";
import { Lock, Loader, EyeOff, Eye } from "lucide-react";
import toast from "react-hot-toast";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { updatePassword, error, isLoading, message } = useAuthStore() as any;

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (!token) {
      return toast.error("Invalid or missing reset token");
    }

    try {
      await updatePassword(token, password);
      toast.success("Password updated successfully!");

      setTimeout(() => router.push("./login"), 2000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6 text-center bg-linear-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
        Set New Password
      </h2>

      {error && (
        <p className="text-red-500 text-sm mb-4 text-center font-semibold">
          {error}
        </p>
      )}

      {message && (
        <p className="text-green-400 text-sm mb-4 text-center font-semibold">
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <Input
            icon={Lock}
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-green-400 cursor-pointer"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative">
          <Input
            icon={Lock}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setConfirmPassword(e.target.value)
            }
            required
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-green-400 cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={isLoading || !token}
          className="w-full py-3 bg-linear-to-r from-green-500 to-emerald-600 
          text-white font-bold rounded-xl shadow-lg 
          hover:from-green-600 hover:to-emerald-700 transition 
          disabled:opacity-50 flex justify-center items-center cursor-pointer"
        >
          {isLoading ? <Loader className="animate-spin" /> : "Set New Password"}
        </motion.button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-gray-900 via-black to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl 
        rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
      >
        <Suspense
          fallback={
            <div className="p-8 text-center text-white">
              <Loader className="animate-spin mx-auto" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
