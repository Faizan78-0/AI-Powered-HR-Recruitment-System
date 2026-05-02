import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from"@/Utils/verifytoken";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  const isPublic = pathname.startsWith("/auth") || pathname === "/";
  const isRecruiter = pathname.startsWith("/recruiter");
  const isJobSeeker = pathname.startsWith("/jobseeker");

  if (!token) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/auth/bx/login/", req.url));
  }

  const user = verifyToken(token);
  if (!user) {
    const res = NextResponse.redirect(new URL("/auth/bx/login", req.url));
    res.cookies.set("token", "", { maxAge: 0 });
    return res;
  }

  // Wrong-role guard
  if (isRecruiter && user.role !== "RECRUITER") {
    return NextResponse.redirect(new URL("/jobseeker/dashboard", req.url));
  }
  if (isJobSeeker && user.role !== "JOB_SEEKER") {
    return NextResponse.redirect(new URL("/recruiter/dashboard", req.url));
  }

  // Redirect root auth to correct dashboard
  if (pathname === "/" || pathname === "/auth/bx/login") {
    if (user.role === "RECRUITER") return NextResponse.redirect(new URL("/recruiter/dashboard", req.url));
    if (user.role === "JOB_SEEKER") return NextResponse.redirect(new URL("/jobseeker/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};