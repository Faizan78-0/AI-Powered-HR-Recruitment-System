import { verifyToken } from "@/Utils/verifytoken";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export interface User {
  id: string;
  email: string;
  Name: string;
  role: "admin" | "recruiter" | "hiring_manager";
  department?: string;
  avatar?: string;
}

export interface Session {
  user: User;
  expiresAt: number;
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// ─── Create JWT session ───────────────────────────────────────────────
export async function createSession(user: User): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24h

  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.Name,
    role: user.role,
    department: user.department,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .sign(secret);

  return token;
}

// ─── Verify JWT session ───────────────────────────────────────────────
export async function getSession({ req }: { req: NextRequest }): Promise<any | null> {
  try {
    // 1. Extract token from cookies (adjust "token" to match your cookie name)
    const token = req.cookies.get("token")?.value;

    if (!token) return null;

    // 2. Verify the JWT
    const { payload } = await jwtVerify(token, secret);

    // 3. Return the session object
    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        name: payload.name as string, // Note: standard naming is 'name'
        role: payload.role as any,
        department: payload.department as string | undefined,
      },
      expiresAt: (payload.exp as number) * 1000,
    };
  } catch (error) {
    // console.error("JWT Verification failed:", error);
    return null;
  }
}

// ─── Extract token ────────────────────────────────────────────────────
export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("token");
  if (authHeader?.startsWith("token ")) {
    return authHeader.slice(7);
  }

  const cookie = request.headers.get("token");
  if (!cookie) return null;

  const match = cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}
export async function getAuthUser() {
  const store = await cookies();
  const token = store.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
