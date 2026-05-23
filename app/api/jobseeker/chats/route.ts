import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/Utils/verifytoken";
import Conversation from "@/modal/conversation.modal";
import User from "@/modal/user.modal";
import Application from "@/modal/application.modal";
import Job from "@/modal/job.modal";

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

function shapeMessage(m: any, seekerId: string) {
  const isMe = m.senderRole === "JOB_SEEKER";
  return {
    id:             m._id.toString(),
    text:           m.text,
    senderId:       isMe ? "me" : m.senderId?.toString(),
    sender:         isMe ? "me" : "them",
    senderRole:     m.senderRole,
    time:           new Date(m.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit", minute: "2-digit",
                    }),
    read:           m.read,
    createdAt:      m.createdAt,
    conversationId: m.conversationId?.toString() ?? "",
  };
}

// ── GET /api/jobseeker/chat ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const convId = searchParams.get("conversationId");

    // ── Single conversation ───────────────────────────────────────────────
    if (convId) {
      if (!mongoose.Types.ObjectId.isValid(convId))
        return NextResponse.json({ error: "Invalid conversationId" }, { status: 400 });

      const conv = await Conversation.findOne({
        _id:      new mongoose.Types.ObjectId(convId),
        seekerId: new mongoose.Types.ObjectId(auth.userId),
      })
        .populate({ path: "recruiterId",   model: User,        select: "Name email imageUrl" })
        .populate({
          path:  "applicationId",
          model: Application,
          populate: { path: "jobId", model: Job, select: "title company" },
        });

      if (!conv)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Mark recruiter messages as read
      let changed = false;
      conv.messages.forEach((m: any) => {
        if (m.senderRole === "Recruiter" && !m.read) {
          m.read  = true;
          changed = true;
        }
      });
      if (changed || conv.unreadJobSeeker > 0) {
        conv.unreadJobSeeker = 0;
        await conv.save();
      }

      const recruiter = conv.recruiterId as any;
      const job       = (conv.applicationId as any)?.jobId;

      return NextResponse.json({
        id:          conv._id.toString(),
        name:        recruiter?.Name  ?? "Recruiter",
        role:        job?.title       ?? "Position",
        company:     job?.company     ?? "",
        online:      false,
        unread:      0,
        lastMessage: conv.lastMessage ?? "",
        time: conv.lastMessageAt
          ? new Date(conv.lastMessageAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "",
        messages: conv.messages.map((m: any) => shapeMessage(m, auth.userId)),
      });
    }

    // ── Conversation list ─────────────────────────────────────────────────
    const convs = await Conversation.find({
      seekerId: new mongoose.Types.ObjectId(auth.userId),
    })
      .sort({ lastMessageAt: -1 })
      .populate({ path: "recruiterId",   model: User,        select: "Name email imageUrl" })
      .populate({
        path:  "applicationId",
        model: Application,
        populate: { path: "jobId", model: Job, select: "title company" },
      })
      .select("-messages")
      .lean();

    const shaped = (convs as any[]).map((c) => ({
      id:          c._id.toString(),
      name:        (c.recruiterId as any)?.Name ?? "Recruiter",
      role:        (c.applicationId as any)?.jobId?.title   ?? "Position",
      company:     (c.applicationId as any)?.jobId?.company ?? "",
      online:      false,
      unread:      c.unreadJobSeeker ?? 0,
      lastMessage: c.lastMessage ?? "",
      time: c.lastMessageAt
        ? new Date(c.lastMessageAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        : "",
      messages: [],
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("[GET /api/jobseeker/chat]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/jobseeker/chat ──────────────────────────────────────────────────
// Body: { conversationId, text }
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { conversationId, text } = await req.json();

    if (!conversationId?.trim())
      return NextResponse.json({ error: "conversationId required" }, { status: 400 });
    if (!text?.trim())
      return NextResponse.json({ error: "text required" }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(conversationId))
      return NextResponse.json({ error: "Invalid conversationId" }, { status: 400 });

    const conv = await Conversation.findOne({
      _id:      new mongoose.Types.ObjectId(conversationId),
      seekerId: new mongoose.Types.ObjectId(auth.userId),
    });
    if (!conv)
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const message = {
      _id:        new mongoose.Types.ObjectId(),
      senderId:   new mongoose.Types.ObjectId(auth.userId),
      senderRole: "Job seeker" as const,
      text:       text.trim(),
      read:       false,
      createdAt:  new Date(),
    };

    conv.messages.push(message as any);
    conv.lastMessage     = text.trim();
    conv.lastMessageAt   = new Date();
    conv.unreadRecruiter = (conv.unreadRecruiter ?? 0) + 1;
    await conv.save();

    const saved = conv.messages[conv.messages.length - 1];
    return NextResponse.json(
      shapeMessage({ ...saved.toObject(), conversationId }, auth.userId),
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/jobseeker/chat]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH /api/jobseeker/chat?conversationId= ─────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const convId = new URL(req.url).searchParams.get("conversationId");
    if (!convId || !mongoose.Types.ObjectId.isValid(convId))
      return NextResponse.json({ error: "Valid conversationId required" }, { status: 400 });

    const conv = await Conversation.findOne({
      _id:      new mongoose.Types.ObjectId(convId),
      seekerId: new mongoose.Types.ObjectId(auth.userId),
    });
    if (!conv)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    conv.messages.forEach((m: any) => {
      if (m.senderRole === "Recruiter") m.read = true;
    });
    conv.unreadJobSeeker = 0;
    await conv.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/jobseeker/chat]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}