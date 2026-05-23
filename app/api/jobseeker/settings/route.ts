import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/Utils/verifytoken";
import User from "@/modal/user.modal";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getTokenUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  // Support both `userId` and `id` token shapes
  return decoded?.userId ?? decoded?.id ?? null;
}

// ─── GET /api/jobseeker/settings ──────────────────────────────────────────────
// Returns job-seeker profile fields for the authenticated user.

export async function GET() {
  try {
    await connectDB();

    const userId = await getTokenUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId)
      .select("Name headline seekerBio openToWork remotePreference imageUrl")
      .lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        Name:             user.Name,
        imageUrl:         user.imageUrl         ?? null,
        headline:         user.headline         ?? "",
        seekerBio:        user.seekerBio        ?? "",
        openToWork:       user.openToWork       ?? true,
        remotePreference: user.remotePreference ?? "remote",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_JOBSEEKER_SETTINGS_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─── PUT /api/jobseeker/settings ──────────────────────────────────────────────
// Updates any combination of job-seeker profile fields + name.
//
// Body (all optional):
//   {
//     name?: string;
//     headline?: string;
//     seekerBio?: string;
//     openToWork?: boolean;
//     remotePreference?: "remote" | "hybrid" | "onsite";
//   }

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const userId = await getTokenUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      name?:             string;
      headline?:         string;
      seekerBio?:        string;
      openToWork?:       boolean;
      remotePreference?: "remote" | "hybrid" | "onsite";
    };

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (!trimmed) {
        return NextResponse.json({ message: "Name cannot be empty" }, { status: 400 });
      }
      updateData.Name = trimmed;
    }

    if (body.headline         !== undefined) updateData.headline         = body.headline.trim();
    if (body.seekerBio        !== undefined) updateData.seekerBio        = body.seekerBio.trim();
    if (body.openToWork       !== undefined) updateData.openToWork       = body.openToWork;
    if (body.remotePreference !== undefined) updateData.remotePreference = body.remotePreference;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("Name headline seekerBio openToWork remotePreference imageUrl");

    if (!updated) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        Name:             updated.Name,
        imageUrl:         updated.imageUrl         ?? null,
        headline:         updated.headline         ?? "",
        seekerBio:        updated.seekerBio        ?? "",
        openToWork:       updated.openToWork       ?? true,
        remotePreference: updated.remotePreference ?? "remote",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT_JOBSEEKER_SETTINGS_ERROR:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}