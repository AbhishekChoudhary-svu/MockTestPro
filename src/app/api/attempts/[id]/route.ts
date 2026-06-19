export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import Attempt from "@/models/Attempt";
import User from "@/models/User";
import Exam from "@/models/Exam";

export async function PATCH(
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
    const body = await req.json();
    const { responses, currentSection } = body;

    const attempt = await Attempt.findOne({ _id: id, userId: dbUser._id });
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status === "submitted") {
      return NextResponse.json({ error: "Attempt already submitted" }, { status: 400 });
    }

    if (responses !== undefined) attempt.responses = responses;
    if (currentSection !== undefined) attempt.currentSection = currentSection;

    await attempt.save();

    return NextResponse.json({ message: "Saved successfully" });
  } catch (error) {
    console.error("Error saving attempt:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

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
    const attempt = await Attempt.findOne({ _id: id, userId: dbUser._id });
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Sync attempt responses with latest exam configurations (if attempt is in-progress)
    if (attempt.status === "in-progress") {
      const exam = await Exam.findById(attempt.examId);
      if (exam) {
        // Map existing response data
        const responseMap = new Map();
        for (const r of attempt.responses) {
          if (r && r.questionId) {
            responseMap.set(r.questionId.toString(), r);
          }
        }

        // Generate aligned response structure from active exam layout
        const currentQuestions = exam.sections.flatMap((s) => s.questions || []);
        let updated = false;

        const syncedResponses = currentQuestions
          .filter((qId) => qId !== null && qId !== undefined)
          .map((qId) => {
            const key = qId.toString();
            if (responseMap.has(key)) {
              return responseMap.get(key);
            } else {
              updated = true;
              return {
                questionId: qId,
                selectedOption: null,
                isMarkedForReview: false,
                timeSpent: 0,
              };
            }
          });

        // Determine if alignment requires DB update
        const sizeMismatch = attempt.responses.length !== syncedResponses.length;
        let orderMismatch = false;
        if (!sizeMismatch) {
          for (let i = 0; i < attempt.responses.length; i++) {
            if (attempt.responses[i].questionId.toString() !== syncedResponses[i].questionId.toString()) {
              orderMismatch = true;
              break;
            }
          }
        }

        if (updated || sizeMismatch || orderMismatch) {
          attempt.responses = syncedResponses as unknown as typeof attempt.responses;
          await attempt.save();
        }
      }
    }

    return NextResponse.json(attempt);
  } catch (error) {
    console.error("Error fetching attempt:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
