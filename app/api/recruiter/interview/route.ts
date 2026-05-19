// app/api/recruiter/interviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/Utils/verifytoken";
import User from "@/modal/user.modal";
import Job from "@/modal/job.modal";
import Application from "@/modal/application.modal";
import Interview from "@/modal/interview.modal"; // Double-check path match
import {
  notifyInterviewScheduled,
  notifyInterviewUpdated,
} from "@/services/notification.service";

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

async function getRecruiterAppIds(userId: string) {
  const jobs = (await Job.find({
    recruiterId: new mongoose.Types.ObjectId(userId),
  })
    .select("_id")
    .lean()) as any[];
  const apps = (await Application.find({
    jobId: { $in: jobs.map((j) => j._id) },
  })
    .select("_id")
    .lean()) as any[];
  return apps.map((a) => a._id);
}

async function verifyOwnership(interviewId: string, userId: string) {
  const interview = (await Interview.findById(interviewId)
    .populate({
      path: "applicationId",
      model: Application,
      populate: {
        path: "jobId",
        model: Job,
        select: "recruiterId title",
      },
    })
    .lean()) as any;

  if (!interview)
    return { interview: null, error: "Interview not found", status: 404 };
  if (interview.applicationId?.jobId?.recruiterId?.toString() !== userId)
    return { interview: null, error: "Access denied", status: 403 };

  return { interview, error: null, status: 200 };
}

// Helper to normalize frontend input to match the schema's enum definitions
function mapTypeToSchemaEnum(incomingType: string): string {
  switch (incomingType) {
    case "VIDEO":
      return "VIDEO_CALL";
    case "PHONE":
      return "PHONE_SCREEN";
    case "IN_PERSON":
    default:
      return "HR_INTERVIEW"; // Fallback to schema-compatible string
  }
}

// ── GET /api/recruiter/interviews ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");
    const rawStatus = searchParams.get("status");
    const type = searchParams.get("type");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? 20))
    );
    const skip = (page - 1) * limit;

    const appIds = await getRecruiterAppIds(auth.userId);
    const filter: any = { applicationId: { $in: appIds } };
    if (applicationId && mongoose.Types.ObjectId.isValid(applicationId))
      filter.applicationId = new mongoose.Types.ObjectId(applicationId);
    if (rawStatus && rawStatus !== "ALL") filter.status = rawStatus;
    if (type && type !== "ALL") filter.type = mapTypeToSchemaEnum(type);

    const [data, total, summaryAgg] = await Promise.all([
      Interview.find(filter)
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "applicationId",
          model: Application,
          populate: [
            { path: "seekerId", model: User, select: "Name email imageUrl" },
            { path: "jobId", model: Job, select: "title company location" },
          ],
        })
        .lean(),
      Interview.countDocuments(filter),
      Interview.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const summary = Object.fromEntries(
      (summaryAgg as any[]).map((s) => [s._id, s.count])
    );

    const shaped = (data as any[]).map((i) => {
      const d = new Date(`${i.date}T${i.time}`);
      return {
        id: i._id.toString(),
        applicationId: i.applicationId?._id?.toString() ?? null,
        candidate: i.applicationId?.seekerId?.Name ?? "Unknown",
        email: i.applicationId?.seekerId?.email ?? "",
        avatar: i.applicationId?.seekerId?.imageUrl ?? null,
        jobTitle: i.applicationId?.jobId?.title ?? "Position",
        company: i.company,
        location: i.applicationId?.jobId?.location ?? "",
        scheduledAt: isNaN(d.getTime()) ? null : d.toISOString(),
        date: i.date,
        time: i.time,
        type: i.type,
        status: i.status,
        meetingLink: i.meetingLink ?? null,
        notes: i.notes ?? null,
      };
    });

    return NextResponse.json({
      data: shaped,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      summary,
    });
  } catch (error) {
    console.error("[GET /api/recruiter/interviews]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── POST /api/recruiter/interviews ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { applicationId, scheduledAt, type, notes, meetingLink } =
      await req.json();

    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId))
      return NextResponse.json(
        { error: "Valid applicationId required" },
        { status: 400 }
      );
    if (!scheduledAt)
      return NextResponse.json(
        { error: "scheduledAt required" },
        { status: 400 }
      );

    const parsedDate = new Date(scheduledAt);
    if (isNaN(parsedDate.getTime()))
      return NextResponse.json(
        { error: "Invalid scheduledAt" },
        { status: 400 }
      );
    if (parsedDate < new Date())
      return NextResponse.json(
        { error: "scheduledAt must be in the future" },
        { status: 400 }
      );
    if (!["VIDEO", "PHONE", "IN_PERSON"].includes(type))
      return NextResponse.json(
        { error: "type must be VIDEO | PHONE | IN_PERSON" },
        { status: 400 }
      );

    const app = (await Application.findById(applicationId)
      .populate({
        path: "jobId",
        model: Job,
        select: "recruiterId title company",
      })
      .lean()) as any;

    if (!app)
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    if (app.jobId?.recruiterId?.toString() !== auth.userId)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // Derive date (YYYY-MM-DD) and time (HH:mm) strings required by schema
    const dateString = parsedDate.toISOString().split("T")[0];
    const timeString = parsedDate.toTimeString().split(" ")[0].slice(0, 5);

    // Build entity satisfying exact Schema requirements
    const interview = await Interview.create({
      applicationId: new mongoose.Types.ObjectId(applicationId),
      candidateId: new mongoose.Types.ObjectId(app.seekerId),
      seekerId: new mongoose.Types.ObjectId(app.seekerId),
      jobId: app.jobId?._id ? new mongoose.Types.ObjectId(app.jobId._id) : null,
      company: app.jobId?.company ?? "Unknown Company",
      role: app.jobId?.title ?? "Position",
      date: dateString,
      time: timeString,
      // type: mapTypeToSchemaEnum(type),
      notes: notes?.trim() ?? null,
      meetingLink: meetingLink?.trim() ?? null,
      status: "SCHEDULED",
    });

    // Update application status
    await Application.findByIdAndUpdate(applicationId, {
      $set: { status: "INTERVIEW_SCHEDULED" },
    });

    // Notify seeker (fire-and-forget)
    notifyInterviewScheduled({
      seekerId: app.seekerId.toString(),
      recruiterId: auth.userId,
      jobTitle: app.jobId?.title ?? "the position",
      company: app.jobId?.company ?? "",
      scheduledAt: parsedDate,
      interviewType: type,
      interviewId: interview._id.toString(),
      applicationId,
      meetingLink: meetingLink ?? undefined,
    });

    const populated = (await Interview.findById(interview._id)
      .populate({
        path: "applicationId",
        model: Application,
        populate: [
          { path: "seekerId", model: User, select: "Name email imageUrl" },
          { path: "jobId", model: Job, select: "title company location" },
        ],
      })
      .lean()) as any;

    return NextResponse.json(
      {
        id: populated._id.toString(),
        applicationId: populated.applicationId?._id?.toString() ?? null,
        candidate: populated.applicationId?.seekerId?.Name ?? "Unknown",
        email: populated.applicationId?.seekerId?.email ?? "",
        avatar: populated.applicationId?.seekerId?.imageUrl ?? null,
        jobTitle: populated.applicationId?.jobId?.title ?? "Position",
        company: populated.company,
        location: populated.applicationId?.jobId?.location ?? "",
        scheduledAt: parsedDate.toISOString(),
        date: populated.date,
        time: populated.time,
        type: populated.type,
        status: populated.status,
        meetingLink: populated.meetingLink ?? null,
        notes: populated.notes ?? null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/recruiter/interviews]", error);
    return NextResponse.json(
      { error: "Failed to schedule interview" },
      { status: 500 }
    );
  }
}

