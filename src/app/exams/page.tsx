"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { 
  BookOpen, 
  Users, 
  Layers, 
  Loader2,
  FileText
} from "lucide-react";

interface ExamSection {
  name: string;
  duration: number;
  questionCount: number;
  markingScheme: {
    correct: number;
    wrong: number;
  };
}

interface ExamData {
  _id: string;
  title: string;
  category: string; // dynamic — any string
  totalDuration: number;
  sections: ExamSection[];
  instructions: string;
  status: string;
  attemptCount: number;
}


function CatalogContent() {
  useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialCategory = searchParams.get("category") || "All";
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["All"]);

  // Sync state if query param changes
  useEffect(() => {
    const cat = searchParams.get("category") || "All";
    setActiveCategory(cat);
  }, [searchParams]);

  // Load distinct categories from DB
  useEffect(() => {
    fetch("/api/exams/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(["All", ...(data.categories || [])]);
      })
      .catch(() => setCategories(["All", "SSC", "Railway", "Banking", "PSC"]));
  }, []);

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const url = activeCategory === "All" 
        ? "/api/exams" 
        : `/api/exams?category=${encodeURIComponent(activeCategory)}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      }
    } catch (e) {
      console.error("Error fetching exams:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    // Update URL search parameters
    const params = new URLSearchParams();
    if (category !== "All") {
      params.set("category", category);
    }
    router.push(`/exams?${params.toString()}`);
  };

  // Helper to determine difficulty based on name or section counts (since we didn't store diff on exam schema directly)
  const getExamDifficulty = (exam: ExamData) => {
    if (exam.category === "Banking" || exam.title.toLowerCase().includes("po")) {
      return { text: "Hard", color: "bg-red-50 text-red-700 border-red-200" };
    }
    if (exam.title.toLowerCase().includes("tier 1") || exam.title.toLowerCase().includes("stage 1")) {
      return { text: "Medium", color: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    return { text: "Easy", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "SSC":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Railway":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Banking":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "PSC":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getExamQuestionsCount = (exam: ExamData) => {
    return exam.sections.reduce((sum, s) => sum + s.questionCount, 0);
  };

  const getExamTotalMarks = (exam: ExamData) => {
    return exam.sections.reduce((sum, s) => sum + (s.questionCount * s.markingScheme.correct), 0);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-16">
      {/* Top Navbar */}
      <Header />

      {/* Catalog Header */}
      <div className="bg-gradient-to-b from-[#1A56DB] to-[#1245B2] text-white py-10 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl font-extrabold font-heading sm:text-4xl">
          Mock Test Catalog
        </h1>
        <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
          Choose from exam-accurate practice setups. Test your speed and section strategies under real test conditions.
        </p>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Category Filter Tabs */}
        <div className="flex justify-center mb-8 overflow-x-auto pb-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-[#1A56DB] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                {cat === "All" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#1A56DB]" />
            <p className="text-slate-500 font-medium font-sans">Loading mock tests...</p>
          </div>
        ) : exams.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 text-center py-16 px-4">
            <div className="inline-flex rounded-full bg-slate-50 p-4 text-slate-400 mb-4">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-heading">No Mock Tests Available</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              There are no published mock tests in the <strong>{activeCategory}</strong> category at the moment. Check back later!
            </p>
          </div>
        ) : (
          /* Exams Grid */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => {
              const diff = getExamDifficulty(exam);
              const qCount = getExamQuestionsCount(exam);
              const marks = getExamTotalMarks(exam);

              return (
                <div 
                  key={exam._id} 
                  className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between"
                >
                  <div>
                    {/* Badge Row */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${getCategoryBadgeColor(exam.category)}`}>
                        {exam.category === "PSC" ? "State PSC" : exam.category}
                      </span>
                      <div className="flex gap-1.5 items-center">
                        <span className="rounded bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                          FREE
                        </span>
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${diff.color}`}>
                          {diff.text}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-800 font-heading line-clamp-1 group-hover:text-[#1A56DB]">
                      {exam.title}
                    </h3>

                    {/* Sections overview */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {exam.sections.length} Sections: {exam.sections.map(s => s.name).join(", ")}
                      </span>
                    </div>

                    {/* Stats Table */}
                    <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-center border border-slate-100/50">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Questions</p>
                        <p className="text-sm font-black text-slate-700 mt-0.5">{qCount}</p>
                      </div>
                      <div className="border-x border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marks</p>
                        <p className="text-sm font-black text-slate-700 mt-0.5">{marks}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                        <p className="text-sm font-black text-slate-700 mt-0.5">{exam.totalDuration}m</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer & CTA */}
                  <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>{exam.attemptCount || 0} attempted</span>
                    </div>
                    <Link
                      href={`/exam/${exam._id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#1A56DB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Attempt Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ExamsPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#1A56DB]" />
            <p className="text-gray-500 font-medium font-sans">Loading page...</p>
          </div>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
