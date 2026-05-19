// modal/application.modal.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "REVIEWING"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW"
  | "ASSESSMENT"
  | "OFFER"
  | "HIRED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface IApplication extends Document {
  _id:         mongoose.Types.ObjectId;
  jobId:       mongoose.Types.ObjectId;
  seekerId:    mongoose.Types.ObjectId;  // ✅ User._id  (was wrongly ref'd to JobSeekerProfile)
  status:      ApplicationStatus;
  coverLetter: string | null;
  appliedAt:   Date;
  updatedAt:   Date;
  name:        string;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    // ✅ FIXED: ref is "User", not "JobSeekerProfile".
    // The interviews route queries Application.find({ seekerId: userId })
    // where userId comes from the JWT. If seekerId stored a JobSeekerProfile
    // ObjectId instead of a User ObjectId those finds would always return [].
    seekerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "APPLIED",
        "SCREENING",
        "REVIEWING",
        "INTERVIEW_SCHEDULED",
        "INTERVIEW",
        "ASSESSMENT",
        "OFFER",
        "HIRED",
        "ACCEPTED",
        "REJECTED",
        "WITHDRAWN",
      ],
      default: "APPLIED",
    },
    coverLetter: { type: String, default: null, trim: true },
    appliedAt:   { type: Date,   default: Date.now },
  },
  {
    timestamps: { createdAt: "appliedAt", updatedAt: true },
    toJSON: {
      virtuals: true,
      // transform(_doc, ret) {
      //   ret.id       = ret._id.toString();
      //   ret.jobId    = ret.jobId?.toString?.()    ?? ret.jobId;
      //   ret.seekerId = ret.seekerId?.toString?.() ?? ret.seekerId;
      //   delete ret._id;
      //   delete ret.__v;
      // },
    },
  }
);

// One application per job per seeker
ApplicationSchema.index({ jobId: 1, seekerId: 1 }, { unique: true });

const Application: Model<IApplication> =
  mongoose.models.Application ??
  mongoose.model<IApplication>("Application", ApplicationSchema);

export default Application;