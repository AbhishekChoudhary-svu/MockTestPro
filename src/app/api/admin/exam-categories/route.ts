export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import ExamCategory from "@/models/ExamCategory";
import Exam from "@/models/Exam";
import Question from "@/models/Question";

// Helper to check admin session
async function isAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;
  await dbConnect();
  const dbUser = await User.findOne({ email: session.user.email });
  return dbUser && dbUser.role === "admin";
}

// GET: List all exam categories. Seeds defaults if collection is empty.
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const count = await ExamCategory.countDocuments();
    if (count === 0) {
      const defaults = ["SSC", "Railway", "Banking", "PSC"];
      const [examCats, questionCats] = await Promise.all([
        Exam.distinct("category"),
        Question.distinct("examCategory"),
      ]);
      const allCats = Array.from(
        new Set([...defaults, ...examCats, ...questionCats].filter(Boolean))
      );
      await ExamCategory.insertMany(allCats.map((name) => ({ name })));
    }

    const categories = await ExamCategory.find().sort({ name: 1 });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching exam categories:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Add new exam category
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const cleanName = name.trim();
    const existing = await ExamCategory.findOne({ name: { $regex: `^${cleanName}$`, $options: "i" } });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const newCategory = await ExamCategory.create({ name: cleanName });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating exam category:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: Delete an exam category
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

    const deleted = await ExamCategory.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting exam category:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
