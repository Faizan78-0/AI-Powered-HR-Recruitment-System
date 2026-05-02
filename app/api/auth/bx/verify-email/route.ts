import { NextResponse } from "next/server";
import User from "@/modal/user.modal"; // Adjust path if necessary
import { connectDB } from "@/lib/db";
import { sendWelcomeEmail } from "@/Emails/service";

export async function POST(request: Request) {
  try {
    // 1. Parse the incoming request body
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Verification code is required" },
        { status: 400 }
      );
    }

    // 2. Ensure Database Connection
    await connectDB();

    // 3. Find user with valid and non-expired token
    // We use .findOne() and check if the expiry date is greater than ($gt) now
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // 4. Update user status and clear tokens
    user.isverified = true;
    user.verificationToken, user.verificationTokenExpiresAt, await user.save();

    // 5. Send welcome email (Non-blocking)
    // We wrap this in a try-catch so that if the email fails,
    // the user is still verified successfully in the UI.
    try {
      await sendWelcomeEmail(user.email, user.Name);
    } catch (emailError) {
      console.error("Welcome email failed to send:", emailError);
    }

    // 6. Return response (excluding sensitive data)
    // FIX: Instead of 'delete', we destructure to omit the password safely
    const userObj = user.toObject();
    const { password, ...userWithoutPassword } = userObj;

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in verifyEmail API:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
