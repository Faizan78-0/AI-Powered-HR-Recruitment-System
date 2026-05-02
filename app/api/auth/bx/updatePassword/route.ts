import { NextResponse } from "next/server";
import User from "@/modal/user.modal";
import { connectDB } from "@/lib/db";
import bcryptjs from "bcryptjs";
import { sendUpdateSuccessEmail } from "@/Emails/service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, password } = body;

    // 1. Basic Validation
    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    // 2. Find user (Using $gt to ensure token hasn't expired)
    const user = await User.findOne({
      resetpasswordToken: token,
      resetpasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // 3. Hash and Save
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(password, salt);
    
    // Clear reset fields so the token can't be used again
    user.resetpasswordToken,
    user.resetpasswordExpiresAt,
    
    await user.save();
    await sendUpdateSuccessEmail(user.email,user.Name);

    return NextResponse.json(
      { success: true, message: "Password update successful. You can now log in." },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

