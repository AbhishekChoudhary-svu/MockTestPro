export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import Question from "@/models/Question";
import ExamCategory from "@/models/ExamCategory";
import SubjectCategory from "@/models/SubjectCategory";

// GET: list questions, optionally filtered by category AND/OR subject
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subject = searchParams.get("subject");
    const topic = searchParams.get("topic");
    const difficulty = searchParams.get("difficulty");
    const q = searchParams.get("q");
    // New: fetch only a count, or distinct values only
    const mode = searchParams.get("mode"); // "meta" = only return distinct values

    // Build filter query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterQuery: any = {};

    if (category && category !== "All") {
      filterQuery.examCategory = category;
    }
    if (subject && subject !== "All") {
      filterQuery.subject = subject;
    }
    if (topic && topic !== "All") {
      filterQuery.topic = topic;
    }
    if (difficulty && difficulty !== "All") {
      filterQuery.difficulty = difficulty;
    }
    if (q && q.trim()) {
      filterQuery.question = { $regex: q.trim(), $options: "i" };
    }

    // Distinct query (always scoped to category if provided)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const distinctQuery: any = {};
    if (category && category !== "All") {
      distinctQuery.examCategory = category;
    }

    // Ensure seeding is run if empty
    const examCatsCount = await ExamCategory.countDocuments();
    if (examCatsCount === 0) {
      const defaults = ["SSC", "Railway", "Banking", "PSC"];
      const questionCats = await Question.distinct("examCategory");
      const allCats = Array.from(new Set([...defaults, ...questionCats].filter(Boolean)));
      await ExamCategory.insertMany(allCats.map((name) => ({ name })));
    }

    const subjCatsCount = await SubjectCategory.countDocuments();
    if (subjCatsCount === 0) {
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
      await SubjectCategory.insertMany(defaults);
    }

    const subjectFilter = category && category !== "All" ? { examCategory: category } : {};

    // Fetch distinct fields for dropdowns
    const [dbExamCategories, dbSubjectCategories, distinctTopics, qCategories, qSubjects] = await Promise.all([
      ExamCategory.find().sort({ name: 1 }),
      SubjectCategory.find(subjectFilter).sort({ name: 1 }),
      Question.distinct("topic", distinctQuery),
      Question.distinct("examCategory"),
      Question.distinct("subject", distinctQuery),
    ]);

    const distinctCategories = Array.from(
      new Set([...dbExamCategories.map((c) => c.name), ...qCategories].filter(Boolean))
    ).sort();

    const distinctSubjects = Array.from(
      new Set([...dbSubjectCategories.map((s) => s.name), ...qSubjects].filter(Boolean))
    ).sort();

    if (mode === "meta") {
      // Return only metadata (no questions array) for lightweight category/subject loads
      return NextResponse.json({
        questions: [],
        distinctSubjects,
        distinctTopics,
        distinctCategories,
      });
    }

    // Fetch questions matching criteria
    const questions = await Question.find(filterQuery).sort({ createdAt: -1 });

    return NextResponse.json({
      questions,
      distinctSubjects,
      distinctTopics,
      distinctCategories,
    });
  } catch (error) {
    console.error("Error in admin questions query API:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
