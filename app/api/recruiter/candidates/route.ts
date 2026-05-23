import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/Utils/verifytoken";
import User from "@/modal/user.modal";
import Job from "@/modal/job.modal";
import Application from "@/modal/application.modal";
import Conversation from "@/modal/conversation.modal";
import type { ApplicationStatus } from "@/types";

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

// ── GET /api/recruiter/candidates ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit  = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const skip   = (page - 1) * limit;
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const jobId  = searchParams.get("jobId")?.trim()  ?? "";

    // Get all jobs belonging to this recruiter
    const recruiterJobs = await Job.find({
      recruiterId: new mongoose.Types.ObjectId(auth.userId),
    })
      .select("_id title company")
      .lean() as any[];

    const jobIds = recruiterJobs.map((j) => j._id);
    if (jobIds.length === 0)
      return NextResponse.json({ data: [], total: 0, jobs: [] });

    // Build application filter
    const appFilter: any = { jobId: { $in: jobIds } };
    if (status && status !== "ALL") appFilter.status = status;
    if (jobId  && mongoose.Types.ObjectId.isValid(jobId))
      appFilter.jobId = new mongoose.Types.ObjectId(jobId);

    // If searching, resolve matching seeker IDs first
    let seekerFilter: mongoose.Types.ObjectId[] | null = null;
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { Name:  { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      })
        .select("_id")
        .lean() as any[];
      seekerFilter = matchingUsers.map((u) => u._id);
      appFilter.seekerId = { $in: seekerFilter };
    }

    const [applications, total] = await Promise.all([
      Application.find(appFilter)
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "seekerId", model: User, select: "Name email phone imageUrl" })
        .populate({ path: "jobId",    model: Job,  select: "title company"            })
        .lean(),
      Application.countDocuments(appFilter),
    ]);

    const data = (applications as any[]).map((app) => ({
      id:            app._id.toString(),
      _id:           app._id.toString(),
      applicationId: app._id.toString(),
      seekerId:      app.seekerId?._id?.toString() ?? null,
      name:          app.seekerId?.Name  ?? "Unknown",
      email:         app.seekerId?.email ?? "",
      phone:         app.seekerId?.phone ?? null,
      avatar:        app.seekerId?.imageUrl ?? null,
      jobId:         app.jobId?._id?.toString() ?? null,
      jobTitle:      app.jobId?.title   ?? "Unknown Position",
      company:       app.jobId?.company ?? "",
      status:        app.status as ApplicationStatus,
      rating:        app.rating  ?? 0,
      experience:    app.experience ?? null,
      skills:        app.skills  ?? [],
      notes:         app.notes   ?? null,
      resumeUrl:     app.resumeUrl   ?? null,
      coverLetter:   app.coverLetter ?? null,
      appliedAt:     app.appliedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      jobs:  recruiterJobs.map((j) => ({ _id: j._id.toString(), title: j.title })),
    });
  } catch (error) {
    console.error("[GET /api/recruiter/candidates]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH /api/recruiter/candidates?id= ──────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Valid application id required" }, { status: 400 });

    const { status }: { status: ApplicationStatus } = await req.json();

    const validStatuses: ApplicationStatus[] = [
      "APPLIED", "SCREENING", "REVIEWING", "INTERVIEW_SCHEDULED",
      "OFFER", "HIRED", "ACCEPTED", "REJECTED", "WITHDRAWN",
    ];
    if (!validStatuses.includes(status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    // Verify application belongs to this recruiter
    const application = await Application.findById(id)
      .populate({ path: "jobId", model: Job, select: "recruiterId" })
      .lean() as any;

    if (!application)
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    if (application.jobId?.recruiterId?.toString() !== auth.userId)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    await Application.findByIdAndUpdate(id, { $set: { status } });

    // ── On ACCEPTED: create a conversation if one doesn't exist yet ──────
    if (status === "ACCEPTED") {
      const seekerId = application.seekerId?.toString();
      if (seekerId) {
        await Conversation.findOneAndUpdate(
          { applicationId: new mongoose.Types.ObjectId(id) },
          {
            $setOnInsert: {
              applicationId:   new mongoose.Types.ObjectId(id),
              recruiterId:     new mongoose.Types.ObjectId(auth.userId),
              seekerId:        new mongoose.Types.ObjectId(seekerId),
              messages:        [],
              lastMessage:     "",
              lastMessageAt:   new Date(),
              unreadRecruiter: 0,
              unreadJobSeeker: 0,
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("[PATCH /api/recruiter/candidates]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}