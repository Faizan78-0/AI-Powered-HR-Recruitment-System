"use client";
import React from "react";
import {
  Sparkles,
  BrainCircuit,
  LayoutDashboard,
  Users,
  CheckCircle,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";


interface LandingPageProps {
  onEnterApp: () => void;
}

const Header: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="font-bold text-white">HR</span>
            </div>

            <span className="text-xl font-bold tracking-tight text-slate-900"></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a
              href="#features"
              className="hover:text-blue-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-blue-600 transition-colors"
            >
              How it Works
            </a>
            <a
              href="#testimonials"
              className="hover:text-blue-600 transition-colors"
            >
              Testimonials
            </a>
          </div>

          <Link
            href="yz/login"
            className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-all hover:shadow-lg"
          >
            Log In
          </Link>
        
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl -z-10 opacity-60 translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl -z-10 opacity-60 -translate-x-1/3 translate-y-1/4"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide mb-6 animate-fadeIn"></div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Recruit Smarter, <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
              Not Harder.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            TalentAI automates the hiring chaos. Generate job descriptions,
            analyze resumes, and manage candidates in one intelligent workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Get Started Link */}
            <a
              href="/recruiter/dashboard"
              className="group bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center gap-2 cursor-pointer"
            >
              Get Started for Free
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>

            {/* Watch Demo Link */}
            <a
              href="yz/login"
              className="px-8 py-4 rounded-full text-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Watch Demo
            </a>
          </div>

          {/* Hero Image / UI Mockup */}
          <div className="mt-16 relative mx-auto max-w-5xl">
            <div className="bg-slate-900 p-2 rounded-2xl shadow-2xl">
              <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 aspect-video relative group cursor-default">
                {/* Abstract UI Representation */}
                <div className="absolute inset-0 bg-slate-50 flex">
                  <div className="w-16 h-full bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
                    <div className="w-6 h-6 bg-slate-700 rounded-md"></div>
                    <div className="w-6 h-6 bg-slate-700 rounded-md"></div>
                    <div className="w-6 h-6 bg-slate-700 rounded-md"></div>
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex justify-between mb-8">
                      <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                        <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="w-64 bg-slate-100 rounded-xl p-4 space-y-3">
                        <div className="h-4 w-20 bg-slate-300 rounded"></div>
                        <div className="h-24 bg-white rounded-lg shadow-sm"></div>
                        <div className="h-24 bg-white rounded-lg shadow-sm"></div>
                      </div>
                      <div className="w-64 bg-slate-100 rounded-xl p-4 space-y-3">
                        <div className="h-4 w-20 bg-slate-300 rounded"></div>
                        <div className="h-24 bg-white rounded-lg shadow-sm"></div>
                      </div>
                      <div className="w-64 bg-slate-100 rounded-xl p-4 space-y-3">
                        <div className="h-4 w-20 bg-slate-300 rounded"></div>
                        <div className="h-24 bg-white rounded-lg shadow-sm border-2 border-blue-500">
                          <div className="p-2 space-y-2">
                            <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                            <div className="h-2 w-1/2 bg-blue-100 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                    <button
                      onClick={onEnterApp}
                      className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
                    >
                      Explore Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to hire top talent
            </h2>
            <p className="text-slate-500 text-lg">
              Streamline your entire recruitment process with our comprehensive
              suite of tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles size={24} className="text-white" />}
              color="bg-purple-600"
              title="AI Job Descriptions"
              description="Stop staring at a blank page. Generate professional, inclusive job descriptions in seconds using our advanced AI models."
            />
            <FeatureCard
              icon={<BrainCircuit size={24} className="text-white" />}
              color="bg-blue-600"
              title="Smart Resume Screening"
              description="Automatically parse resumes and get relevance scores based on your job requirements. Save hours of manual review."
            />
            <FeatureCard
              icon={<LayoutDashboard size={24} className="text-white" />}
              color="bg-indigo-600"
              title="Visual Pipeline"
              description="Drag-and-drop candidates through stages with our intuitive Kanban board. Never lose track of a candidate again."
            />
            <FeatureCard
              icon={<Shield size={24} className="text-white" />}
              color="bg-emerald-600"
              title="Unbiased Hiring"
              description="Our AI focuses on skills and experience, helping reduce unconscious bias in the initial screening process."
            />
            <FeatureCard
              icon={<Users size={24} className="text-white" />}
              color="bg-orange-600"
              title="Team Collaboration"
              description="Share candidate profiles, leave notes, and make hiring decisions together with your entire team."
            />
            <FeatureCard
              icon={<Zap size={24} className="text-white" />}
              color="bg-pink-600"
              title="Instant Productivity"
              description="No complex setup. Start managing your recruitment pipeline immediately with our predefined templates."
            />
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="p-4">
              <div className="text-4xl font-bold text-blue-400 mb-2">50%</div>
              <div className="text-slate-400 text-sm font-medium">
                Reduction in Time-to-Hire
              </div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-bold text-purple-400 mb-2">
                10k+
              </div>
              <div className="text-slate-400 text-sm font-medium">
                Resumes Analyzed
              </div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                98%
              </div>
              <div className="text-slate-400 text-sm font-medium">
                Recruiter Satisfaction
              </div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-bold text-orange-400 mb-2">
                24/7
              </div>
              <div className="text-slate-400 text-sm font-medium">
                AI Availability
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, color, title, description }: any) => (
  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-md ${color}`}
    >
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{description}</p>
  </div>
);

export default Header;
