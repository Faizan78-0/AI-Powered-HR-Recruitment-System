// app/api/jobseeker/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/db";
import Application from "@/modal/application.modal";
import Interview from "@/modal/interview.modal";
import Job from "@/modal/job.modal";
import { JobSeekerProfile } from "@/modal/profile.model";
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

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const decoded = await getAuth();
    if (!decoded?.userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const sid = new mongoose.Types.ObjectId(decoded.userId);

    // Today's date string — Interview schema stores date as YYYY-MM-DD string
    const todayStr = new Date().toISOString().split("T")[0];

    // ── Get seeker's application IDs for Interview queries ────────────────
    const appDocs = (await Application.find({ seekerId: sid })
      .select("_id")
      .lean()) as any[];
    const appIds = appDocs.map((a) => a._id);
    const hasApps = appIds.length > 0;

    // ── Parallel queries ──────────────────────────────────────────────────
    const [
      pipelineAgg,
      openJobsCount,
      recentAppsRaw,
      // FIX: Interview schema does NOT have seekerId — it has applicationId and
      // candidateId. Query by applicationId (which we have from appDocs) and
      // filter by date string >= today, not scheduledAt Date field.
      scheduledIvCount,
      upcomingIvsRaw,
      seekerProfileRaw,
    ] = await Promise.all([
      Application.aggregate([
        { $match: { seekerId: sid } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Job.countDocuments({ status: "OPEN" }),
      Application.find({ seekerId: sid })
        .sort({ appliedAt: -1 })
        .limit(5)
        .populate("jobId", "title company location salary type remote")
        .lean(),

      // FIX: query by applicationId (seeker's apps), filter SCHEDULED + future dates
      hasApps
        ? Interview.countDocuments({
            applicationId: { $in: appIds },
            status: "SCHEDULED",
            date: { $gte: todayStr },
          })
        : Promise.resolve(0),

      hasApps
        ? Interview.find({
            applicationId: { $in: appIds },
            status: "SCHEDULED",
            date: { $gte: todayStr },
          })
            .sort({ date: 1, time: 1 })
            .limit(3)
            // FIX: explicit model refs for reliable nested populate
            .populate({
              path: "applicationId",
              model: Application,
              populate: {
                path: "jobId",
                model: Job,
                select: "title company",
              },
            })
            .lean()
        : Promise.resolve([]),

      JobSeekerProfile.findOne({ userId: sid })
        .populate("userId", "name email avatar")
        .lean(),
    ]);

    // ── Stats ─────────────────────────────────────────────────────────────
    const pipelineAggTyped = pipelineAgg as { _id: string; count: number }[];
    const totalApplications = pipelineAggTyped.reduce((s, p) => s + p.count, 0);

    const pipelineMap = new Map<string, number>(
      pipelineAggTyped.map((p) => [p._id, p.count])
    );

    const STAGES: ApplicationStatus[] = [
      "APPLIED",
      "SCREENING",
      "OFFER",
      "HIRED",
      "REJECTED",
      "WITHDRAWN",
    ];
    const pipeline: PipelineStage[] = STAGES.map((stage) => ({
      stage,
      count: pipelineMap.get(stage) ?? 0,
    }));

    // ── Recent applications ───────────────────────────────────────────────
    const recentApplications = (recentAppsRaw as any[]).map((app) => ({
      ...app,
      _id: app._id.toString(),
      seekerId: app.seekerId?.toString() ?? null,
      jobId: app.jobId ? { ...app.jobId, _id: app.jobId._id.toString() } : null,
    }));

    // ── Upcoming interviews ───────────────────────────────────────────────
    // FIX: shape from applicationId populate, not from direct Interview fields
    const upcomingInterviews: UpcomingInterview[] = (
      upcomingIvsRaw as any[]
    ).map((i) => {
      const job = i.applicationId?.jobId;
      // Map stored type enum → frontend canonical value
      const typeMap: Record<string, string> = {
        VIDEO_CALL: "VIDEO",
        PHONE_SCREEN: "PHONE",
        HR_INTERVIEW: "IN_PERSON",
        VIDEO: "VIDEO",
        PHONE: "PHONE",
        IN_PERSON: "IN_PERSON",
      };
      return {
        id: i._id.toString(),
        candidate: i.recruiterName ?? "Recruiter", // recruiter's name shown to seeker
        role: job?.title ?? i.role ?? "Interview",
        date: i.date ?? "—",
        time: i.time ?? "—",
        type: (typeMap[i.type] ?? "VIDEO") as InterviewType,
        meetingLink: i.meetingLink ?? null,
      };
    });

    // ── Profile completion ────────────────────────────────────────────────
    let profileCompletion = 0;
    if (seekerProfileRaw) {
      const sp = seekerProfileRaw as any;
      const user = sp.userId as any;
      const fields = [
        user?.name,
        user?.email,
        sp.headline,
        sp.phone,
        sp.location,
        sp.linkedinUrl,
        sp.portfolioUrl,
        sp.education,
        sp.summary,
      ];
      const filled = fields.filter(Boolean).length;
      const skillsBonus = (sp.skills?.length ?? 0) > 0 ? 1 : 0;
      profileCompletion = Math.round(
        ((filled + skillsBonus) / (fields.length + 1)) * 100
      );
    }

    const savedJobsCount = (seekerProfileRaw as any)?.savedJobs?.length ?? 0;

    const response: JobSeekerDashboard = {
      stats: {
        appliedJobs: totalApplications,
        savedJobs: savedJobsCount,
        interviews: scheduledIvCount,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
