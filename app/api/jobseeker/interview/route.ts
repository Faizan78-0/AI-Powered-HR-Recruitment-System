// app/api/jobseeker/interviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";

import { connectDB }   from "@/lib/db";
import { verifyToken } from "@/Utils/verifytoken";
import Application     from "@/modal/application.modal";
import Interview       from "@/modal/interview.modal";
import Job             from "@/modal/job.modal";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuth(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

// ─── GET /api/jobseeker/interviews ────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const auth = await getAuth();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(auth.userId);

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 50)));
    const skip  = (page - 1) * limit;

    // ── Step 1: get all application IDs that belong to this seeker ────────
    // Application.seekerId is ref → User, so userId from JWT matches directly.
    const appDocs = await Application.find({ seekerId: userId })
      .select("_id")
      .lean() as Array<{ _id: mongoose.Types.ObjectId }>;

    const appIds = appDocs.map((a) => a._id);

    // ── Step 2: query interviews ──────────────────────────────────────────
    // Primary key: candidateId = User._id (set by recruiter when scheduling).
    // Fallback:    applicationId in seeker's app list (catches older records
    //              where candidateId may have been omitted or mis-set).
    const seekerFilter =
      appIds.length > 0
        ? { $or: [{ candidateId: userId }, { applicationId: { $in: appIds } }] }
        : { candidateId: userId };

    const [rawInterviews, total] = await Promise.all([
      Interview.find(seekerFilter)
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path:  "applicationId",
          model: Application,
          populate: { path: "jobId", model: Job, select: "title company location" },
        })
        .lean(),
      Interview.countDocuments(seekerFilter),
    ]);

    // ── Step 3: shape for frontend ────────────────────────────────────────
    const data = (rawInterviews as any[]).map((iv) => {
      const app = iv.applicationId;   // populated Application (may be null for old data)
      const job = app?.jobId;         // populated Job

      return {
        id:            iv._id.toString(),
        // Prefer denormalised fields on Interview; fall back to populated Job data
        company:       iv.company       || job?.company  || "Unknown Company",
        role:          iv.role          || job?.title    || "Unknown Role",
        location:      job?.location    || null,
        recruiterName: iv.recruiterName || "Recruiter",
        date:          iv.date          || "",
        time:          iv.time          || "00:00",
        type:          iv.type          || "VIDEO_CALL",
        status:        iv.status        || "SCHEDULED",
        meetingLink:   iv.meetingLink   || null,
        notes:         iv.notes         || null,
      };
    });

    return NextResponse.json({ data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[GET /api/jobseeker/interviews]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}