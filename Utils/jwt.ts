import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type UserRole = "RECRUITER" | "JOB_SEEKER";
const JWT_SECRET = process.env.JWT_SECRET;

export const generateTokenAndSetCookie = async (
  userId: string,
  role: string,
  response?: NextResponse
): Promise<string> => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const token = jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: "7d",
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  };

  if (response) {
    response.cookies.set("user_role", role, cookieOptions);
    response.cookies.set("token", token, cookieOptions);
  } else {
    const cookieStore = await cookies();
    cookieStore.set("user_role", role, cookieOptions);
    cookieStore.set("token", token, cookieOptions);
  }

  return token;
};
