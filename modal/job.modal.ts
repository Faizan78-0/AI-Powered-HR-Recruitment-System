import mongoose, { Document, Model, Schema } from "mongoose";
import type { JobStatus, JobType, ExperienceLevel } from "@/types/index";

export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  id: string; // Virtual id for frontend convenience
  recruiterId: mongoose.Types.ObjectId; 
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
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    recruiterId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    department: { type: String, default: null, trim: true },
    location: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE"],
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "OPEN", "PAUSED", "CLOSED", "FILLED"],
      default: "DRAFT",
    },
    salary: { type: String, default: null, trim: true },
    description: { type: String, required: true, trim: true },
    requiredSkills: { type: [String], default: [] },
    remote: { type: Boolean, default: false },
    experienceLevel: {
      type: String,
      enum: ["ENTRY", "MID", "SENIOR", "LEAD", "EXECUTIVE"],
      default: "MID",
    },
    benefits: { type: [String], default: [] },
  },
  {
    timestamps: true,
    // FIX: This ensures virtuals (like 'id') are included in API responses
    toJSON: { 
      virtuals: true,
      // transform: (_, ret) => {
      //   delete ret.__v; // Remove the mongo version key for cleaner API data
      //   return ret;
      // }
    },
    toObject: { virtuals: true }
  }
);

// VIRTUAL: Map _id to id so frontend 'editJob.id' works automatically
JobSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// INDEXING: Optimization for search and filtering
JobSchema.index({ recruiterId: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ title: "text", description: "text", company: "text" });

const Job: Model<IJob> =
  mongoose.models.Job ?? mongoose.model<IJob>("Job", JobSchema);

export default Job;