"use client";

import { motion } from "framer-motion";
import { useState, FormEvent, ChangeEvent } from "react";
import { useAuthStore } from "@/Authstore/store"; // Adjust path to your store
import Input from "@/components/UI/Input"; // Adjust path to your Input component
import { ArrowLeft, Loader, Mail } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function forgotPassword() {
  const [email, setEmail] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Casting as any for now; ideally, define an interface for your store
  const { isLoading, forgotPassword } = useAuthStore() as any;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      toast.success("Email sent");

      setIsSubmitted(true);
    } catch (error) {
      
      console.error("Forgot password error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-linear-to-br from-gray-900 via-black to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
      >
        {/* Main Content */}
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-6 text-center bg-linear-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
            Forgot Password
          </h2>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-gray-300 mb-6 text-center text-sm sm:text-base">
                Enter your Email address and we’ll send you a link to reset your
                password.
              </p>

              <Input
                icon={Mail}
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                required
              />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 cursor-pointer"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader className="w-6 h-6 animate-spin mx-auto " />
                ) : (
                  "Send Reset Link"
                )}
              </motion.button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto"
              >
                <Mail className="h-8 w-8 text-white" />
              </motion.div>
              <p className="text-gray-300 text-sm sm:text-base">
                If an account exists for{" "}
                <span className="font-semibold">{email}</span>, you will receive
                a password reset link shortly.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-black/30 flex justify-center border-t border-white/5">
          <Link
            href="./login"
            className="text-sm text-green-400 hover:underline flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
