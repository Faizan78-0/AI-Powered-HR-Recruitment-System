// app/api/recruiter/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Conversation from "@/modal/conversation.mpdel";
import type { SendMessageInput } from "@/types/index";

// ── GET /api/recruiter/chat ────────────────────────────────────────────────────
// Query: ?conversationId= (optional)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const convId = searchParams.get("conversationId");

    if (convId) {
      if (!mongoose.Types.ObjectId.isValid(convId)) {
        return NextResponse.json({ error: "conversationId is not a valid ObjectId" }, { status: 400 });
      }

      const conv = await Conversation.findById(convId);
      if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

      // Mark all JOB_SEEKER messages as read and reset recruiter unread counter
      let changed = false;
      conv.messages.forEach((m) => {
        if (m.senderRole === "JOB_SEEKER" && !m.read) {
          m.read = true;
          changed = true;
        }
      });

      if (changed || conv.unreadRecruiter > 0) {
        conv.unreadRecruiter = 0;
        await conv.save();
      }

      return NextResponse.json(conv.toJSON());
    }

    // Conversation list — omit messages array for performance
    const list = await Conversation.find()
      .sort({ lastMessageAt: -1 })
      .select("-messages")
      .lean();

    return NextResponse.json(list);
  } catch (error) {
    console.error("[GET /api/recruiter/chat]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/recruiter/chat ───────────────────────────────────────────────────
// Body: SendMessageInput + { senderId: string }
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body: SendMessageInput & { senderId: string } = await req.json();

    if (!body.conversationId?.trim()) return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    if (!body.text?.trim())           return NextResponse.json({ error: "text is required" },           { status: 400 });
    if (!body.senderId?.trim())       return NextResponse.json({ error: "senderId is required" },       { status: 400 });

    if (!mongoose.Types.ObjectId.isValid(body.conversationId)) return NextResponse.json({ error: "conversationId is not a valid ObjectId" }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(body.senderId))       return NextResponse.json({ error: "senderId is not a valid ObjectId" },       { status: 400 });

    const conv = await Conversation.findById(body.conversationId);
    if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const message = {
      _id:        new mongoose.Types.ObjectId(),
      senderId:   new mongoose.Types.ObjectId(body.senderId),
      senderRole: "RECRUITER" as const,
      text:       body.text.trim(),
      read:       false,
      createdAt:  new Date(),
    };

    conv.messages.push(message as any);
    conv.lastMessage     = body.text.trim();
    conv.lastMessageAt   = new Date();
    conv.unreadJobSeeker = (conv.unreadJobSeeker ?? 0) + 1;

    await conv.save();

    const saved = conv.messages[conv.messages.length - 1];
    return NextResponse.json(saved.toJSON(), { status: 201 });
  } catch (error) {
    console.error("[POST /api/recruiter/chat]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH /api/recruiter/chat?conversationId= ─────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const convId = searchParams.get("conversationId");

    if (!convId) return NextResponse.json({ error: "conversationId query param is required" }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(convId)) return NextResponse.json({ error: "conversationId is not a valid ObjectId" }, { status: 400 });

    const conv = await Conversation.findById(convId);
    if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    conv.messages.forEach((m) => {
      if (m.senderRole === "JOB_SEEKER") m.read = true;
    });
    conv.unreadRecruiter = 0;
    await conv.save();

    return NextResponse.json({ success: true, conversationId: convId });
  } catch (error) {
    console.error("[PATCH /api/recruiter/chat]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}