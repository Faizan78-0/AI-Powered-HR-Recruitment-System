"use client";

import React from "react";
import { useRouter } from "next/navigation";

import type { HeroProps } from "@/types/index";

export function Hero({ onGetStarted }: HeroProps): React.JSX.Element {
  const router = useRouter();
  return (
    <section className="relative w-full bg-[#020617] pt-34 pb-20 lg:pt-65 lg:pb-32 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/8 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* ── Left Content ──────────────────────────────────────── */}
        <div className="flex flex-col items-start text-left">
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tighter leading-tight mb-6">
            Smart Hiring <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-100">
              Starts Here.
            </span>
          </h1>

          <p className="text-slate-400 text-lg lg:text-xl mb-10 max-w-lg leading-relaxed">
            Streamline your entire hiring process with HR_RECRUITER. Find top
            talent faster, automate screening, and make data-backed decisions.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => router.push("/yz/login")}
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg
                         hover:bg-indigo-500 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Get Started Free
            </button>
            <button
              type="button"
              onClick={() => router.push("/yz/signup")}
              className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-xl
                         font-bold hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              View Demo
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-3 mt-10">
            <div className="flex">
              {(["SR", "LK", "AP", "MJ"] as const).map((initials, i) => (
                <div
                  key={initials}
                  className="w-8 h-8 rounded-full border-2 border-[#020617] flex items-center justify-center
                             text-[10px] font-bold text-white"
                  style={{
                    marginLeft: i === 0 ? 0 : -8,
                    background: ["#6366f1", "#0d9e75", "#e04a28", "#d97a0e"][i],
                  }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-sm">
              <strong className="text-white">2,400+</strong> HR teams trust
              HR_RECRUITER
            </p>
          </div>
        </div>

        {/* ── Right Content — Dashboard Mockup ──────────────────── */}
        <div className="relative">
          {/* Floating stat cards */}
          {/* Using animate-bounce (default Tailwind) or custom class below */}
          {/* <div className="absolute -top-4 -right-4 z-20 bg-[#0f172a] border border-white/10 rounded-2xl
                          px-4 py-3 shadow-2xl animate-bounce hidden lg:block">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Time to Hire</p>
            <p className="text-white font-extrabold text-xl font-mono">4.2 days</p>
            <span className="inline-block bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold
                             px-2 py-0.5 rounded-full mt-1">
              ↓ 68% faster
            </span>
          </div> */}

          {/* <div className="absolute -bottom-4 -left-4 z-20 bg-[#0f172a] border border-white/10 rounded-2xl */}
          {/* // px-4 py-3 shadow-2xl hidden lg:block animate-pulse"> */}
          {/* <p className="text-[10px] text-slate-500 uppercase tracking-wider">AI Match Score</p> */}
          {/* <p className="text-white font-extrabold text-xl font-mono">97%</p> */}
          {/* <span className="inline-block bg-indigo-500/20 text-indigo-400 text-[10px] font-semibold
                             px-2 py-0.5 rounded-full mt-1">
              Top candidate
            </span> */}
          {/* </div> */}

          {/* Main dashboard image */}
          <div
            className="relative p-2 rounded-3xl bg-white/5 border border-white/10 shadow-2xl
                          backdrop-blur-sm overflow-hidden"
          >
            <img
              src="/hero.png"
              alt="HR_RECRUITER Dashboard"
              width={800}
              className="rounded-2xl w-full h-auto object-cover border border-white/8"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#020617]/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
