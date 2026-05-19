// app/api/recruiter/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/db";
import { verifyToken } from "@/Utils/verifytoken";
import User from "@/modal/user.modal";
import Job from "@/modal/job.modal";
import Application from "@/modal/application.modal";
import Candidate from "@/modal/candiate.modal";
import Interview from "@/modal/interview.modal";

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

// Reverse the type enum stored in Interview back to the frontend canonical value
function reverseMapType(stored: string): "VIDEO" | "PHONE" | "IN_PERSON" {
  switch (stored) {
    case "VIDEO_CALL":
      return "VIDEO";
    case "PHONE_SCREEN":
      return "PHONE";
    case "HR_INTERVIEW":
      return "IN_PERSON";
    case "VIDEO":
      return "VIDEO";
    case "PHONE":
      return "PHONE";
    case "IN_PERSON":
      return "IN_PERSON";
    default:
      return "VIDEO";
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const decoded = await getAuth();
    if (!decoded?.userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const recruiterId = new mongoose.Types.ObjectId(decoded.userId);

    // ── 1. Jobs ───────────────────────────────────────────────────────────────
    const [jobAgg, recruiterJobs] = await Promise.all([
      Job.aggregate([
        { $match: { recruiterId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Job.find({ recruiterId }).select("_id").lean() as Promise<any[]>,
    ]);

    const jobStatusMap: Record<string, number> = Object.fromEntries(
      jobAgg.map((s: any) => [s._id, s.count])
    );
    const recruiterJobIds = recruiterJobs.map((j) => j._id);

    if (!recruiterJobIds.length) {
      return NextResponse.json({
        stats: {
          activeJobs: 0,
          newCandidates: 0,
          interviews: 0,
          hireRate: "0%",
          totalApplications: 0,
        },
        pipeline: [],
        recentApplications: [],
        upcomingInterviews: [],
        jobSummary: { open: 0, draft: 0, paused: 0, filled: 0, closed: 0 },
      });
    }

    // ── 2. Interview date guard ────────────────────────────────────────────
    // Interview schema stores date as a YYYY-MM-DD string, not a Date field.
    const todayStr = new Date().toISOString().split("T")[0];

    // ── 3. Application IDs for Interview filter ───────────────────────────
    const allAppDocs = (await Application.find({
      jobId: { $in: recruiterJobIds },
    })
      .select("_id")
      .lean()) as any[];
    const allAppIds = allAppDocs.map((a) => a._id);
    const hasApps = allAppIds.length > 0;

    // ── 4. All parallel queries ────────────────────────────────────────────
    const [
      totalApplications,
      hiredCount,
      pipelineAgg, // from Candidate model — stays in sync with recruiter view
      recentCandidates, // FIX: query Candidate, not Application
      scheduledIvCount,
      upcomingIvs,
    ] = await Promise.all([
      // Total — count from Candidate so it matches the candidates page exactly
      Candidate.countDocuments({ recruiterId }),

      // Hired / accepted
      Candidate.countDocuments({
        recruiterId,
        status: { $in: ["HIRED", "ACCEPTED"] },
      }),

      // Pipeline breakdown — from Candidate model
      Candidate.aggregate([
        { $match: { recruiterId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Recent 5 — Candidate has all fields denormalised; no populate needed
      Candidate.find({ recruiterId })
        .sort({ appliedAt: -1 })
        .limit(5)
        .lean() as Promise<any[]>,

      // Interviews count
      hasApps
        ? Interview.countDocuments({
            applicationId: { $in: allAppIds },
            status: "SCHEDULED",
            date: { $gte: todayStr },
          })
        : Promise.resolve(0),

      // Upcoming interviews — need seekerId/jobId populate for candidate name
      hasApps
        ? (Interview.find({
            applicationId: { $in: allAppIds },
            status: "SCHEDULED",
            date: { $gte: todayStr },
          })
            .sort({ date: 1, time: 1 })
            .limit(5)
            .populate({
              path: "applicationId",
              model: Application,
              populate: [
                { path: "seekerId", model: User, select: "Name email" },
                { path: "jobId", model: Job, select: "title company" },
              ],
            })
            .lean() as Promise<any[]>)
        : Promise.resolve([]),
    ]);

    // ── 5. Pipeline ───────────────────────────────────────────────────────
    const pipelineMap = new Map<string, number>(
      (pipelineAgg as any[]).map((p) => [p._id, p.count])
    );
    const STAGES = [
      "APPLIED",
      "SCREENING",
      "REVIEWING",
      "INTERVIEW_SCHEDULED",
      "OFFER",
      "HIRED",
      "ACCEPTED",
      "REJECTED",
      "WITHDRAWN",
    ];
    const pipeline = STAGES.map((stage) => ({
      stage,
      count: pipelineMap.get(stage) ?? 0,
    })).filter((p) => p.count > 0);

    const hireRate =
      totalApplications > 0
        ? `${Math.round((hiredCount / totalApplications) * 100)}%`
        : "0%";

    // ── 6. Shape recentApplications ───────────────────────────────────────
    // FIX: Candidate has name/email/jobTitle/status already — no populate
    const recentApplications = (recentCandidates as any[]).map((c) => ({
      id: c._id.toString(),
      candidateName: c.name ?? "Unknown",
      email: c.email ?? "",
      avatar: null,
      jobRole: c.jobTitle ?? "Unknown Position",
      company: c.company ?? "",
      status: c.status,
      appliedAt: c.appliedAt ? new Date(c.appliedAt).toISOString() : "",
      score: Math.round((c.rating ?? 3) * 20),
      coverLetter: c.coverLetter ?? null,
    }));

    // ── 7. Shape upcomingInterviews ───────────────────────────────────────
    const upcomingInterviews = (upcomingIvs as any[]).map((i) => {
      const combined =
        i.date && i.time ? new Date(`${i.date}T${i.time}`) : null;
      return {
        id: i._id.toString(),
        candidate: i.applicationId?.seekerId?.Name ?? "Unknown",
        email: i.applicationId?.seekerId?.email ?? "",
        role: i.applicationId?.jobId?.title ?? i.role ?? "Position",
        date: i.date
          ? new Date(i.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "—",
        time:
          combined && !isNaN(combined.getTime())
            ? combined.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : i.time ?? "—",
        type: reverseMapType(i.type),
        meetingLink: i.meetingLink ?? null,
        notes: i.notes ?? null,
      };
    });

    return NextResponse.json({
      stats: {
        activeJobs: jobStatusMap["OPEN"] ?? 0,
        // FIX: count from Candidate model, not pipelineMap — consistent with
        // the candidates page which also reads from Candidate.
        newCandidates: pipelineMap.get("APPLIED") ?? 0,
        interviews: scheduledIvCount,
        hireRate,
        totalApplications,
      },
      pipeline,
      recentApplications,
      upcomingInterviews,
      jobSummary: {
        open: jobStatusMap["OPEN"] ?? 0,
        draft: jobStatusMap["DRAFT"] ?? 0,
        paused: jobStatusMap["PAUSED"] ?? 0,
        filled: jobStatusMap["FILLED"] ?? 0,
        closed: jobStatusMap["CLOSED"] ?? 0,
      },
    });
  } catch (error) {
    console.error("[GET /api/recruiter/dashboard]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
