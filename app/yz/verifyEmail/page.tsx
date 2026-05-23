"use client";

import { useEffect, useRef, useState, ChangeEvent, KeyboardEvent, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/Authstore/store"; // Adjust path to your store
import toast from "react-hot-toast";

// 1. Core verification form logic (Handles client-side search query logic)
function VerifyEmailForm() {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const role = searchParams.get("user_role");
  const { error, isLoading, verifyEmail } = useAuthStore() as any;

  const handleChange = (index: number, value: string) => {
    const newCode = [...code];

    // Handle pasted content cleanly
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedCode[i] || "";
      }
      setCode(newCode);

      // Focus on the last non-empty input or fallback to the final input field
      const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
      const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
      inputRefs.current[focusIndex]?.focus();
    } else {
      newCode[index] = value;
      setCode(newCode);

      // Move focus to the next input field if a digit was typed
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: FormEvent | Event) => {
    e?.preventDefault();
    const verificationCode = code.join("");
    try {
      await verifyEmail(verificationCode);
      toast.success("Email verified ");
      if (role === "Recruiter") {
        router.push("/jobseeker/dashboard");
      } else {
        router.push("/recruiter/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("Verification failed");
    }
  };

  // Automatically submit once all 6 digits have been inputted
  useEffect(() => {
    if (code.every((digit) => digit !== "")) {
      handleSubmit();
    }
  }, [code]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700"
      >
        <h2 className="text-3xl font-bold mb-6 text-center bg-linear-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
          Verify Your Email
        </h2>
        <p className="text-center text-gray-300 mb-6">
          Enter the 6-digit code sent to your email address.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={6}
                value={digit}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChange(index, e.target.value)
                }
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                  handleKeyDown(index, e)
                }
                className="w-12 h-12 text-center text-2xl font-bold bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:border-green-500 focus:outline-none"
              />
            ))}
          </div>
          
          {error && <p className="text-red-500 font-semibold mt-2 text-center">{error}</p>}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || code.some((digit) => !digit)}
            className="w-full bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 transition-all"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// 2. Default exported page containing the required Suspense wrapper to fix the static build error
export default function VerifyEmailPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white font-medium">
          <div className="text-center">
            <p className="text-xl font-semibold mb-2">Loading verification window...</p>
            <p className="text-sm text-gray-400">Securing environment parameters</p>
          </div>
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}