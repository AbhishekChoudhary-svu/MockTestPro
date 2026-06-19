export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import Exam from "@/models/Exam";

// PATCH: Update exam configurations or status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await req.json();

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Update fields if provided
    if (body.title !== undefined) exam.title = String(body.title).trim();
    if (body.category !== undefined) {
      if (!String(body.category).trim()) {
        return NextResponse.json({ error: "Category cannot be empty" }, { status: 400 });
      }
      exam.category = String(body.category).trim();
    }
    if (body.totalDuration !== undefined) {
      if (typeof body.totalDuration !== "number" || body.totalDuration <= 0) {
        return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
      }
      exam.totalDuration = body.totalDuration;
    }
    if (body.sections !== undefined) {
      if (!Array.isArray(body.sections) || body.sections.length === 0) {
        return NextResponse.json({ error: "At least one section is required" }, { status: 400 });
      }
      // Simple section validation
      for (const sec of body.sections) {
        if (!sec.name || !sec.name.trim()) {
          return NextResponse.json({ error: "All sections must have a name" }, { status: 400 });
        }
        if (!sec.duration || typeof sec.duration !== "number" || sec.duration <= 0) {
          return NextResponse.json({ error: "All sections must have a valid duration" }, { status: 400 });
        }
      }
      // Normalize: always set questionCount = actual assigned questions length
      exam.sections = body.sections.map((sec: { name: string; subject?: string; duration: number; questionCount: number; markingScheme?: { correct: number; wrong: number }; questions: string[] }) => ({
        ...sec,
        questionCount: Array.isArray(sec.questions) ? sec.questions.length : 0,
      }));
    }
    if (body.instructions !== undefined) exam.instructions = String(body.instructions);
    if (body.status !== undefined) {
      if (!["draft", "published"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      exam.status = body.status;
    }

    await exam.save();

    return NextResponse.json({
      message: "Exam updated successfully",
      exam,
    });
  } catch (error) {
    console.error("Error updating exam:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: Delete an exam from the mock test database
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const deletedExam = await Exam.findByIdAndDelete(id);

    if (!deletedExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Exam deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting exam:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
