// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/db";
import { verifyToken } from "@/Utils/verifytoken";
import Notification from "@/modal/notification.modal";

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

// ── GET /api/notifications ────────────────────────────────────────────────────
// Query: ?unreadOnly=true &page= &limit=
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page       = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit      = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const skip       = (page - 1) * limit;

    const filter: any = { recipientId: new mongoose.Types.ObjectId(auth.userId) };
    if (unreadOnly) filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        recipientId: new mongoose.Types.ObjectId(auth.userId),
        isRead:      false,
      }),
    ]);

    return NextResponse.json({
      data: notifications.map((n: any) => ({
        ...n,
        id:  n._id.toString(),
        _id: undefined,
      })),
      total,
      unreadCount,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH /api/notifications ──────────────────────────────────────────────────
// Mark notifications as read.
// Body: { ids?: string[] }  — if ids omitted, marks ALL as read
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const uid  = new mongoose.Types.ObjectId(auth.userId);

    const filter: any = { recipientId: uid, isRead: false };
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      filter._id = {
        $in: body.ids
          .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
          .map((id: string) => new mongoose.Types.ObjectId(id)),
      };
    }

    const result = await Notification.updateMany(filter, { $set: { isRead: true } });

    return NextResponse.json({ updated: result.modifiedCount });
  } catch (error) {
    console.error("[PATCH /api/notifications]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE /api/notifications?id= ────────────────────────────────────────────
// Delete a single notification (or all if no id given).
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const uid = new mongoose.Types.ObjectId(auth.userId);
    const id  = new URL(req.url).searchParams.get("id");

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id))
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });

      const deleted = await Notification.findOneAndDelete({ _id: id, recipientId: uid });
      if (!deleted)
        return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
    } else {
      // Clear all notifications for this user
      await Notification.deleteMany({ recipientId: uid });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/notifications]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}