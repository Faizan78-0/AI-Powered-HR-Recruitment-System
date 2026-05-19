import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/modal/user.modal";
import { getSession } from "@/lib/auth"; 

export async function GET(req: NextRequest) {
  try {
    // 1. Ensure connectDB does not expect 'req'
    await connectDB();

    // 2. Fix: Most getSession helpers in Next.js 13+ (App Router) 
    // expect an object { req } or are called without arguments if using headers()
    const session = await getSession({ req }); 

    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const profile = await User.findOne({ userId: session.user.id }).lean();
    return NextResponse.json(profile || {});
  } catch (error) {
    console.error("GET_RECRUITER_SETTINGS_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    // 2. Fix: Apply the same session fix here
    // const session = await getSession({ req });

    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await req.json();

    const updated = await User.findOneAndUpdate(
      // { userId: session.user.id },
      { 
        $set: {
          company: body.company,
          jobTitle: body.jobTitle,
        
          website: body.website,
          bio: body.bio
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH_RECRUITER_SETTINGS_ERROR:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}