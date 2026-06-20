export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Exam from "@/models/Exam";
import Question from "@/models/Question";

// Force model registration and prevent tree-shaking
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ = Question.modelName;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;

    const exam = await Exam.findById(id).populate("sections.questions");

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Error fetching exam details:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
