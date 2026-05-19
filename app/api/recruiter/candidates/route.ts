// app/api/recruiter/candidates/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/db";
import { verifyToken } from "@/Utils/verifytoken";
import Candidate from "@/modal/candiate.modal";
import Job from "@/modal/job.modal";
import Application from "@/modal/application.modal";

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

// Shape a Candidate document → UI-ready object
function toShape(c: any) {
  return {
    id: c._id.toString(),
    _id: c._id.toString(),
    applicationId: c.applicationId?.toString() ?? c._id.toString(),
    seekerId: c.seekerId?.toString() ?? null,
    // Normalised name (schema stores lowercase string already)
    name: c.name ?? "Unknown",
    email: c.email ?? "",
    phone: c.phone ?? null,
    avatar: null, // not stored on Candidate — load on demand if needed
    jobId: c.jobId?.toString() ?? null,
    jobTitle: c.jobTitle ?? "Unknown Position",
    company: c.company ?? "",
    status: c.status ?? "APPLIED",
    rating: c.rating ?? 3,
    experience: c.experience ?? null,
    skills: c.skills ?? [],
    notes: c.notes ?? null,
    resumeUrl: c.resumeUrl ?? null,
    coverLetter: c.coverLetter ?? null,
    appliedAt: c.appliedAt ? new Date(c.appliedAt).toISOString() : null,
    appliedDate: c.appliedAt ? new Date(c.appliedAt).toISOString() : null,
  };
}

// ── GET /api/recruiter/candidates ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status");
    const jobIdParam = searchParams.get("jobId");
    const minRating = Number(searchParams.get("minRating") ?? 0);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? 20))
    );
    const skip = (page - 1) * limit;

    const recruiterId = new mongoose.Types.ObjectId(auth.userId);

    const filter: any = { recruiterId };

    if (status) filter.status = status;
    if (minRating > 0) filter.rating = { $gte: minRating };
    if (jobIdParam) {
      if (!mongoose.Types.ObjectId.isValid(jobIdParam))
        return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
      filter.jobId = new mongoose.Types.ObjectId(jobIdParam);
    }

    // Text search — use $or on indexed fields
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ name: re }, { email: re }, { jobTitle: re }];
    }

    const [candidates, total, pipelineAgg] = await Promise.all([
      Candidate.find(filter)
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Candidate.countDocuments(filter),
      // Pipeline counts across ALL statuses for this recruiter (ignore other filters)
      Candidate.aggregate([
        { $match: { recruiterId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

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
    }));

    // ── Job list for filter dropdown ──────────────────────────────────────
    // Return the distinct jobs this recruiter has candidates for
    const jobIds = await Candidate.distinct("jobId", { recruiterId });
    const jobs = jobIds.length
      ? await Job.find({ _id: { $in: jobIds } })
          .select("title")
          .lean()
      : [];

    return NextResponse.json({
      data: candidates.map(toShape),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      pipeline,
      jobs: (jobs as any[]).map((j) => ({
        _id: j._id.toString(),
        title: j.title,
      })),
    });
  } catch (error) {
    console.error("[GET /api/recruiter/candidates]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── PATCH /api/recruiter/candidates?id=<candidateId> ─────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Valid id required" }, { status: 400 });

    // Ownership — recruiterId is stored on the Candidate document
    const candidate = (await Candidate.findById(id).lean()) as any;
    if (!candidate)
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    if (candidate.recruiterId?.toString() !== auth.userId)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await req.json();
    const update: any = {};
    if (body.status !== undefined) update.status = body.status;
    if (body.notes !== undefined) update.notes = body.notes?.trim() ?? null;
    if (body.rating !== undefined)
      update.rating = Math.min(5, Math.max(1, Number(body.rating)));

    if (!Object.keys(update).length)
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );

    // Update Candidate and mirror status/notes on the Application in parallel
    const [updated] = await Promise.all([
      Candidate.findByIdAndUpdate(
        id,
        { $set: update },
        { new: true, runValidators: true }
      ).lean(),
      candidate.applicationId
        ? Application.findByIdAndUpdate(candidate.applicationId, {
            $set: {
              ...(update.status !== undefined && { status: update.status }),
              ...(update.notes !== undefined && { notes: update.notes }),
            },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json(toShape(updated));
  } catch (error) {
    console.error("[PATCH /api/recruiter/candidates]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/recruiter/candidates?id=<candidateId> ────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Valid id required" }, { status: 400 });

    const candidate = (await Candidate.findById(id).lean()) as any;
    if (!candidate)
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    if (candidate.recruiterId?.toString() !== auth.userId)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // Remove both records
    await Promise.all([
      Candidate.findByIdAndDelete(id),
      candidate.applicationId
        ? Application.findByIdAndDelete(candidate.applicationId)
        : Promise.resolve(null),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/recruiter/candidates]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
