export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import Exam from "@/models/Exam";

// GET: Fetch all exams (draft and published) for admin management
export async function GET() {
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

    const exams = await Exam.find({}).sort({ createdAt: -1 });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("Error fetching all exams for admin:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Create a new exam
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
    const { title, category, totalDuration, sections, instructions, status } = body;

    // Validate basic info
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Exam title is required" }, { status: 400 });
    }
    if (!category || !category.trim()) {
      return NextResponse.json({ error: "Exam category is required" }, { status: 400 });
    }
    if (!totalDuration || typeof totalDuration !== "number" || totalDuration <= 0) {
      return NextResponse.json({ error: "Valid total duration is required" }, { status: 400 });
    }

    // Validate sections
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json({ error: "At least one section is required" }, { status: 400 });
    }

    for (const sec of sections) {
      if (!sec.name || !sec.name.trim()) {
        return NextResponse.json({ error: "All sections must have a name" }, { status: 400 });
      }
      if (!sec.duration || typeof sec.duration !== "number" || sec.duration <= 0) {
        return NextResponse.json({ error: "All sections must have a valid duration" }, { status: 400 });
      }
      if (sec.questionCount === undefined || typeof sec.questionCount !== "number" || sec.questionCount < 0) {
        return NextResponse.json({ error: "All sections must specify a question count" }, { status: 400 });
      }
      if (!sec.questions || !Array.isArray(sec.questions)) {
        return NextResponse.json({ error: "All sections must contain a questions array" }, { status: 400 });
      }
      if (!sec.markingScheme || typeof sec.markingScheme.correct !== "number" || typeof sec.markingScheme.wrong !== "number") {
        return NextResponse.json({ error: "All sections must contain a marking scheme with correct and wrong values" }, { status: 400 });
      }
    }

    // Normalize: always set questionCount = actual assigned questions length
    const normalizedSections = sections.map((sec: { name: string; subject?: string; duration: number; questionCount: number; markingScheme: { correct: number; wrong: number }; questions: string[] }) => ({
      ...sec,
      questionCount: Array.isArray(sec.questions) ? sec.questions.length : 0,
    }));

    const newExam = await Exam.create({
      title: title.trim(),
      category: category.trim(),
      totalDuration,
      sections: normalizedSections,
      instructions: instructions || "",
      status: status || "draft",
      createdBy: dbUser._id,
      attemptCount: 0,
    });

    return NextResponse.json({
      message: "Exam created successfully",
      examId: newExam._id.toString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating exam:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
