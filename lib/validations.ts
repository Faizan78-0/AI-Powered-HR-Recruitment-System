import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  ApplicationStatus,
  JobStatus,
  JobType,
  ExperienceLevel,
  InterviewType,
  InterviewStatus,
} from "@/types";

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));

export const fmt$ = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtDate = (d: string | Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(d));

export const fmtDateTime = (d: string | Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(d));

// FIXED: Added a check for 'n'. Returns empty string or fallback if n is null/undefined.
export const initials = (n?: string | null) => {
  if (!n) return "";
  return n
    .trim()
    .split(/\s+/) // Splits by any whitespace to handle double spaces
    .map((x) => x[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const parseJ = <T>(s: string, fb: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fb;
  }
};

export const salary = (mn?: number | null, mx?: number | null) =>
  !mn && !mx
    ? "Competitive"
    : mn && mx
    ? `${fmt$(mn)} – ${fmt$(mx)}`
    : mn
    ? `From ${fmt$(mn)}`
    : `Up to ${fmt$(mx!)}`;

export const ago = (d: string | Date) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dy = Math.floor(h / 24);
  return dy < 30 ? `${dy}d ago` : fmtDate(d);
};

export const APP_CFG: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string }
> = {
  APPLIED: { label: "Applied", color: "text-blue-700", bg: "bg-blue-100" },
  SCREENING: {
    label: "Screening",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
  },
  INTERVIEW: {
    label: "Interview",
    color: "text-purple-700",
    bg: "bg-purple-100",
  },
  ASSESSMENT: {
    label: "Assessment",
    color: "text-orange-700",
    bg: "bg-orange-100",
  },
  OFFER: { label: "Offer", color: "text-teal-700", bg: "bg-teal-100" },
  HIRED: { label: "Hired", color: "text-green-700", bg: "bg-green-100" },
  REJECTED: { label: "Rejected", color: "text-red-700", bg: "bg-red-100" },
  WITHDRAWN: { label: "Withdrawn", color: "text-gray-600", bg: "bg-gray-100" },
};

export const JOB_CFG: Record<
  JobStatus,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100" },
  OPEN: { label: "Open", color: "text-green-700", bg: "bg-green-100" },
  PAUSED: { label: "Paused", color: "text-yellow-700", bg: "bg-yellow-100" },
  CLOSED: { label: "Closed", color: "text-red-700", bg: "bg-red-100" },
  FILLED: { label: "Filled", color: "text-blue-700", bg: "bg-blue-100" },
};

export const IV_CFG: Record<
  InterviewStatus,
  { label: string; color: string; bg: string }
> = {
  SCHEDULED: { label: "Scheduled", color: "text-blue-700", bg: "bg-blue-100" },
  COMPLETED: {
    label: "Completed",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bg: "bg-red-100" },
  NO_SHOW: { label: "No Show", color: "text-orange-700", bg: "bg-orange-100" },
};

export const JOB_TYPE_L: Record<JobType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  REMOTE: "Remote",
};

export const EXP_L: Record<ExperienceLevel, string> = {
  ENTRY: "Entry Level",
  MID: "Mid Level",
  SENIOR: "Senior",
  LEAD: "Lead",
  EXECUTIVE: "Executive",
};

export const IV_TYPE_L: Record<InterviewType, string> = {
  PHONE_SCREEN: "Phone Screen",
  VIDEO_CALL: "Video Call",
  TECHNICAL: "Technical",
  HR_INTERVIEW: "HR Interview",
  FINAL_INTERVIEW: "Final Interview",
  PANEL: "Panel Interview",
};

export const AVAIL_L: Record<string, string> = {
  IMMEDIATE: "Immediately",
  "2_WEEKS": "2 Weeks Notice",
  "1_MONTH": "1 Month Notice",
  OPEN: "Open to Discuss",
};