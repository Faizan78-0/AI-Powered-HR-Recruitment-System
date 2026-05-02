import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db"; // Adjust path to your connectDB file
import { Job, Candidate, Application } from "@/modal/dashboard.modal";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    // 1. Ensure DB is connected
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "RECRUITER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Fetch data in parallel for high performance
    const [activeJobs, totalCandidates, recentApps] = await Promise.all([
      Job.countDocuments({ status: "active" }),
      Candidate.countDocuments(),
      Application.find().sort({ appliedAt: -1 }).limit(5),
    ]);

    // 3. Return formatted JSON
    return NextResponse.json({
      stats: {
        activeJobs: activeJobs.toString(),
        newCandidates: totalCandidates.toString(),
        interviews: "", // Hardcoded or add an Interview model count
        hireRate: "",
      },
      applications: recentApps.map((app) => ({
        id: app._id,
        candidateName: app.candidateName,
        jobRole: app.jobRole,
        status: app.status,
        appliedAt: app.appliedAt,
      })),
    });
  } catch (error) {
    console.error("Dashboard Route Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
