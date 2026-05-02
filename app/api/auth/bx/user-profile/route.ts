import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/modal/user.modal";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { verifyToken } from "@/Utils/verifytoken";

export async function GET() {
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
      return NextResponse.json(
        { message: "Invalid User ID format" },
        { status: 400 }
      );
    }

    const user = await User.findById(new mongoose.Types.ObjectId(id))
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        Name: user.Name || user.Name,
        imageUrl: user.imageUrl || user.imageUrl,
        role: user.role,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Session Invalid or Expired" },
      { status: 401 }
    );
  }
}
