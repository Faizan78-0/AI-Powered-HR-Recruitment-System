// src/app/api/recruiter/resume-analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { analyzeResume } from "@/nlp/resumeAnalyzer";
import { z } from "zod";

const S = z.object({
  resumeText: z.string().min(50, "Resume text must be at least 50 characters"),
  jobDescription: z.string().optional().default(""),
  candidateName: z.string().optional().default(""),
});

export async function POST(req: NextRequest) {
  // const auth = await getAuthUser();
  // if (!auth || auth.role !== "RECRUITER")
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { resumeText, jobDescription, candidateName } = S.parse(body);
    const analysis = analyzeResume(resumeText, jobDescription);
    return NextResponse.json({
      data: { analysis, candidateName, analyzedAt: new Date().toISOString() },
    });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}