import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/modal/user.modal";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { verifyToken } from "@/Utils/verifytoken";
import { getSession } from "@/lib/auth";

// Existing GET function...
export async function GET() {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token)
      return NextResponse.json({ message: "No Token" }, { status: 401 });

    const decoded = verifyToken(token);
    const id = decoded.userId;

    const user = await User.findById(id).select("-password").lean();
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json(
      {
        Name: user.Name, // Mapping to frontend interface

        email: user.email,

        role: user.role,

        imageUrl: user.imageUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

/**
 * PATCH: Update Name, Bio, or Profile Image
 */
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSession({ req });
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, avatar } = await req.json();
    
    // Create an update object dynamically
    const updateData: any = {};
    if (name) updateData.Name = name;
    if (avatar) updateData.avatar = avatar; // Storing base64 in DB (or URL if using S3/Cloudinary)

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true }
    ).select("Name email role avatar");

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
