export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import Exam from "@/models/Exam";
import Question from "@/models/Question";
import Attempt from "@/models/Attempt";

// GET: Return collection stats for setting page
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    // Verify admin
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Admin account not found" }, { status: 403 });
    }

    const [usersCount, questionsCount, examsCount, attemptsCount] = await Promise.all([
      User.countDocuments({}),
      Question.countDocuments({}),
      Exam.countDocuments({}),
      Attempt.countDocuments({}),
    ]);

    return NextResponse.json({
      usersCount,
      questionsCount,
      examsCount,
      attemptsCount,
    });
  } catch (error) {
    console.error("Error loading settings stats:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Execute administrative database operations
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    // Verify admin
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Admin account not found" }, { status: 403 });
    }

    const body = await req.json();
    const { action, targetExamId } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    switch (action) {
      case "clear-all-attempts":
        // Wipe all attempt logs
        await Attempt.deleteMany({});
        // Reset count on all exams
        await Exam.updateMany({}, { $set: { attemptCount: 0 } });
        return NextResponse.json({ message: "Successfully wiped all student attempt logs and reset counts." });

      case "clear-exam-attempts":
        if (!targetExamId) {
          return NextResponse.json({ error: "targetExamId is required for this action" }, { status: 400 });
        }
        // Wipe attempts for specific exam
        await Attempt.deleteMany({ examId: targetExamId });
        // Reset attempt count for that exam
        await Exam.findByIdAndUpdate(targetExamId, { $set: { attemptCount: 0 } });
        return NextResponse.json({ message: "Wiped all attempt records for the selected exam." });

      case "reset-attempt-counts":
        // Simply set all attempt counts to 0 without deleting attempts
        await Exam.updateMany({}, { $set: { attemptCount: 0 } });
        return NextResponse.json({ message: "Successfully reset attempt counter metrics on all exams to 0." });

      default:
        return NextResponse.json({ error: "Unknown administrative action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error executing admin settings operation:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
