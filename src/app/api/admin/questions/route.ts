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

// DELETE: Delete a question or bulk-delete multiple questions
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    // Verify admin
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Admin account not found" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const deleted = await Question.findByIdAndDelete(id);
      if (!deleted) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "Question deleted successfully" });
    }

    // Try to parse JSON body for bulk delete
    try {
      const body = await req.json();
      const { ids } = body;
      if (Array.isArray(ids) && ids.length > 0) {
        await Question.deleteMany({ _id: { $in: ids } });
        return NextResponse.json({ message: `${ids.length} questions deleted successfully` });
      }
    } catch {
      // Body parsing failed or no ids list provided
    }

    return NextResponse.json({ error: "Missing question ID or IDs list" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting question:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH: Update a question by ?id=<questionId>
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Admin account not found" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    const body = await req.json();

    // Only allow safe updatable fields
    const allowedFields = [
      "question", "optionA", "optionB", "optionC", "optionD",
      "correctOption", "explanation", "subject", "topic", "difficulty", "passage",
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await Question.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Question updated successfully", question: updated });
  } catch (error) {
    console.error("Error updating question:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
