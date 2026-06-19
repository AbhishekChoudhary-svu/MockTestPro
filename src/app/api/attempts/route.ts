export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import Attempt from "@/models/Attempt";
import Exam from "@/models/Exam";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { examId } = body;

    if (!examId) {
      return NextResponse.json({ error: "examId is required" }, { status: 400 });
    }

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const exam = await Exam.findById(examId).populate("sections.questions");
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Check for existing in-progress attempt
    const existing = await Attempt.findOne({
      userId: dbUser._id,
      examId,
      status: "in-progress",
    });
    if (existing) {
      return NextResponse.json({ attemptId: existing._id.toString() });
    }

    // Build initial responses array from all questions across sections
    const responses = exam.sections.flatMap((section: { questions: { _id: unknown }[] }) =>
      (section.questions || [])
        .filter((q) => q !== null && q !== undefined)
        .map((q: { _id: unknown }) => ({
          questionId: q._id,
          selectedOption: null,
          isMarkedForReview: false,
          timeSpent: 0,
        }))
    );

    const attempt = await Attempt.create({
      userId: dbUser._id,
      examId,
      status: "in-progress",
      startedAt: new Date(),
      currentSection: 0,
      responses,
    });

    // Increment exam attempt count
    await Exam.findByIdAndUpdate(examId, { $inc: { attemptCount: 1 } });

    return NextResponse.json({ attemptId: attempt._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("Error creating attempt:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET: Fetch all mock test attempts for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Retrieve attempts with populated exam metadata, sorted by startedAt (newest first)
    const attempts = await Attempt.find({ userId: dbUser._id })
      .populate("examId", "title category totalDuration sections")
      .sort({ startedAt: -1 });

    return NextResponse.json(attempts);
  } catch (error) {
    console.error("Error fetching user attempts:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
