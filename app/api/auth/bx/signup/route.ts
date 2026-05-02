import { connectDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import User from "@/modal/user.modal";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/Emails/service";
import {generateTokenAndSetCookie} from "@/Utils/jwt";

interface SignupBody {
  Name: string;
  email: string;
  password: string;
  imageUrl: File;
  role:string;
  verificationToken: number;
  verificationTokenExpiresAt: number;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body: SignupBody = await req.json();

    const { Name, email, password, imageUrl,role } = body;

   

    if (!Name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = new User({
      Name: Name,
      email,
      password: hashedPassword,
      imageUrl,
      role,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    await user.save();
    generateTokenAndSetCookie(user._id.toString());

    await sendVerificationEmail(user.email, verificationToken);

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;

    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
