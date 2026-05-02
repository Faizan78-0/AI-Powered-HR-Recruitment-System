import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Job from "@/modal/job.modal";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { verifyToken } from "@/Utils/verifytoken";
import mongoose from "mongoose";
export const dynamic = "force-dynamic";

// Adjust path as needed

async function getAuth(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const decoded = await getAuth(req);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // SECURITY FIX: Filter by recruiterId so users can't see each other's jobs
    const recruiterId = new mongoose.Types.ObjectId(decoded.userId);

    const jobs = await Job.find({ recruiterId })
      .select("title company location salary type status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Map the MongoDB _id to a frontend-friendly 'id' string
    const formattedJobs = jobs.map((job: any) => ({
      ...job,
      id: job._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json(formattedJobs, { status: 200 });
  } catch (error: any) {
    console.error("GET JOBS ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
export async function POST(req: Request) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decoded: any = jwt.verify(token!, process.env.JWT_SECRET!);

    const body = await req.json();

    // The body MUST contain title, company, location, description, AND salary
    const newJob = await Job.create({
      ...body,

      recruiterId: decoded.userId,
    });

    return NextResponse.json({ status: 201, message: "success" });
  } catch (error: any) {
    // This is where your "salary required" error was coming from
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();

    // 1. Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decoded: any = token ? verifyToken(token) : null;

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Get Job ID from URL query
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Job ID is required" },
        { status: 400 }
      );
    }

    // 3. Parse update data from body
    const updates = await req.json();

    // SECURITY: Prevent users from changing the recruiterId or _id via the body
    delete updates.recruiterId;
    delete updates._id;

    // 4. Update ONLY if recruiterId matches (Ownership Check)
    const updatedJob = await Job.findOneAndUpdate(
      { _id: id, recruiterId: decoded.userId }, // Critical security filter
      { $set: updates }, // Only updates the fields provided in JSON
      { new: true, runValidators: true } // Return the new doc & check schema rules
    );

    if (!updatedJob) {
      return NextResponse.json(
        { message: "Job not found or you don't have permission" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// Example of a Secure Delete
export async function DELETE(req: Request) {
  try {
    await connectDB();
    const decoded = await getAuth(req);
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("id");

    if (!decoded)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // This ensures that even if a hacker knows a Job ID,
    // they can't delete it unless their recruiterId matches.
    const deletedJob = await Job.findOneAndDelete({
      _id: jobId,
      recruiterId: decoded.userId,
    });

    if (!deletedJob) {
      return NextResponse.json(
        { message: "Job not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
