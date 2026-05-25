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

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

// ── GET /api/jobseeker/jobs ───────────────────────────────────────────────────
// Returns paginated open jobs, each annotated with the seeker's application
// status (if any) and whether the seeker has saved that job.

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

    // ── Job filter ──────────────────────────────────────────────────────────
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

    const jobIds = (jobs as any[]).map((j) => j._id);

    // ── Fetch seeker's applications for these jobs ───────────────────────────
    const apps = (await Application.find({
      seekerId,
      jobId: { $in: jobIds },
    })
      .select("jobId status")
      .lean()) as any[];

    const appMap = new Map<string, { id: string; status: ApplicationStatus }>();
    apps.forEach((a) =>
      appMap.set(a.jobId.toString(), {
        id: a._id.toString(),
        status: a.status,
      })
    );

    // ── Fetch seeker's saved job IDs ────────────────────────────────────────
    const userDoc = (await User.findById(seekerId)
      .select("savedJobs")
      .lean()) as any;
    const savedSet = new Set<string>(
      (userDoc?.savedJobs ?? []).map((id: any) => id.toString())
    );

    // ── Shape response ──────────────────────────────────────────────────────
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
        // NEW: tell the frontend whether this job is saved
        isSaved: savedSet.has(jid),
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
// Handles two actions depending on the `action` field in the body:
//   action === "save"   → toggle save/unsave a job (no application created)
//   action === "apply"  → submit an application  (default when omitted)

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const seekerId = new mongoose.Types.ObjectId(auth.userId);
    const body = await req.json();
    const { action = "apply", jobId, coverLetter, resumeUrl, experience, skills } = body;

    // ── Validate jobId (shared by both actions) ─────────────────────────────
    if (!jobId?.trim())
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(jobId))
      return NextResponse.json(
        { error: "jobId is not a valid ObjectId" },
        { status: 400 }
      );

    const jid = new mongoose.Types.ObjectId(jobId);

    // ════════════════════════════════════════════════════════════════════════
    // ACTION: save / unsave
    // ════════════════════════════════════════════════════════════════════════
    if (action === "save") {
      const userDoc = (await User.findById(seekerId)
        .select("savedJobs")
        .lean()) as any;
      if (!userDoc)
        return NextResponse.json({ error: "User not found" }, { status: 404 });

      const savedIds: string[] = (userDoc.savedJobs ?? []).map((id: any) =>
        id.toString()
      );
      const isAlreadySaved = savedIds.includes(jid.toString());

      if (isAlreadySaved) {
        // Unsave
        await User.findByIdAndUpdate(seekerId, {
          $pull: { savedJobs: jid },
        });
        return NextResponse.json({ saved: false });
      } else {
        // Save
        await User.findByIdAndUpdate(seekerId, {
          $addToSet: { savedJobs: jid },
        });
        return NextResponse.json({ saved: true });
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACTION: apply
    // ════════════════════════════════════════════════════════════════════════

    // Load job + seeker in parallel
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

    // ── Duplicate check — scoped to THIS specific job ───────────────────────
    // BUG FIX: the previous code was correct in logic but the Candidate.create()
    // below was throwing a duplicate-key error (11000) for a DIFFERENT unique
    // index (e.g. seekerId alone, or a compound index without jobId), which
    // caused the cleanup to delete the freshly created Application and bubble
    // up the misleading "already applied" message.
    // Fix: use findOneAndUpdate (upsert) for Candidate so it never throws 11000.
    const existing = await Application.findOne({
      jobId: jid,
      seekerId,
    }).lean();

    if (existing)
      return NextResponse.json(
        { error: "You have already applied for this position" },
        { status: 409 }
      );

    // ── Create Application ──────────────────────────────────────────────────
    const application = await Application.create({
      seekerId,
      jobId: jid,
      status: "APPLIED",
      coverLetter: coverLetter?.trim() ?? null,
      resumeUrl: resumeUrl?.trim() ?? null,
      experience: experience?.trim() ?? null,
      skills: Array.isArray(skills) ? skills : [],
      appliedAt: new Date(),
    } as any);

    // ── Upsert Candidate mirror (safe — never throws 11000) ─────────────────
    // BUG FIX: replaced Candidate.create() with findOneAndUpdate + upsert:true.
    // If a stale Candidate doc already exists for this seekerId+jobId combo
    // (e.g. from a previous partial write), we update it instead of crashing.
    try {
      await Candidate.findOneAndUpdate(
        { seekerId, jobId: jid },
        {
          $set: {
            applicationId: application._id,
            recruiterId: job.recruiterId,
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
          },
        },
        { upsert: true, new: true }
      );
    } catch (candidateError) {
      // Candidate mirror failed — roll back the Application to keep data consistent
      await Application.findByIdAndDelete(application._id);
      console.error("[POST /api/jobseeker/jobs] Candidate upsert failed, rolled back application:", candidateError);
      throw candidateError;
    }

    return NextResponse.json(
      {
        applicationId: application._id.toString(),
        status: "APPLIED",
        jobTitle: job.title,
        company: job.company,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // This 11000 can only come from Application (seekerId+jobId unique index) now
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