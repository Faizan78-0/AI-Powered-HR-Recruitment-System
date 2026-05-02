import mongoose, { Document, Model, Schema } from "mongoose";

export interface IJob extends Document {
  title: string;
  description: string;
  company: string;
  location: string;
  salary: string;
  jobType: "Full-time" | "Part-time" | "Remote" | "Contract";
  recruiterId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    salary: { type: String, required: true },
    jobType: { 
      type: String, 
      enum: ["Full-time", "Part-time", "Remote", "Contract"], 
      default: "Full-time" 
    },
    recruiterId: { type: Schema.Types.ObjectId, ref: "users", required: true },
  },
  { timestamps: true }
);

const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>("Job", jobSchema);
export default Job;