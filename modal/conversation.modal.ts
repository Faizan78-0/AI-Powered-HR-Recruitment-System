import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: "Recruiter" | "Job seeker";
  text: string;
  read: boolean;
  createdAt: Date;
}

export interface IConversation extends Document {
  applicationId: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  seekerId: mongoose.Types.ObjectId;
  messages: IMessage[];
  lastMessage: string;
  lastMessageAt: Date;
  unreadRecruiter: number;
  unreadJobSeeker: number;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderRole: {
      type: String,
      enum: ["Recruiter", "Job seeker"],
      required: true,
    },
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ConversationSchema = new Schema<IConversation>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
    },
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    seekerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messages: { type: [MessageSchema], default: [] },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    unreadRecruiter: { type: Number, default: 0 },
    unreadJobSeeker: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Conversation ??
  mongoose.model<IConversation>("Conversation", ConversationSchema);
