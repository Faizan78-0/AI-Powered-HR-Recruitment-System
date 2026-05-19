// modal/notification.modal.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "APPLICATION_RECEIVED"   // recruiter gets this when seeker applies
  | "APPLICATION_REVIEWED"   // seeker gets this when recruiter marks reviewing
  | "APPLICATION_ACCEPTED"   // seeker: accepted
  | "APPLICATION_REJECTED"   // seeker: rejected
  | "INTERVIEW_SCHEDULED"    // seeker: interview scheduled
  | "INTERVIEW_UPDATED"      // seeker: interview rescheduled/cancelled
  | "INTERVIEW_REMINDER"     // both: 24h before interview
  | "MESSAGE_RECEIVED"       // both: new chat message
  | "JOB_POSTED"             // seekers (broadcast): new job matching skills
  | "APPLICATION_WITHDRAWN"  // recruiter: seeker withdrew application
  | "OFFER_EXTENDED";        // seeker: offer made

export interface INotification extends Document {
  recipientId:   mongoose.Types.ObjectId;  // User who receives it
  senderId?:     mongoose.Types.ObjectId;  // User who triggered it (optional)
  type:          NotificationType;
  title:         string;
  message:       string;
  isRead:        boolean;
  link?:         string;                   // frontend route to navigate on click
  meta?: {
    applicationId?: string;
    interviewId?:   string;
    jobId?:         string;
    chatId?:        string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderId:    { type: Schema.Types.ObjectId, ref: "User", default: null },
    type:        { type: String, required: true },
    title:       { type: String, required: true },
    message:     { type: String, required: true },
    isRead:      { type: Boolean, default: false, index: true },
    link:        { type: String, default: null },
    meta:        {
      applicationId: { type: String, default: null },
      interviewId:   { type: String, default: null },
      jobId:         { type: String, default: null },
      chatId:        { type: String, default: null },
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;