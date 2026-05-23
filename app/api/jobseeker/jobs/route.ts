// app/api/jobseeker/jobs/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/db";
import { verifyToken } from "@/Utils/verifytoken";
import User from "@/modal/user.modal";
import Job from "@/modal/job.modal";
import Application from "@/modal/application.modal";
import Candidate from "@/modal/candiate.modal";
import type { ApplicationStatus, JobType } from "@/types/index";

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

// ── GET /api/jobseeker/jobs ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const seekerId = new mongoose.Types.ObjectId(auth.userId);
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const type = searchParams.get("type") as JobType | null;
    const remote = searchParams.get("remote");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? 20))
    );
    const skip = (page - 1) * limit;

    // ── Job filter ────────────────────────────────────────────────────────
    const filter: Record<string, unknown> = { status: "OPEN" };
    if (type) filter.type = type;
    if (remote === "true") filter.remote = true;
    if (remote === "false") filter.remote = false;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Job.countDocuments(filter),
    ]);

    // ── Merge application status ──────────────────────────────────────────
    const jobIds = (jobs as any[]).map((j) => j._id);
    const apps = (await Application.find({
      seekerId,
      jobId: { $in: jobIds },
    })
      .select("jobId status")
      .lean()) as any[];

    const appMap = new Map<string, { id: string; status: ApplicationStatus }>();
    apps.forEach((a) =>
      appMap.set(a.jobId.toString(), { id: a._id.toString(), status: a.status })
    );

    const data = (jobs as any[]).map((j) => {
      const jid = j._id.toString();
      const app = appMap.get(jid);
      return {
        id: jid,
        title: j.title,
        company: j.company,
        location: j.location ?? "",
        type: j.type,
        salary: j.salary ?? null,
        description: j.description ?? "",
        requiredSkills: j.requiredSkills ?? j.skills ?? [],
        remote: j.remote ?? false,
        postedDate: j.createdAt ? new Date(j.createdAt).toISOString() : null,
        applicationStatus: app?.status ?? null,
        applicationId: app?.id ?? null,
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
    console.error("[GET /api/jobseeker/jobs]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── POST /api/jobseeker/jobs ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const seekerId = new mongoose.Types.ObjectId(auth.userId);
    const body = await req.json();

    const { jobId, coverLetter, resumeUrl, experience, skills } = body;

    if (!jobId?.trim())
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(jobId))
      return NextResponse.json(
        { error: "jobId is not a valid ObjectId" },
        { status: 400 }
      );

    const jid = new mongoose.Types.ObjectId(jobId);

    // ── Load job + seeker in parallel ─────────────────────────────────────
    const [job, seeker] = await Promise.all([
      Job.findById(jid)
        .select("recruiterId title company status")
        .lean() as Promise<any>,
      User.findById(seekerId)
        .select("Name name email phone imageUrl")
        .lean() as Promise<any>,
    ]);

    if (!job)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (!seeker)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (job.status !== "OPEN")
      return NextResponse.json(
        { error: "This position is no longer accepting applications" },
        { status: 400 }
      );

    // ── Duplicate check ───────────────────────────────────────────────────
    const existing = await Application.findOne({ jobId: jid, seekerId }).lean();
    if (existing)
      return NextResponse.json(
        { error: "You have already applied for this position" },
        { status: 409 }
      );

    // ── Sequential double-write with manual cleanup on failure ────────────
    let application: any = null;

    try {
      // 1. Create Application (Using 'as any' to bypass overly strict overload checks)
      application = await Application.create({
        seekerId,
        jobId: jid,
        status: "APPLIED",
        coverLetter: coverLetter?.trim() ?? null,
        resumeUrl: resumeUrl?.trim() ?? null,
        experience: experience?.trim() ?? null,
        skills: Array.isArray(skills) ? skills : [],
        appliedAt: new Date(),
      } as any);

      // 2. Create Candidate mirror copy
      await Candidate.create({
        applicationId: application._id,
        seekerId,
        recruiterId: job.recruiterId,
        jobId: jid,
        name: seeker.Name ?? seeker.name ?? "Unknown",
        email: seeker.email ?? "",
        phone: seeker.phone ?? null,
        jobTitle: job.title ?? "Unknown Position",
        company: job.company ?? "",
        status: "APPLIED",
        experience: experience?.trim() ?? null,
        skills: Array.isArray(skills) ? skills : [],
        resumeUrl: resumeUrl?.trim() ?? null,
        coverLetter: coverLetter?.trim() ?? null,
        appliedAt: application.appliedAt,
      } as any);
    } catch (writeError) {
      if (application?._id) {
        await Application.findByIdAndDelete(application._id);
      }
      throw writeError;
    }

    // Return the application with job details for the frontend
    const populated = (await Application.findById(application._id)
      .populate("jobId", "title company location salary type remote")
      .lean()) as any;

    return NextResponse.json(
      {
        id: undefined,
        status: populated.status,
        appliedAt: undefined,
        applicationId:undefined,
        jobId: undefined,
        jobTitle: populated.jobId?.title ?? job.title,
        company: populated.jobId?.company ?? job.company,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 11000)
      return NextResponse.json(
        { error: "You have already applied for this position" },
        { status: 409 }
      );
    console.error("[POST /api/jobseeker/jobs]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── PATCH /api/jobseeker/jobs?id=<applicationId> ─────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Valid id required" }, { status: 400 });

    const body: { status: ApplicationStatus } = await req.json();
    if (!body.status)
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );

    const seekerId = new mongoose.Types.ObjectId(auth.userId);

    const updated = await Application.findOneAndUpdate(
      { _id: id, seekerId },
      { $set: { status: body.status } },
      { new: true, runValidators: true }
    )
      .populate("jobId", "title company location salary type remote")
      .lean();

    if (!updated)
      return NextResponse.json(
        { error: "Application not found or access denied" },
        { status: 404 }
      );

    await Candidate.findOneAndUpdate(
      { applicationId: id },
      { $set: { status: body.status } }
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/jobseeker/jobs]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/jobseeker/jobs?id=<applicationId> ────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Valid id required" }, { status: 400 });

    const seekerId = new mongoose.Types.ObjectId(auth.userId);

    const deleted = await Application.findOneAndDelete({ _id: id, seekerId });
    if (!deleted)
      return NextResponse.json(
        { error: "Application not found or access denied" },
        { status: 404 }
      );

    await Candidate.findOneAndDelete({ applicationId: id });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/jobseeker/jobs]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
