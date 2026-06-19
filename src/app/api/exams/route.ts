export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Exam from "@/models/Exam";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { status: "published" };
    if (category && category !== "All" && category !== "") {
      query.category = category;
    }

    const exams = await Exam.find(query).sort({ createdAt: -1 });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("Error fetching exams list:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
