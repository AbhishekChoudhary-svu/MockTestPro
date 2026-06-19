export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Exam from "@/models/Exam";
import ExamCategory from "@/models/ExamCategory";

// GET: Return distinct exam categories from published exams
export async function GET() {
  try {
    await dbConnect();
    const categories = await Exam.distinct("category", { status: "published" });
    if (categories.length === 0) {
      const dbCats = await ExamCategory.find().sort({ name: 1 });
      return NextResponse.json({ categories: dbCats.map((c) => c.name) });
    }
    return NextResponse.json({ categories: categories.sort() });
  } catch (error) {
    console.error("Error fetching exam categories:", error);
    try {
      const dbCats = await ExamCategory.find().sort({ name: 1 });
      return NextResponse.json({ categories: dbCats.map((c) => c.name) });
    } catch {
      return NextResponse.json({ categories: ["SSC", "Railway", "Banking", "PSC"] });
    }
  }
}
