import mongoose, { Document, Model, Schema } from "mongoose";

export type UserRole = "Recruiter" | "Job Seeker";

export interface User extends Document {
  _id: mongoose.Types.ObjectId;
  Name: string;
  email: string;
  password: string;
  role: UserRole;
  imageUrl?: string;
  // Recruiter-specific fields
  jobTitle?: string;
  company?: string;
  bio?: string;
  // Job Seeker-specific fields
  headline?: string;
  seekerBio?: string;
  openToWork?: boolean;
  remotePreference?: "remote" | "hybrid" | "onsite";
  // ── NEW: saved jobs ────────────────────────────────────────────────────
  savedJobs?: mongoose.Types.ObjectId[];
  // ──────────────────────────────────────────────────────────────────────
  signIn: Date;
  isverified: boolean;
  resetpasswordToken?: string;
  resetpasswordExpiresAt?: Date;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<User> = new Schema(
  {
    Name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name must be less than 50 characters"],
      match: [/^[A-Za-z\s]+$/, "Name can only contain letters and spaces"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/,
        "Password must include uppercase, lowercase, and a special character",
      ],
    },
    imageUrl: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["Recruiter", "Job Seeker"],
      default: "Recruiter",
    },

    // ── Recruiter fields ──────────────────────────────────────────────────
    jobTitle: {
      type: String,
      trim: true,
      maxlength: [100, "Job title must be less than 100 characters"],
      default: "",
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, "Company name must be less than 100 characters"],
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio must be less than 500 characters"],
      default: "",
    },

    // ── Job Seeker fields ─────────────────────────────────────────────────
    headline: {
      type: String,
      trim: true,
      maxlength: [150, "Headline must be less than 150 characters"],
      default: "",
    },
    seekerBio: {
      type: String,
      trim: true,
      maxlength: [1000, "Bio must be less than 1000 characters"],
      default: "",
    },
    openToWork: {
      type: Boolean,
      default: true,
    },
    remotePreference: {
      type: String,
      enum: ["remote", "hybrid", "onsite"],
      default: "remote",
    },
    // ── Saved jobs (Job Seeker only) ──────────────────────────────────────
    savedJobs: {
      type: [{ type: Schema.Types.ObjectId, ref: "Job" }],
      default: [],
    },

    // ── Auth fields ───────────────────────────────────────────────────────
    signIn: { type: Date, default: Date.now },
    isverified: { type: Boolean, default: false },
    resetpasswordToken: String,
    resetpasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
  },
  { timestamps: true }
);

const User: Model<User> =
  mongoose.models.User || mongoose.model<User>("User", userSchema);

export default User;