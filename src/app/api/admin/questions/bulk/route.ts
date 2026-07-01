export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import Question from "@/models/Question";
import Exam from "@/models/Exam";

interface RawQuestionInput {
  question?: string;
  passage?: string; // shared passage
  optionA?: string;
  option1?: string;
  optionB?: string;
  option2?: string;
  optionC?: string;
  option3?: string;
  optionD?: string;
  option4?: string;
  correctOption?: string;
  correctAnswer?: string;
  explanation?: string;
  examCategory?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json({ error: "Admin account not found" }, { status: 403 });
    }

    const body = await req.json();
    const { questions, category, subject } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "An array of questions is required" }, { status: 400 });
    }

    // Normalize and prepare questions for database insertion
    const normalizedQuestions = questions.map((q: RawQuestionInput) => {
      // Validate correct option
      let correctOpt = String(q.correctOption || q.correctAnswer || "A")
        .trim()
        .toUpperCase();
      if (!["A", "B", "C", "D"].includes(correctOpt)) {
        correctOpt = "A";
      }

      // Validate difficulty
      let diff = String(q.difficulty || "medium").trim().toLowerCase();
      if (!["easy", "medium", "hard"].includes(diff)) {
        diff = "medium";
      }

      return {
        question: String(q.question || "").trim(),
        passage: String(q.passage || "").trim(), // shared passage normalization
        optionA: String(q.optionA || q.option1 || "").trim(),
        optionB: String(q.optionB || q.option2 || "").trim(),
        optionC: String(q.optionC || q.option3 || "").trim(),
        optionD: String(q.optionD || q.option4 || "").trim(),
        correctOption: correctOpt,
        explanation: String(q.explanation || "").trim(),
        examCategory: category || q.examCategory || "",
        subject: subject || q.subject || "General",
        topic: String(q.topic || "General").trim(),
        difficulty: diff,
        addedBy: dbUser._id,
        usageCount: 0,
      };
    });

    // Validate that questions have required fields
    for (const q of normalizedQuestions) {
      if (!q.question) {
        return NextResponse.json({ error: "Question text is required for all questions" }, { status: 400 });
      }
      if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) {
        return NextResponse.json({ error: "All four options (A, B, C, D) are required" }, { status: 400 });
      }
    }

    // Batch insert into database
    const result = await Question.insertMany(normalizedQuestions);

    // Auto-link newly uploaded questions to existing exams in the same category
    for (const q of result) {
      try {
        const examsToUpdate = await Exam.find({});
        for (const exam of examsToUpdate) {
          let updated = false;
          for (const section of exam.sections) {
            const sName = section.name.toLowerCase().trim();
            const qSub = q.subject.toLowerCase().trim();

            // Match exact names, sub-strings, or key synonyms
            if (
              sName === qSub ||
              sName.includes(qSub) ||
              qSub.includes(sName) ||
              (qSub === "reasoning" && sName.includes("intelligence")) ||
              (qSub === "quantitative aptitude" && (sName.includes("math") || sName.includes("quantitative"))) ||
              (qSub === "gk" && (sName.includes("general knowledge") || sName.includes("general awareness") || sName.includes("studies")))
            ) {
              const questionIdStr = q._id.toString();
              const alreadyLinked = section.questions.some(
                (existingId) => existingId.toString() === questionIdStr
              );
              if (!alreadyLinked) {
                section.questions.push(q._id);
                section.questionCount = section.questions.length;
                updated = true;
              }
            }
          }
          if (updated) {
            await exam.save();
          }
        }
      } catch (err) {
        console.error(`Failed to auto-link question ${q._id} to exams:`, err);
      }
    }

    return NextResponse.json({
      message: `Successfully saved ${result.length} questions to the question bank.`,
      insertedCount: result.length,
    });
  } catch (error) {
    console.error("Bulk questions save error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
