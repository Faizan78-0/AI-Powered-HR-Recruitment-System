import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";

import Job from "@/modal/job.modal";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/Utils/verifytoken";
import type { JobStatus, PaginatedResponse, Job as IJob } from "@/types/index";

/**
 * Authentication Helper
 */
async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

// ── GET: FETCH JOBS (WITH FILTERS) ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") as JobStatus | null;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? 10))
    );
    const skip = (page - 1) * limit;

    const filter: any = {
      recruiterId: new mongoose.Types.ObjectId(auth.userId),
    };

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { requiredSkills: { $regex: search, $options: "i" } },
      ];
    }

    const [rawData, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Job.countDocuments(filter),
    ]);

    // FIX: Keep _id as string "id" so the frontend can use it for edit/delete/toggle
    const sanitizedData = rawData.map((job: any) => {
      const { recruiterId, _id, __v, ...rest } = job;
      return {
        ...rest,
        id: _id.toString(), // expose as "id" string — frontend resolveId() handles this
      };
    });

    const response: PaginatedResponse<Omit<IJob, "recruiterId">> = {
      data: sanitizedData as any,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[JOBS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ── POST: CREATE NEW JOB ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const required = ["title", "company", "location", "type", "description"];
    for (const field of required) {
      if (!body[field])
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
    }

    const newJob = await Job.create({
      ...body,
      recruiterId: new mongoose.Types.ObjectId(auth.userId),
      status: body.status || "DRAFT",
    });

    // FIX: Return the created job so the frontend can optimistically add it to the list
    const { recruiterId, _id, __v, ...jobData } = newJob.toObject();
    return NextResponse.json(
      { ...jobData, id: _id.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("[JOBS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}

// ── PATCH: UPDATE JOB ────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const body = await req.json();

    const id = searchParams.get("id") || body.id || body._id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing Job ID" },
        { status: 400 }
      );
    }

    // Strip id fields from the body so they don't accidentally overwrite _id
    const { id: _bodyId, _id: _bodyMongoId, recruiterId: _r, ...updateFields } = body;

    const updatedJob = await Job.findOneAndUpdate(
      { _id: id, recruiterId: auth.userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean() as any;

    if (!updatedJob) {
      return NextResponse.json(
        { error: "Job not found or access denied" },
        { status: 404 }
      );
    }

    // FIX: Return the updated job so the frontend can update its local state
    const { recruiterId, _id, __v, ...jobData } = updatedJob;
    return NextResponse.json({ ...jobData, id: _id.toString() });
  } catch (error) {
    console.error("PATCH_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── DELETE: REMOVE JOB ───────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Job ID" }, { status: 400 });
    }

    const deletedJob = await Job.findOneAndDelete({
      _id: id,
      recruiterId: auth.userId,
    });

    if (!deletedJob) {
      return NextResponse.json(
        { error: "Job not found or access denied" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[JOBS_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}