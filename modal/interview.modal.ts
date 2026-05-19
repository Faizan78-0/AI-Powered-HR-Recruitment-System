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
  _id: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  candidateId:   mongoose.Types.ObjectId;   // User._id of the seeker
  jobId:         mongoose.Types.ObjectId | null;
  seekerId:      mongoose.Types.ObjectId | null; // alias for candidateId
  company:       string;
  role:          string;
  recruiterName: string | null;
  date:          string;   // "YYYY-MM-DD"
  time:          string;   // "HH:mm"
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
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    candidateId:   { type: Schema.Types.ObjectId, ref: "User",        required: true, index: true },
    jobId:         { type: Schema.Types.ObjectId, ref: "Job",         default: null },
    seekerId:      { type: Schema.Types.ObjectId, ref: "User",        default: null,  index: true },
    company:       { type: String, required: true, trim: true },
    role:          { type: String, required: true, trim: true },
    recruiterName: { type: String, default: null,  trim: true },
    date:          { type: String, required: true },
    time:          { type: String, required: true },
    type: {
      type: String,
      enum: ["PHONE_SCREEN", "VIDEO_CALL", "TECHNICAL", "HR_INTERVIEW", "FINAL_INTERVIEW", "PANEL"],
      required: true,
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"],
      default: "SCHEDULED",
    },
    meetingLink:  { type: String, default: null, trim: true },
    interviewers: { type: [String], default: [] },
    notes:        { type: String, default: null, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // transform(_doc, ret) {
      //   ret.id = ret._id.toString();
      //   if (ret.applicationId) ret.applicationId = ret.applicationId.toString();
      //   if (ret.candidateId)   ret.candidateId   = ret.candidateId.toString();
      //   if (ret.jobId)         ret.jobId         = ret.jobId.toString();
      //   if (ret.seekerId)      ret.seekerId       = ret.seekerId.toString();
      //   delete ret._id;
      //   delete ret.__v;
      // },
    },
  }
);

InterviewSchema.index({ status: 1 });
InterviewSchema.index({ date: 1, time: 1 });
InterviewSchema.index({ applicationId: 1, status: 1, date: 1 });
InterviewSchema.index({ candidateId:   1, status: 1, date: 1 });

// ✅ Never delete mongoose.models.Interview — that causes hot-reload failures
const Interview: Model<IInterview> =
  mongoose.models.Interview ??
  mongoose.model<IInterview>("Interview", InterviewSchema);

export default Interview;