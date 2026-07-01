export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Exam from "@/models/Exam";
import ExamCategory from "@/models/ExamCategory";

// GET: Return distinct exam categories from active (live/upcoming) exams
export async function GET() {
  try {
    await dbConnect();
    const categories = await Exam.distinct("category", { status: { $in: ["live", "upcoming"] } });
    return NextResponse.json({ categories: categories.sort() });
  } catch (error) {
    console.error("Error fetching active exam categories:", error);
    return NextResponse.json({ categories: [] });
  }
}
