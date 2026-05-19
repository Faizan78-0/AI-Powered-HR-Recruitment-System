// lib/models/Conversation.ts
import mongoose, { Document, Model, Schema } from "mongoose";
import type { MessageSender } from "@/types/index";

// ─── Message sub-document ─────────────────────────────────────────────────────

export interface IMessage {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: MessageSender;
  text: string;
  read: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["RECRUITER", "JOB_SEEKER"], required: true },
    text:       { type: String, required: true, trim: true },
    read:       { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    _id: true,
    toJSON: {
      virtuals: true,
    //   transform(_doc, ret) {
    //     ret.id       = ret._id.toString();
    //     ret.senderId = ret.senderId?.toString?.() ?? ret.senderId;
    //     delete ret._id;
    //     delete ret.__v;
    //   },
    },
  }
);

// ─── Conversation document ────────────────────────────────────────────────────

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  jobSeekerId: mongoose.Types.ObjectId;
  recruiterName: string;
  jobSeekerName: string;
  company: string;
  role: string;
  lastMessage: string | null;
  lastMessageAt: Date;
  unreadRecruiter: number;
  unreadJobSeeker: number;
  messages: mongoose.Types.DocumentArray<IMessage>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    recruiterId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobSeekerId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recruiterName:   { type: String, required: true, trim: true },
    jobSeekerName:   { type: String, required: true, trim: true },
    company:         { type: String, required: true, trim: true },
    role:            { type: String, required: true, trim: true },
    lastMessage:     { type: String, default: null },
    lastMessageAt:   { type: Date, default: Date.now },
    unreadRecruiter: { type: Number, default: 0, min: 0 },
    unreadJobSeeker: { type: Number, default: 0, min: 0 },
    messages:        { type: [MessageSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    //   transform(_doc, ret) {
    //     ret.id          = ret._id.toString();
    //     ret.recruiterId = ret.recruiterId?.toString?.() ?? ret.recruiterId;
    //     ret.jobSeekerId = ret.jobSeekerId?.toString?.() ?? ret.jobSeekerId;
    //     delete ret._id;
    //     delete ret.__v;
    //   },
    },
  }
);

// One conversation per recruiter–seeker pair
ConversationSchema.index({ recruiterId: 1, jobSeekerId: 1 }, { unique: true });

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ??
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;