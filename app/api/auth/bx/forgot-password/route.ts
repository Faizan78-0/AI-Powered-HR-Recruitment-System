import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import User from "@/modal/user.modal"; // Adjust path to your model
import { connectDB } from "@/lib/db"; // Adjust path to your DB helper
import { sendPasswordResetEmail } from "@/Emails/service"; // Adjust path

export async function POST(request: Request) {
  try {
    // 1. Parse the request body
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // 2. Connect to the Database
    await connectDB();

    // 3. Find user
    const user = await User.findOne({ email });

    // Note: For security, some choose to return a 200 even if the user isn't found
    // to prevent "email enumerating." But keeping your logic:
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 400 }
      );
    }

    // 4. Generate Reset Token
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour from now

    // 5. Update User Record
    user.resetpasswordToken = resetToken;
    user.resetpasswordExpiresAt = resetTokenExpiresAt;
    await user.save();

    // 6. Send the Reset Email
    // Use environment variables for the URL instead of hardcoding localhost
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
    
    // Fixed the URL structure to include a proper query parameter
    const resetUrl = `${CLIENT_URL}yz/updatePassword?token=${resetToken}`;
    
    await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json(
      { success: true, message: "Password reset link sent to your email" },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error in forgotPassword API:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}