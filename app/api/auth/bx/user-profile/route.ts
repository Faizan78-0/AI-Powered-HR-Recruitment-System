import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/modal/user.modal";
import { cookies } from "next/headers";
import { verifyToken } from "@/Utils/verifytoken";

/**
 * GET /api/auth/bx/user-profile
 * Returns the current user's public profile fields.
 */
export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId)
      .select("Name email role imageUrl")
      .lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        Name:     user.Name,
        email:    user.email,
        role:     user.role,
        imageUrl: user.imageUrl ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_USER_PROFILE_ERROR:", error);
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

/**
 * PATCH /api/auth/bx/user-profile
 * Updates the user's name and/or profile image (base64).
 *
 * Body (all fields optional):
 *   { name?: string; avatar?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { name, avatar } = body as { name?: string; avatar?: string };

    const updateData: Record<string, string> = {};

    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) {
        return NextResponse.json({ message: "Name cannot be empty" }, { status: 400 });
      }
      updateData.Name = trimmed;
    }

    if (avatar !== undefined) {
      // Store base64 string as imageUrl
      // TODO: Replace with S3/Cloudinary URL once object storage is wired up
      updateData.imageUrl = avatar;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("Name email role imageUrl");

    if (!updated) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        Name:     updated.Name,
        email:    updated.email,
        role:     updated.role,
        imageUrl: updated.imageUrl ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH_USER_PROFILE_ERROR:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}