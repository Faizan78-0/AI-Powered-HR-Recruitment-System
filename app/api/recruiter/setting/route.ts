import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/modal/user.modal";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { verifyToken } from "@/Utils/verifytoken";

export async function POST(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "No Token" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const id = decoded.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid User ID" }, { status: 400 });
    }

    // Parse the body for updates
    const body = await req.json();
    const { Name, imageUrl, bio, companyName } = body;

    // Update user and return the new document
    // We use { new: true } to get the updated object back
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          Name,
          imageUrl,
          bio, // Assuming these fields exist in your schema
          companyName,
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: {
          Name: updatedUser.Name,
          imageUrl: updatedUser.imageUrl,
          role: updatedUser.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}