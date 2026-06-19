export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import SubjectCategory from "@/models/SubjectCategory";
import Question from "@/models/Question";

// Helper to check admin session
async function isAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;
  await dbConnect();
  const dbUser = await User.findOne({ email: session.user.email });
  return dbUser && dbUser.role === "admin";
}

// GET: List all subject categories (or filtered by examCategory). Seeds defaults if empty.
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const examCategory = searchParams.get("examCategory");

    const count = await SubjectCategory.countDocuments();
    if (count === 0) {
      const defaults = [
        { name: "General Awareness", examCategory: "SSC" },
        { name: "Quantitative Aptitude", examCategory: "SSC" },
        { name: "English Language", examCategory: "SSC" },
        { name: "General Intelligence & Reasoning", examCategory: "SSC" },

        { name: "Reasoning Ability", examCategory: "Banking" },
        { name: "Quantitative Aptitude", examCategory: "Banking" },
        { name: "English Language", examCategory: "Banking" },
        { name: "General Awareness", examCategory: "Banking" },

        { name: "General Awareness", examCategory: "Railway" },
        { name: "Mathematics", examCategory: "Railway" },
        { name: "General Intelligence & Reasoning", examCategory: "Railway" },
        { name: "General Science", examCategory: "Railway" },

        { name: "General Studies", examCategory: "PSC" },
        { name: "Aptitude & Mental Ability", examCategory: "PSC" },
      ];

      // Also extract from current questions in the database
      const questions = await Question.find({}, { subject: 1, examCategory: 1 });
      const uniquePairs = new Map<string, { name: string; examCategory: string }>();
      for (const q of questions) {
        if (q.subject && q.examCategory) {
          const key = `${q.subject.trim()}|||${q.examCategory.trim()}`;
          uniquePairs.set(key, { name: q.subject.trim(), examCategory: q.examCategory.trim() });
        }
      }

      const listToInsert = [...defaults];
      uniquePairs.forEach((pair) => {
        const exists = listToInsert.some(
          (item) =>
            item.name.toLowerCase() === pair.name.toLowerCase() &&
            item.examCategory.toLowerCase() === pair.examCategory.toLowerCase()
        );
        if (!exists) {
          listToInsert.push(pair);
        }
      });

      if (listToInsert.length > 0) {
        await SubjectCategory.insertMany(listToInsert);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (examCategory) {
      query.examCategory = examCategory;
    }

    const subjects = await SubjectCategory.find(query).sort({ examCategory: 1, name: 1 });
    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subject categories:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Add new subject category under an exam category
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, examCategory } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Subject name is required" }, { status: 400 });
    }
    if (!examCategory || !examCategory.trim()) {
      return NextResponse.json({ error: "Exam Category is required" }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanExamCat = examCategory.trim();

    const existing = await SubjectCategory.findOne({
      name: { $regex: `^${cleanName}$`, $options: "i" },
      examCategory: { $regex: `^${cleanExamCat}$`, $options: "i" },
    });
    if (existing) {
      return NextResponse.json({ error: "Subject already exists in this exam category" }, { status: 400 });
    }

    const newSubject = await SubjectCategory.create({
      name: cleanName,
      examCategory: cleanExamCat,
    });
    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    console.error("Error creating subject category:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: Delete a subject category
export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const deleted = await SubjectCategory.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Subject category not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Subject category deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject category:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
