// app/api/jobseeker/dashboard/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";

import { connectDB }   from "@/lib/db";
import Application     from "@/modal/application.modal";
import Interview       from "@/modal/interview.modal";
import Job             from "@/modal/job.modal";
import User            from "@/modal/user.modal";
import { verifyToken } from "@/Utils/verifytoken";
import type {
  JobSeekerDashboard,
  PipelineStage,
  UpcomingInterview,
  ApplicationStatus,
  InterviewType,
} from "@/types/index";

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

export async function GET(_req: NextRequest) {
  try {
    await connectDB();

    const decoded = await getAuth();
    if (!decoded?.userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const userId   = new mongoose.Types.ObjectId(decoded.userId);
    const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    // ── Step 1: seeker's application IDs ─────────────────────────────────────
    const appDocs = await Application.find({ seekerId: userId })
      .select("_id")
      .lean() as Array<{ _id: mongoose.Types.ObjectId }>;

    const appIds  = appDocs.map((a) => a._id);
    const hasApps = appIds.length > 0;

    // ── Step 2: interview filters ─────────────────────────────────────────────
    const ivFilter = (
      hasApps
        ? { $or: [{ candidateId: userId }, { applicationId: { $in: appIds } }] }
        : { candidateId: userId }
    ) as any;

    const upcomingIvFilter = {
      ...ivFilter,
      status: "SCHEDULED",
      date:   { $gte: todayStr },
    } as any;

    // ── Step 3: parallel queries ──────────────────────────────────────────────
    const [
      pipelineAgg,
      openJobsCount,
      recentAppsRaw,
      scheduledIvCount,
      upcomingIvsRaw,
      userRaw,
    ] = await Promise.all([
      Application.aggregate([
        { $match: { seekerId: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      Job.countDocuments({ status: "OPEN" }),

      Application.find({ seekerId: userId })
        .sort({ appliedAt: -1 })
        .limit(5)
        .populate("jobId", "title company location salary type remote")
        .lean(),

      Interview.countDocuments(upcomingIvFilter),

      Interview.find(upcomingIvFilter)
        .sort({ date: 1, time: 1 })
        .limit(3)
        .populate({
          path:  "applicationId",
          model: Application,
          populate: { path: "jobId", model: Job, select: "title company" },
        })
        .lean(),

      // BUG FIX: select savedJobs so we can return the real count
      User.findById(userId)
        .select("Name email imageUrl role isverified savedJobs")
        .lean(),
    ]);

    // ── Stats ─────────────────────────────────────────────────────────────────
    const pipelineTyped     = pipelineAgg as { _id: string; count: number }[];
    const totalApplications = pipelineTyped.reduce((s, p) => s + p.count, 0);

    const pipelineMap = new Map<string, number>(
      pipelineTyped.map((p) => [p._id, p.count])
    );

    const STAGES: ApplicationStatus[] = [
      "APPLIED", "SCREENING", "OFFER", "HIRED", "REJECTED", "WITHDRAWN",
    ];
    const pipeline: PipelineStage[] = STAGES.map((stage) => ({
      stage,
      count: pipelineMap.get(stage) ?? 0,
    }));

    // ── Recent applications ───────────────────────────────────────────────────
    const recentApplications = (recentAppsRaw as any[]).map((app) => ({
      ...app,
      _id:      app._id.toString(),
      seekerId: app.seekerId?.toString() ?? null,
      jobId:    app.jobId
        ? { ...app.jobId, _id: app.jobId._id.toString() }
        : null,
    }));

    // ── Upcoming interviews ───────────────────────────────────────────────────
    const upcomingInterviews: UpcomingInterview[] = (upcomingIvsRaw as any[]).map((iv) => {
      const job = iv.applicationId?.jobId;
      const typeMap: Record<string, string> = {
        VIDEO_CALL:      "VIDEO",
        PHONE_SCREEN:    "PHONE",
        HR_INTERVIEW:    "IN_PERSON",
        TECHNICAL:       "TECHNICAL",
        PANEL:           "PANEL",
        FINAL_INTERVIEW: "FINAL",
      };
      return {
        id:          iv._id.toString(),
        candidate:   iv.recruiterName ?? "Recruiter",
        role:        iv.role || job?.title || "Interview",
        date:        iv.date || "—",
        time:        iv.time || "—",
        type:        (typeMap[iv.type] ?? "VIDEO") as InterviewType,
        meetingLink: iv.meetingLink ?? null,
      };
    });

    // ── Profile completion ────────────────────────────────────────────────────
    let profileCompletion = 0;
    if (userRaw) {
      const u = userRaw as any;
      const checks = [!!u.Name, !!u.email, !!u.imageUrl, !!u.isverified];
      profileCompletion = Math.round(
        (checks.filter(Boolean).length / checks.length) * 100
      );
    }

    // BUG FIX: read real savedJobs count from the user document
    const savedJobsCount = ((userRaw as any)?.savedJobs ?? []).length;

    const response: JobSeekerDashboard = {
      stats: {
        appliedJobs:   totalApplications,
        savedJobs:     savedJobsCount,   // ← was always 0
        interviews:    scheduledIvCount,
        openPositions: openJobsCount,
      },
      pipeline,
      recentApplications,
      upcomingInterviews,
      profileCompletion,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/jobseeker/dashboard]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}