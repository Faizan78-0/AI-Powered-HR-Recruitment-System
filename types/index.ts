// app/types/index.ts
// Single source of truth for all TypeScript types.
// All types mirror the Prisma schema exactly.

import { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVE ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export type Role = "RECRUITER" | "JOB_SEEKER";
export type JobStatus = "DRAFT" | "OPEN" | "PAUSED" | "CLOSED" | "FILLED";
export type JobType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE";
export type ExperienceLevel = "ENTRY" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
export type CandidateStatus =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";
export type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "ASSESSMENT"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN"
  | "REVIEWING"
  | "INTERVIEW_SCHEDULED"
  |"ACCEPTED";

export type InterviewStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";
export type InterviewType =
  | "PHONE_SCREEN"
  | "VIDEO_CALL"
  | "TECHNICAL"
  | "HR_INTERVIEW"
  | "FINAL_INTERVIEW"
  | "PANEL";
export type MessageSender = "RECRUITER" | "JOB_SEEKER";

// ─────────────────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  Name: string;
  role: Role;
  imageUrl: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECRUITER PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export interface RecruiterProfile {
  id: string;
  userId: string;
  company: string;
  jobTitle: string;
  phone: string | null;
  website: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
  /** Populated via join */
  user?: Pick<User, "id" | "Name" | "email" | "avatar">;
}

/** Body accepted by PATCH /api/recruiter/setting */
export interface UpdateRecruiterProfileInput {
  name?: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  website?: string;
  bio?: string;
  avatar?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB SEEKER PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export interface JobSeekerProfile {
  id: string;
  userId: string;
  headline: string | null;
  phone: string | null;
  location: string | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  skills: string[];
  experience: number;
  education: string | null;
  summary: string | null;
  availability: string;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: string;
  updatedAt: string;
  /** Populated via join */
  user?: Pick<User, "id" | "Name" | "email" | "avatar">;
}

/** Body accepted by PATCH /api/jobseeker/setting */
export interface UpdateJobSeekerProfileInput {
  name?: string;
  email?: string;
  headline?: string;
  phone?: string;
  location?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  skills?: string[];
  experience?: number;
  education?: string;
  summary?: string;
  availability?: string;
  salaryMin?: number;
  salaryMax?: number;
  avatar?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB
// ─────────────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  recruiterId: string;
  title: string;
  company: string;
  department: string | null;
  location: string;
  type: JobType;
  status: JobStatus;
  salary: string | null;
  description: string;
  requiredSkills: string[];
  remote: boolean;
  experienceLevel: ExperienceLevel;
  benefits: string[];
  createdAt: string;
  updatedAt: string;
  /** Populated via join */
  _count?: { applications: number };
}

/** Body for POST /api/recruiter/jobs */
export interface CreateJobInput {
  title: string;
  company: string;
  department?: string;
  location: string;
  type: JobType;
  status?: JobStatus;
  salary?: string;
  description: string;
  requiredSkills?: string[];
  remote?: boolean;
  experienceLevel?: ExperienceLevel;
  benefits?: string[];
}

/** Body for PATCH /api/recruiter/jobs?id= */
export interface UpdateJobInput extends Partial<CreateJobInput> {}

// ─────────────────────────────────────────────────────────────────────────────
// CANDIDATE
// ─────────────────────────────────────────────────────────────────────────────

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  jobId: string;
  jobTitle: string;
  status: CandidateStatus;
  experience: string | null;
  rating: number;
  skills: string[];
  notes: string | null;
  resumeUrl: string | null;
  appliedDate: string;
  createdAt: string;
  updatedAt: string;
}

/** Body for POST /api/recruiter/candidates */
export interface CreateCandidateInput {
  name: string;
  email: string;
  phone?: string;
  jobId: string;
  jobTitle: string;
  experience?: string;
  rating?: number;
  skills?: string[];
  notes?: string;
  resumeUrl?: string;
}

/** Body for PATCH /api/recruiter/candidates?id= */
export interface UpdateCandidateInput {
  name?: string;
  email?: string;
  phone?: string;
  jobId?: string;
  jobTitle?: string;
  status?: CandidateStatus;
  experience?: string;
  rating?: number;
  skills?: string[];
  notes?: string;
  resumeUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW
// ─────────────────────────────────────────────────────────────────────────────

export interface Interview {
  id: string;
  candidateId: string;
  jobId: string | null;
  seekerId: string | null;
  company: string;
  role: string;
  recruiterName: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: InterviewType;
  status: InterviewStatus;
  meetingLink: string | null;
  interviewers: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body for POST /api/recruiter/interviews */
export interface CreateInterviewInput {
  candidateId: string;
  jobId?: string;
  seekerId?: string;
  company?: string;
  role: string;
  recruiterName?: string;
  date: string;
  time: string;
  type: InterviewType;
  meetingLink?: string;
  interviewers?: string[];
  notes?: string;
}

/** Body for PATCH /api/recruiter/interviews?id= */
export interface UpdateInterviewInput {
  date?: string;
  time?: string;
  type?: InterviewType;
  status?: InterviewStatus;
  meetingLink?: string;
  interviewers?: string[];
  notes?: string;
  recruiterName?: string;
  company?: string;
  role?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION
// ─────────────────────────────────────────────────────────────────────────────

export interface Application {
  id: string;
  jobId: string;
  seekerId: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  appliedAt: string;
  updatedAt: string;
  /** Populated via join */
  job?: Pick<
    Job,
    "id" | "title" | "company" | "location" | "salary" | "type" | "remote"
  >;
}

/** Body for POST /api/jobseeker/jobs */
export interface CreateApplicationInput {
  jobId: string;
  coverLetter?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION & MESSAGE
// ─────────────────────────────────────────────────────────────────────────────

export interface Message {
  [x: string]: ReactNode;
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: MessageSender;
  text: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  recruiterId: string;
  jobSeekerId: string;
  recruiterName: string;
  jobSeekerName: string;
  company: string;
  role: string;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadRecruiter: number;
  unreadJobSeeker: number;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

/** Body for POST /api/recruiter/chat or /api/jobseeker/chat */
export interface SendMessageInput {
  conversationId: string;
  text: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE WRAPPERS
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiError {
  error: string;
  field?: string;
  status?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PAYLOADS
// ─────────────────────────────────────────────────────────────────────────────

export interface RecruiterDashboardStats {
  activeJobs: number;
  newCandidates: number;
  interviews: number;
  hireRate: string;
}

export interface PipelineStage {
  stage: string;
  count: number;
}

export interface RecruiterDashboard {
  stats: RecruiterDashboardStats;
  pipeline: PipelineStage[];
  recentApplications: RecentApplication[];
  upcomingInterviews: UpcomingInterview[];
  jobSummary: JobSummary;
}

export interface RecentApplication {
  id: string;
  candidateName: string;
  jobRole: string;
  status: CandidateStatus;
  appliedAt: string;
  score: number;
  skills: string[];
}

export interface UpcomingInterview {
  id: string;
  candidate: string;
  role: string;
  date: string;
  time: string;
  type: InterviewType;
  meetingLink: string | null;
}

export interface JobSummary {
  open: number;
  draft: number;
  paused: number;
  filled: number;
  closed: number;
}

export interface JobSeekerDashboard {
  stats: {
    appliedJobs: number;
    savedJobs: number;
    interviews: number;
    openPositions: number;
  };
  pipeline: PipelineStage[];
  recentApplications: Application[];
  upcomingInterviews: UpcomingInterview[];
  profileCompletion: number;
}

export interface HeroProps {
  onGetStarted: () => void;
}

export interface CTAProps {
  onGetStarted: () => void;
}

export interface HowItWorksProps {
  activeStep: number;
  onStepChange: (index: number) => void;
}

export interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accentClass: string;
  iconBgClass: string;
}

export interface Step {
  number: string;
  title: string;
  description: string;
}

export interface Metric {
  prefix: string;
  value: string;
  suffix: string;
  label: string;
  color: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  initials: string;
  avatarColor: string;
}
