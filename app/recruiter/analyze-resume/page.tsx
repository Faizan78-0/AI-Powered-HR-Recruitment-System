"use client";
import { useState, useRef } from "react";
import { RShell } from "@/components/shared";
import { cn } from "@/lib/validations";
import type { ResumeAnalysis } from "@/nlp/resumeAnalyzer";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  color,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

function Bar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-bold text-gray-900">{value}/100</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    "A+": "bg-emerald-500 text-white",
    A: "bg-green-500 text-white",
    "B+": "bg-blue-500 text-white",
    B: "bg-blue-400 text-white",
    "C+": "bg-yellow-500 text-white",
    C: "bg-yellow-400 text-white",
    D: "bg-orange-500 text-white",
    F: "bg-red-500 text-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-14 h-14 rounded-2xl text-2xl font-black shadow-lg",
        colors[grade] || "bg-gray-200 text-gray-700"
      )}
    >
      {grade}
    </span>
  );
}

function SectionPill({ name, found }: { name: string; found: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
        found
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-400 line-through"
      )}
    >
      {found ? "✓" : "✗"} {name}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResumeAnalyzerPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"input" | "results">("input");
  const [history, setHistory] = useState<
    { name: string; score: number; grade: string; time: string }[]
  >([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      file.type === "text/plain" ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".pdf") ||
      file.name.endsWith(".docx")
    ) {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setResumeText((ev.target?.result as string) || "");
      reader.readAsText(file);
    } else {
      setError(
        "Please upload a .txt or .md file. For PDF/DOCX, paste the text directly."
      );
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const analyze = async () => {
    if (!resumeText.trim()) {
      setError("Please paste a resume or upload a file.");
      return;
    }
    if (resumeText.trim().split(/\s+/).length < 20) {
      setError("Resume seems too short. Please paste the full text.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/recruiter/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDesc,
          candidateName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data.data.analysis);
      setHistory((h) => [
        {
          name: candidateName || "Anonymous",
          score: data.data.analysis.overallScore,
          grade: data.data.analysis.grade,
          time: new Date().toLocaleTimeString(),
        },
        ...h.slice(0, 9),
      ]);
      setActiveTab("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setActiveTab("input");
    setResumeText("");
    setJobDesc("");
    setCandidateName("");
    setError("");
  };

  const scoreColor = (s: number) =>
    s >= 80 ? "#10b981" : s >= 65 ? "#3b82f6" : s >= 50 ? "#f59e0b" : "#ef4444";
  const barColor = (s: number) =>
    s >= 80
      ? "bg-emerald-500"
      : s >= 65
      ? "bg-blue-500"
      : s >= 50
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <RShell
      title="AI Resume Analyzer"
      actions={
        <div className="flex gap-2">
          {analysis && (
            <button onClick={reset} className="btn-secondary btn-sm">
              ← New Analysis
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />{" "}
            NLP Engine Active
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-4 gap-6">
        {/* Left sidebar: history */}
        <div className="col-span-1 space-y-4">
          <div className="card p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              How it works
            </h3>
            <div className="space-y-3">
              {[
                {
                  n: "1",
                  t: "Paste Resume",
                  d: "Paste resume text or upload .txt file",
                },
                {
                  n: "2",
                  t: "Add Job (optional)",
                  d: "Paste job description for match scoring",
                },
                {
                  n: "3",
                  t: "Analyze",
                  d: "NLP engine scores 6 dimensions instantly",
                },
                {
                  n: "4",
                  t: "Review Insights",
                  d: "See strengths, gaps, and ATS compatibility",
                },
              ].map((s) => (
                <div key={s.n} className="flex gap-2.5">
                  <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {s.n}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{s.t}</p>
                    <p className="text-xs text-gray-500">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Recent Analyses
              </h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[80px]">
                        {h.name}
                      </p>
                      <p className="text-xs text-gray-400">{h.time}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-900">
                        {h.score}
                      </span>
                      <span
                        className={cn(
                          "badge text-xs",
                          h.score >= 80
                            ? "bg-green-100 text-green-700"
                            : h.score >= 60
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        )}
                      >
                        {h.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4 bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
              NLP Signals
            </h3>
            <div className="space-y-1.5 text-xs text-indigo-600">
              {[
                "Skill taxonomy (200+ skills)",
                "Achievement pattern matching",
                "Experience year extraction",
                "Education level detection",
                "ATS compatibility scoring",
                "Job description matching",
                "Red flag detection",
                "Section completeness check",
              ].map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="text-indigo-400">◆</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="col-span-3">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
            {(["input", "results"] as const).map((t) => (
              <button
                key={t}
                onClick={() =>
                  t === "results" && !analysis ? null : setActiveTab(t)
                }
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  activeTab === t
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                  t === "results" && !analysis
                    ? "opacity-40 cursor-not-allowed"
                    : ""
                )}
              >
                {t === "input" ? "📝 Input" : "📊 Results"}
                {t === "results" && analysis && (
                  <span
                    className={cn(
                      "ml-2 badge text-xs",
                      analysis.overallScore >= 80
                        ? "bg-green-100 text-green-700"
                        : analysis.overallScore >= 60
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    )}
                  >
                    {analysis.overallScore}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── INPUT TAB ── */}
          {activeTab === "input" && (
            <div className="space-y-4 fu">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Candidate Name (optional)</label>
                  <input
                    className="input"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="...."
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <label className="label">Upload Resume File</label>
                    <div className="flex gap-2">
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".txt,.md,.docx,.pdf"
                        onChange={handleFile}
                        className="hidden"
                      />
                      <button
                        type="button" // Prevents accidental form submissions
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 
             bg-white text-gray-700 border border-gray-300 
             font-medium rounded-lg text-sm
             hover:bg-gray-50 hover:border-gray-400
             focus:ring-4 focus:outline-none focus:ring-blue-100
             transition-all duration-200 shadow-sm w-full"
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        <span>Upload .pdf / docx</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Resume Text *</label>
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-400">
                      {resumeText.trim().split(/\s+/).filter(Boolean).length}{" "}
                      words
                    </span>
                  </div>
                </div>
                <textarea
                  rows={14}
                  className="input resize-none font-mono text-xs leading-relaxed"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder={`Paste the full resume text here...\n\nTip: Copy all text from the resume PDF and paste it here.\nThe NLP engine will extract skills, experience, achievements and more.`}
                />
              </div>

              <button
                onClick={analyze}
                disabled={loading || !resumeText.trim()}
                className="btn-primary w-full justify-center py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Analyzing with NLP Engine…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z "
                      />
                    </svg>
                    Analyze Resume with AI
                  </span>
                )}
              </button>
            </div>
          )}

          {/* ── RESULTS TAB ── */}
          {activeTab === "results" && analysis && (
            <div className="space-y-5 fu">
              {/* Hero score card */}
              <div className="card p-6 bg-gradient-to-br from-indigo-950 to-violet-900 border-0 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-300 text-sm font-medium mb-1">
                      AI Resume Score
                    </p>
                    {candidateName && (
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {candidateName}
                      </h2>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <GradeBadge grade={analysis.grade} />
                      <div>
                        <p className="text-5xl font-black text-white leading-none">
                          {analysis.overallScore}
                          <span className="text-2xl text-indigo-300">/100</span>
                        </p>
                        <p className="text-indigo-300 text-sm mt-1">
                          {analysis.summary.split(".")[0]}.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <ScoreRing
                      score={analysis.overallScore}
                      size={140}
                      strokeWidth={12}
                      color={scoreColor(analysis.overallScore)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-black text-white">
                        {analysis.overallScore}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
                  {[
                    {
                      l: "Skills",
                      v: analysis.detectedSkills.length,
                      u: "detected",
                    },
                    {
                      l: "Experience",
                      v:
                        analysis.yearsExperience !== null
                          ? `${analysis.yearsExperience}yr`
                          : "N/A",
                      u: "",
                    },
                    { l: "ATS Score", v: `${analysis.atsScore}%`, u: "" },
                    {
                      l:
                        analysis.jobMatchScore !== null
                          ? "Job Match"
                          : "Achievements",
                      v:
                        analysis.jobMatchScore !== null
                          ? `${analysis.jobMatchScore}%`
                          : analysis.achievements.length,
                      u: analysis.jobMatchScore !== null ? "" : "found",
                    },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm"
                    >
                      <p className="text-2xl font-bold text-white">{s.v}</p>
                      <p className="text-indigo-300 text-xs">
                        {s.l} {s.u}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Score breakdown */}
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Score Breakdown
                  </h3>
                  <Bar
                    label="Technical Skills"
                    value={analysis.scores.skills}
                    color={barColor(analysis.scores.skills)}
                  />
                  <Bar
                    label="Experience"
                    value={analysis.scores.experience}
                    color={barColor(analysis.scores.experience)}
                  />
                  <Bar
                    label="Education"
                    value={analysis.scores.education}
                    color={barColor(analysis.scores.education)}
                  />
                  <Bar
                    label="Achievements & Impact"
                    value={analysis.scores.achievements}
                    color={barColor(analysis.scores.achievements)}
                  />
                  <Bar
                    label="Resume Formatting"
                    value={analysis.scores.formatting}
                    color={barColor(analysis.scores.formatting)}
                  />
                  <Bar
                    label="Keyword Density"
                    value={analysis.scores.keywords}
                    color={barColor(analysis.scores.keywords)}
                  />
                </div>

                {/* ATS + Profile */}
                <div className="space-y-4">
                  <div className="card p-5">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      ATS Compatibility
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <ScoreRing
                          score={analysis.atsScore}
                          size={80}
                          strokeWidth={8}
                          color={scoreColor(analysis.atsScore)}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-black text-gray-900">
                            {analysis.atsScore}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 mb-1">
                          {analysis.atsScore >= 80
                            ? "Excellent — passes most ATS"
                            : analysis.atsScore >= 60
                            ? "Good — minor improvements recommended"
                            : "Needs work — may be filtered out"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Applicant Tracking Systems auto-filter resumes before
                          human review.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="card p-5">
                    <h3 className="font-bold text-gray-900 mb-3">
                      Candidate Profile
                    </h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { l: "Seniority", v: analysis.seniorityLevel },
                        {
                          l: "Experience",
                          v:
                            analysis.yearsExperience !== null
                              ? `~${analysis.yearsExperience} years`
                              : "Not specified",
                        },
                        {
                          l: "Education",
                          v:
                            analysis.educationLevel +
                            (analysis.topUniversity
                              ? " (Top University 🏆)"
                              : ""),
                        },
                        {
                          l: "Total Skills",
                          v: `${analysis.detectedSkills.length} across ${analysis.skillCategories.length} categories`,
                        },
                        { l: "Word Count", v: `${analysis.wordCount} words` },
                        {
                          l: "Keyword Density",
                          v: `${analysis.keywordDensity}%`,
                        },
                      ].map((r) => (
                        <div
                          key={r.l}
                          className="flex justify-between py-1.5 border-b border-gray-50 last:border-0"
                        >
                          <span className="text-gray-500">{r.l}</span>
                          <span className="font-semibold text-gray-900 text-right max-w-[180px]">
                            {r.v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Job match */}
              {analysis.jobMatchScore !== null && (
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Job Description Match
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <ScoreRing
                          score={analysis.jobMatchScore}
                          size={60}
                          strokeWidth={6}
                          color={scoreColor(analysis.jobMatchScore)}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black text-gray-900">
                            {analysis.jobMatchScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">
                        ✓ Matched Skills ({analysis.matchedKeywords.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.matchedKeywords.length > 0 ? (
                          analysis.matchedKeywords.map((k) => (
                            <span
                              key={k}
                              className="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-lg font-medium"
                            >
                              {k}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400">
                            No direct matches found
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">
                        ✗ Missing Skills ({analysis.missingKeywords.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.missingKeywords.length > 0 ? (
                          analysis.missingKeywords.map((k) => (
                            <span
                              key={k}
                              className="px-2.5 py-1 bg-red-100 text-red-700 text-xs rounded-lg font-medium"
                            >
                              {k}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-green-600 font-medium">
                            All required skills present!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Skill categories */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  Skills Detected by Category ({analysis.detectedSkills.length}{" "}
                  total)
                </h3>
                {analysis.skillCategories.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No specific technical skills detected. Try pasting more
                    complete resume text.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analysis.skillCategories.map((cat) => (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                            {cat.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            {cat.count} skills
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.skills.map((s) => (
                            <span
                              key={s}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-lg font-medium border border-indigo-100"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Achievements */}
              {analysis.achievements.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    Quantifiable Achievements ({analysis.achievements.length})
                  </h3>
                  <div className="space-y-2">
                    {analysis.achievements.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl"
                      >
                        <span className="text-green-500 font-bold flex-shrink-0">
                          📈
                        </span>
                        <p className="text-sm text-green-900">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sections */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3">
                  Resume Section Completeness
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.sections.map((s) => (
                    <SectionPill key={s.name} name={s.name} found={s.found} />
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-2 gap-5">
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-green-500">✓</span> Strengths (
                    {analysis.strengths.length})
                  </h3>
                  {analysis.strengths.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Add more detail to surface strengths.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {analysis.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 flex-shrink-0 mt-0.5">
                            ●
                          </span>
                          <span className="text-gray-700">{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-orange-500">⚡</span> Improvements (
                    {analysis.improvements.length})
                  </h3>
                  {analysis.improvements.length === 0 ? (
                    <p className="text-sm text-green-600 font-medium">
                      Excellent resume — nothing major to improve!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {analysis.improvements.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-400 flex-shrink-0 mt-0.5">
                            →
                          </span>
                          <span className="text-gray-700">{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Red flags */}
              {analysis.redFlags.length > 0 && (
                <div className="card p-5 border-red-100 bg-red-50/50">
                  <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Language Red Flags ({analysis.redFlags.length})
                  </h3>
                  <div className="space-y-2">
                    {analysis.redFlags.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-red-500 flex-shrink-0">⚠</span>
                        <span className="text-red-700">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="btn-secondary flex-1 justify-center"
                >
                  Analyze Another Resume
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob(
                      [
                        JSON.stringify(
                          {
                            candidateName,
                            analysis,
                            analyzedAt: new Date().toISOString(),
                          },
                          null,
                          2
                        ),
                      ],
                      { type: "application/json" }
                    );
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `resume-analysis-${(
                      candidateName || "candidate"
                    )
                      .replace(/\s+/g, "-")
                      .toLowerCase()}.json`;
                    a.click();
                  }}
                  className="btn-primary flex-1 justify-center"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Export Report (JSON)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </RShell>
  );
}