// ── PATCH /api/recruiter/interviews?id= ─────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Valid id required" }, { status: 400 });

    const { error, status } = await verifyOwnership(id, auth.userId);
    if (error) return NextResponse.json({ error }, { status });

    const body = await req.json();
    const update: any = {};

    if (body.scheduledAt !== undefined) {
      const d = new Date(body.scheduledAt);
      if (isNaN(d.getTime()))
        return NextResponse.json(
          { error: "Invalid scheduledAt" },
          { status: 400 }
        );
      update.date = d.toISOString().split("T")[0];
      update.time = d.toTimeString().split(" ")[0].slice(0, 5);
    }

    if (body.type !== undefined) update.type = mapTypeToSchemaEnum(body.type);
    if (body.notes !== undefined) update.notes = body.notes?.trim() ?? null;
    if (body.meetingLink !== undefined)
      update.meetingLink = body.meetingLink?.trim() ?? null;
    if (body.status !== undefined) update.status = body.status;

    if (!Object.keys(update).length)
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });

    const updated = (await Interview.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    )
      .populate({
        path: "applicationId",
        model: Application,
        populate: [
          { path: "seekerId", model: User, select: "Name email imageUrl" },
          { path: "jobId", model: Job, select: "title company location" },
        ],
      })
      .lean()) as any;

    if (body.status === "CANCELLED" || body.scheduledAt) {
      notifyInterviewUpdated({
        seekerId: updated.candidateId?.toString() ?? "",
        recruiterId: auth.userId,
        jobTitle: updated.role,
        status: body.status ?? "RESCHEDULED",
        interviewId: id,
      });
    }

    const d = new Date(`${updated.date}T${updated.time}`);
    return NextResponse.json({
      id: updated._id.toString(),
      applicationId: updated.applicationId?._id?.toString() ?? null,
      candidate: updated.applicationId?.seekerId?.Name ?? "Unknown",
      email: updated.applicationId?.seekerId?.email ?? "",
      avatar: updated.applicationId?.seekerId?.imageUrl ?? null,
      jobTitle: updated.role,
      company: updated.company,
      location: updated.applicationId?.jobId?.location ?? "",
      scheduledAt: isNaN(d.getTime()) ? null : d.toISOString(),
      date: updated.date,
      time: updated.time,
      type: updated.type,
      status: updated.status,
      meetingLink: updated.meetingLink ?? null,
      notes: updated.notes ?? null,
    });
  } catch (error) {
    console.error("[PATCH /api/recruiter/interviews]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// ── DELETE /api/recruiter/interviews?id= ────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    if (!auth?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Valid id required" }, { status: 400 });

    const { interview, error, status } = await verifyOwnership(id, auth.userId);
    if (error) return NextResponse.json({ error }, { status });

    await Interview.findByIdAndDelete(id);

    notifyInterviewUpdated({
      seekerId: interview.candidateId?.toString() ?? "",
      recruiterId: auth.userId,
      jobTitle: interview.role,
      status: "CANCELLED",
      interviewId: id,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/recruiter/interviews]", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
