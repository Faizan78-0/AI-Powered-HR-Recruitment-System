"use client";
import {  useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import Input from "@/components/UI/Input";
import { useAuthStore } from "@/Authstore/store";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";


export default function login()  {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error } = useAuthStore();
 
const router =useRouter();

  const handleLogin = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    // validation
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/;
    if (password.length < 8 || !passwordRegex.test(password)) {
      toast.error(
        "Password must be at least 8 characters long, include upper, lower & special characters."
      );
      return;
    }

    try {
      const user = await login(email, password);
      toast.success("Login successful!");
     
      router.push("/recruiter/dashboard");
      setEmail("");
      setPassword("");
    } catch (error) {
     
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-500 via-gray-500 to-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Heading */}
        <div className="px-6 pt-8 text-center">
          <h2 className="text-3xl font-bold bg-linear-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
            Welcome Back
          </h2>
          <p className="mt-2 text-gray-300 text-sm">
            Sign in to continue to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-6 py-8 flex flex-col gap-5">
          <Input
            icon={Mail}
            type="email"
            placeholder="Email Address "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative">
            <Input
              icon={Lock}
              type={showPassword ? "text" : "password"}
              placeholder="Password "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/3 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex justify-between items-center text-sm">
            <Link
              href="./forgotPassword"
              className="text-green-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium text-center">
              {error}
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200 cursor-pointer"
          >
            {isLoading ? (
              <Loader className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              "Log In"
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 text-center border-t border-white/10">
          <p className="text-sm text-gray-400">
            Don’t have an account?{" "}
            <Link href="./signup" className="text-green-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
