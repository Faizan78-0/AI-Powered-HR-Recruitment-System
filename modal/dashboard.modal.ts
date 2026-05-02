// models/Dashboard.ts
import mongoose from "mongoose";

const JobSchema = new mongoose.Schema({ status: String });
const CandidateSchema = new mongoose.Schema({ createdAt: Date });
const ApplicationSchema = new mongoose.Schema({
  candidateName: String,
  jobRole: String,
  status: String,
  appliedAt: { type: Date, default: Date.now }
});

export const Job = mongoose.models.Job || mongoose.model("Job", JobSchema);
export const Candidate = mongoose.models.Candidate || mongoose.model("Candidate", CandidateSchema);
export const Application = mongoose.models.Application || mongoose.model("Application", ApplicationSchema);