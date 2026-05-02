import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;


export const generateTokenAndSetCookie = async (userId: string): Promise<string> => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }


  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });


  const cookieStore = await cookies();

  
  cookieStore.set("token", token, {
    httpOnly: true, // Prevents XSS
    secure: process.env.NODE_ENV === "production", 
    sameSite: "strict", // Prevents CSRF
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  });

  return token;
};