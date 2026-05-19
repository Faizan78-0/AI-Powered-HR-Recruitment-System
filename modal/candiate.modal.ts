// modal/candidate.modal.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export type CandidateStatus =
  | "APPLIED"
  | "SCREENING"
  | "REVIEWING"
  | "INTERVIEW_SCHEDULED"
  | "OFFER"
  | "HIRED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface ICandidate extends Document {
  _id: mongoose.Types.ObjectId;
  // ── Core links ─────────────────────────────────────────────────────────────
  // Every Candidate record is created from an Application — keep both refs
  // so we can always resolve back to either model.
  applicationId: mongoose.Types.ObjectId; // → Application._id
  seekerId: mongoose.Types.ObjectId; // → User._id  (the job seeker)
  recruiterId: mongoose.Types.ObjectId; // → User._id  (the recruiter)
  jobId: mongoose.Types.ObjectId; // → Job._id
  // ── Denormalised snapshot ─────────────────────────────────────────────────
  // Stored at apply-time so recruiter views stay fast without joins.
  name: string;
  email: string;
  phone: string | null;
  jobTitle: string;
  company: string;
  // ── Application data ──────────────────────────────────────────────────────
  status: CandidateStatus;
  experience: string | null;
  rating: number;
  skills: string[];
  notes: string | null;
  resumeUrl: string | null;
  coverLetter: string | null;
  appliedAt: Date;
  // ── Timestamps ───────────────────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
      index: true,
    },
    seekerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: null, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    company: { type: String, default: "", trim: true },

    status: {
      type: String,
      enum: [
        "APPLIED",
        "SCREENING",
        "REVIEWING",
        "INTERVIEW_SCHEDULED",
        "OFFER",
        "HIRED",
        "ACCEPTED",
        "REJECTED",
        "WITHDRAWN",
      ],
      default: "APPLIED",
      index: true,
    },
    experience: { type: String, default: null, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 3 },
    skills: { type: [String], default: [] },
    notes: { type: String, default: null, trim: true },
    resumeUrl: { type: String, default: null, trim: true },
    coverLetter: { type: String, default: null, trim: true },
    appliedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // transform(_doc, ret) {
      //   ret.id = ret._id.toString();
      //   delete ret.__v;
      // },
    },
  }
);

// Compound index — the most common query pattern for the recruiter view
CandidateSchema.index({ recruiterId: 1, status: 1, appliedAt: -1 });
CandidateSchema.index({ recruiterId: 1, jobId: 1 });

const Candidate: Model<ICandidate> =
  mongoose.models.Candidate ??
  mongoose.model<ICandidate>("Candidate", CandidateSchema);

export default Candidate;
