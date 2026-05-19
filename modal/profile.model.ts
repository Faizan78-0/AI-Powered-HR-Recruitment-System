// lib/models/Profile.ts
import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Recruiter Profile ────────────────────────────────────────────────────────

export interface IRecruiterProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  company: string;
  jobTitle: string;
  phone: string | null;
  website: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const RecruiterProfileSchema = new Schema<IRecruiterProfile>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    company:  { type: String, required: true, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    phone:    { type: String, default: null, trim: true },
    website:  { type: String, default: null, trim: true },
    bio:      { type: String, default: null, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    //   transform(_doc, ret) {
    //     ret.id     = ret._id.toString();
    //     ret.userId = ret.userId?.toString?.() ?? ret.userId;
    //     delete ret._id;
    //     delete ret.__v;
    //   },
    },
  }
);

export const RecruiterProfile: Model<IRecruiterProfile> =
  mongoose.models.RecruiterProfile ??
  mongoose.model<IRecruiterProfile>("RecruiterProfile", RecruiterProfileSchema);

// ─── Job Seeker Profile ───────────────────────────────────────────────────────

export interface IJobSeekerProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const JobSeekerProfileSchema = new Schema<IJobSeekerProfile>(
  {
    userId:       { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    headline:     { type: String, default: null, trim: true },
    phone:        { type: String, default: null, trim: true },
    location:     { type: String, default: null, trim: true },
    resumeUrl:    { type: String, default: null, trim: true },
    linkedinUrl:  { type: String, default: null, trim: true },
    portfolioUrl: { type: String, default: null, trim: true },
    skills:       { type: [String], default: [] },
    experience:   { type: Number, default: 0, min: 0 },
    education:    { type: String, default: null, trim: true },
    summary:      { type: String, default: null, trim: true },
    availability: { type: String, default: "Immediately", trim: true },
    salaryMin:    { type: Number, default: null, min: 0 },
    salaryMax:    { type: Number, default: null, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    //   transform(_doc, ret) {
    //     ret.id     = ret._id.toString();
    //     ret.userId = ret.userId?.toString?.() ?? ret.userId;
    //     delete ret._id;
    //     delete ret.__v;
    //   },
    },
  }
);

export const JobSeekerProfile: Model<IJobSeekerProfile> =
  mongoose.models.JobSeekerProfile ??
  mongoose.model<IJobSeekerProfile>("JobSeekerProfile", JobSeekerProfileSchema);