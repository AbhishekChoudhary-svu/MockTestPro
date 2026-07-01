export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import Exam from "@/models/Exam";
import Question from "@/models/Question";
import Attempt from "@/models/Attempt";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    // Double check admin status in database
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json({ error: "Admin account not found" }, { status: 403 });
    }

    const [totalExams, totalQuestions, totalUsers, totalAttempts, recentAttempts] = await Promise.all([
      Exam.countDocuments({}),
      Question.countDocuments({}),
      User.countDocuments({}),
      Attempt.countDocuments({}),
      Attempt.find({})
        .sort({ startedAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .populate("examId", "title category")
        .lean()
    ]);

    return NextResponse.json({
      totalExams,
      totalQuestions,
      totalUsers,
      totalAttempts,
      recentAttempts
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
