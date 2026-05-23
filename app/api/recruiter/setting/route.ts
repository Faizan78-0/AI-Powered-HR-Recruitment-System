import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/Utils/verifytoken";
import User from "@/modal/user.modal";

async function getTokenUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId ?? null;
}

/**
 * GET /api/recruiter/setting
 * Returns jobTitle, company, and bio from the User document.
 */
export async function GET() {
  try {
    await connectDB();

    const userId = await getTokenUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId)
      .select("jobTitle company bio")
      .lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        jobTitle: user.jobTitle ?? "",
        company:  user.company  ?? "",
        bio:      user.bio      ?? "",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_RECRUITER_SETTINGS_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/recruiter/setting
 * Updates jobTitle, company, and/or bio on the User document.
 *
 * Body:
 *   { jobTitle?: string; company?: string; bio?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const userId = await getTokenUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobTitle, company, bio } = body as {
      jobTitle?: string;
      company?:  string;
      bio?:      string;
    };

    const updateData: Record<string, string> = {};
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle.trim();
    if (company  !== undefined) updateData.company  = company.trim();
    if (bio      !== undefined) updateData.bio      = bio.trim();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("jobTitle company bio");

    if (!updated) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        jobTitle: updated.jobTitle ?? "",
        company:  updated.company  ?? "",
        bio:      updated.bio      ?? "",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH_RECRUITER_SETTINGS_ERROR:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}