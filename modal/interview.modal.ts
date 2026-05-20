// modal/interview.modal.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type InterviewType =
  | "PHONE_SCREEN"
  | "VIDEO_CALL"
  | "TECHNICAL"
  | "HR_INTERVIEW"
  | "FINAL_INTERVIEW"
  | "PANEL";

export interface IInterview extends Document {
  _id:           mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;   // ref → Application
  candidateId:   mongoose.Types.ObjectId;   // ref → User (seeker's User._id) — REQUIRED
  jobId:         mongoose.Types.ObjectId | null; // ref → Job (denormalised for fast lookup)
  company:       string;
  role:          string;
  recruiterName: string | null;
  date:          string;        // "YYYY-MM-DD"
  time:          string;        // "HH:mm"
  type:          InterviewType;
  status:        InterviewStatus;
  meetingLink:   string | null;
  interviewers:  string[];
  notes:         string | null;
  createdAt:     Date;
  updatedAt:     Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    applicationId: {
      type:     Schema.Types.ObjectId,
      ref:      "Application",
      required: true,
      index:    true,
    },
    // ✅ This MUST be the seeker's User._id (same value stored in
    //    Application.seekerId and returned by verifyToken as userId).
    //    Recruiters must populate this field when creating an interview.
    candidateId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    jobId: {
      type:    Schema.Types.ObjectId,
      ref:     "Job",
      default: null,
    },
    company:       { type: String, required: true, trim: true },
    role:          { type: String, required: true, trim: true },
    recruiterName: { type: String, default: null,  trim: true },
    date:          { type: String, required: true  },   // "YYYY-MM-DD"
    time:          { type: String, required: true  },   // "HH:mm"
    type: {
      type:     String,
      enum:     ["PHONE_SCREEN", "VIDEO_CALL", "TECHNICAL", "HR_INTERVIEW", "FINAL_INTERVIEW", "PANEL"],
      required: true,
    },
    status: {
      type:    String,
      enum:    ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"],
      default: "SCHEDULED",
    },
    meetingLink:  { type: String,   default: null, trim: true },
    interviewers: { type: [String], default: []   },
    notes:        { type: String,   default: null, trim: true },
  },
  { timestamps: true }
);

InterviewSchema.index({ candidateId:   1, status: 1, date: 1 });
InterviewSchema.index({ applicationId: 1, status: 1, date: 1 });
InterviewSchema.index({ date: 1, time: 1 });

const Interview: Model<IInterview> =
  mongoose.models.Interview ??
  mongoose.model<IInterview>("Interview", InterviewSchema);

export default Interview;