export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import Attempt from "@/models/Attempt";
import Exam from "@/models/Exam";
import Question from "@/models/Question";
import User from "@/models/User";

export async function POST(
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
    if (attempt.status === "submitted") {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Fetch all questions in this exam
    const allQuestionIds = exam.sections.flatMap(
      (s: { questions: unknown[] }) => s.questions
    );
    const questions = await Question.find({ _id: { $in: allQuestionIds } });
    const questionMap = new Map(
      questions.map((q) => [q._id.toString(), q])
    );

    // Calculate section-level results
    let totalScore = 0;
    let totalMarks = 0;
    const sectionResults = [];

    let qOffset = 0;
    for (const section of exam.sections) {
      const { name, questions: sectionQIds, markingScheme } = section;
      let sScore = 0;
      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      let timeSpent = 0;
      const sectionMaxMarks = sectionQIds.length * markingScheme.correct;

      for (const qId of sectionQIds) {
        const response = attempt.responses[qOffset];
        const question = questionMap.get(qId.toString());
        qOffset++;

        if (!response || !question) { skipped++; continue; }

        timeSpent += response.timeSpent || 0;

        if (!response.selectedOption) {
          skipped++;
        } else if (response.selectedOption === question.correctOption) {
          sScore += markingScheme.correct;
          correct++;
        } else {
          sScore += markingScheme.wrong; // negative value
          wrong++;
        }
      }

      const accuracy = (correct + wrong) > 0
        ? Math.round((correct / (correct + wrong)) * 100)
        : 0;

      sectionResults.push({
        sectionName: name,
        score: Math.max(0, sScore),
        correct,
        wrong,
        skipped,
        timeSpent,
        accuracy,
      });

      totalScore += Math.max(0, sScore);
      totalMarks += sectionMaxMarks;
    }

    attempt.status = "submitted";
    attempt.submittedAt = new Date();
    attempt.result = {
      totalScore,
      totalMarks,
      sectionResults,
    };

    await attempt.save();

    return NextResponse.json({
      message: "Submitted successfully",
      result: attempt.result,
      attemptId: attempt._id.toString(),
    });
  } catch (error) {
    console.error("Error submitting attempt:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
