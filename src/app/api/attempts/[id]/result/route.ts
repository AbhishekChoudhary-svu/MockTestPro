export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import Attempt from "@/models/Attempt";
import User from "@/models/User";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Find attempt
    const attempt = await Attempt.findOne({ _id: id, userId: dbUser._id });
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status !== "submitted" || !attempt.result) {
      return NextResponse.json(
        { error: "Attempt has not been submitted yet" },
        { status: 400 }
      );
    }

    // Calculate Rank and Percentile relative to all submitted attempts for this exam
    const allSubmitted = await Attempt.find({
      examId: attempt.examId,
      status: "submitted",
    }).select("result.totalScore");

    const totalCount = allSubmitted.length;
    let rank = 1;
    let lessOrEqualCount = 0;

    const currentScore = attempt.result.totalScore;

    for (const other of allSubmitted) {
      const otherScore = other.result?.totalScore ?? 0;
      if (otherScore > currentScore) {
        rank++;
      }
      if (otherScore <= currentScore) {
        lessOrEqualCount++;
      }
    }

    const percentile =
      totalCount > 0
        ? Math.round((lessOrEqualCount / totalCount) * 1000) / 10
        : 100;

    // Save rank and percentile in attempt result
    attempt.result.rank = rank;
    attempt.result.percentile = percentile;
    await attempt.save();

    // Now populate questions and exam details for the response
    const populatedAttempt = await Attempt.findOne({ _id: id, userId: dbUser._id })
      .populate({
        path: "responses.questionId",
        model: "Question",
      })
      .populate({
        path: "examId",
        model: "Exam",
      });

    return NextResponse.json(populatedAttempt);
  } catch (error) {
    console.error("Error fetching attempt result:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
