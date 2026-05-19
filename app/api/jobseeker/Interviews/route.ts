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

    // ── Strategy ──────────────────────────────────────────────────────────
    // We query interviews in TWO ways and merge so we catch records regardless
    // of whether the recruiter set candidateId, seekerId, or applicationId:
    //
    //  1. Direct match: Interview.candidateId or Interview.seekerId = userId
    //  2. Via applications: find the seeker's applicationIds, match on applicationId
    //
    // This is robust against data inconsistencies.

    // 1️⃣  Get all application IDs for this seeker
    const appDocs = await Application.find({ seekerId: userId })
      .select("_id jobId")
      .lean() as Array<{ _id: mongoose.Types.ObjectId; jobId?: mongoose.Types.ObjectId }>;

    const appIds = appDocs.map((a) => a._id);

    // 2️⃣  Build a query that matches on ANY of the three seeker identifiers
    //      so a missing/null seekerId on Interview won't hide valid records
    const seekerFilter =
      appIds.length > 0
        ? {
            $or: [
              { candidateId:   userId },
              { seekerId:      userId },
              { applicationId: { $in: appIds } },
            ],
          }
        : {
            $or: [
              { candidateId: userId },
              { seekerId:    userId },
            ],
          };

    // 3️⃣  Fetch interviews + total count in parallel
    const [rawInterviews, total] = await Promise.all([
      Interview.find(seekerFilter)
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path:  "applicationId",
          model: Application,
          populate: {
            path:   "jobId",
            model:  Job,
            select: "title company location",
          },
        })
        .lean(),
      Interview.countDocuments(seekerFilter),
    ]);

    // ── Shape for the frontend ─────────────────────────────────────────────
    const data = (rawInterviews as any[]).map((iv) => {
      const app = iv.applicationId;                // populated Application doc
      const job = app?.jobId;                      // populated Job doc

      return {
        id:            iv._id.toString(),
        company:       iv.company         ?? job?.company  ?? "Unknown Company",
        role:          iv.role            ?? job?.title    ?? "Unknown Role",
        location:      job?.location      ?? iv.location   ?? null,
        recruiterName: iv.recruiterName   ?? "Recruiter",
        date:          iv.date            ?? "",
        time:          iv.time            ?? "00:00",
        type:          iv.type            ?? "VIDEO_CALL",
        status:        iv.status          ?? "SCHEDULED",
        meetingLink:   iv.meetingLink     ?? null,
        notes:         iv.notes           ?? null,
      };
    });

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/jobseeker/interviews]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}