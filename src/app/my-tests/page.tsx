"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/Header";
import {
  Calendar,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Percent,
  CheckCircle,
  PlayCircle,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

interface ExamSection {
  name: string;
  duration: number;
  questionCount: number;
}

interface ExamInfo {
  _id: string;
  title: string;
  category: string;
  totalDuration: number;
  sections: ExamSection[];
}

interface IResponse {
  questionId: string;
  selectedOption: string | null;
  timeSpent: number;
}

interface ISectionResult {
  sectionName: string;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  timeSpent: number;
  accuracy: number;
}

interface IResult {
  totalScore: number;
  totalMarks: number;
  sectionResults: ISectionResult[];
}

interface AttemptData {
  _id: string;
  examId: ExamInfo | null;
  status: "in-progress" | "submitted";
  startedAt: string;
  submittedAt?: string;
  currentSection: number;
  responses: IResponse[];
  result?: IResult;
}

const CATEGORY_COLORS: Record<string, string> = {
  SSC: "bg-blue-50 text-blue-700 border-blue-200",
  Railway: "bg-amber-50 text-amber-700 border-amber-200",
  Banking: "bg-purple-50 text-purple-700 border-purple-200",
  PSC: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function MyAttemptsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "in-progress" | "submitted">("all");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchAttempts();
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/my-tests");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await fetch("/api/attempts");
      if (res.ok) {
        const data = await res.json();
        setAttempts(data);
      } else {
        setErrorMsg("Failed to retrieve attempts history.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load attempt logs due to a connection issue.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAttempts = () => {
    if (activeTab === "all") return attempts;
    return attempts.filter((att) => att.status === activeTab);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAnsweredCount = (attempt: AttemptData) => {
    return attempt.responses.filter((r) => r.selectedOption !== null).length;
  };

  const getTotalQuestionsCount = (attempt: AttemptData) => {
    if (!attempt.examId) return attempt.responses.length;
    return attempt.examId.sections.reduce((sum, s) => sum + s.questionCount, 0);
  };

  

  const filtered = getFilteredAttempts();
  const inProgressCount = attempts.filter((a) => a.status === "in-progress").length;
  const submittedCount = attempts.filter((a) => a.status === "submitted").length;

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-20">
      {/* Top Navbar */}
      <Header />

      {/* Header Banner */}
      <div className="bg-gradient-to-b from-[#1A56DB] to-[#1245B2] text-white py-10 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl font-extrabold font-heading sm:text-4xl">
          My Exam Attempts
        </h1>
        <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
          Review your performance, analyze solutions, or pick up right where you left off on in-progress exams.
        </p>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filters and Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {[
              { id: "all", label: "All Tests", count: attempts.length },
              { id: "in-progress", label: "In Progress", count: inProgressCount },
              { id: "submitted", label: "Submitted", count: submittedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "all" | "in-progress" | "submitted")}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-[#1A56DB] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <Link
            href="/exams"
            className="text-sm font-bold text-[#1A56DB] hover:text-blue-800 transition-colors flex items-center gap-1"
          >
            Practice new tests <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Attempts Grid / List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
              >
                <div className="animate-pulse">
                  <div className="flex gap-2 mb-4">
                    <div className="h-5 w-20 rounded-full bg-slate-200" />
                    <div className="h-5 w-24 rounded-full bg-slate-200" />
                  </div>
                  <div className="h-6 w-2/3 rounded bg-slate-200 mb-4" />
                  <div className="flex gap-4 mb-6">
                    <div className="h-4 w-28 rounded bg-slate-200" />
                    <div className="h-4 w-20 rounded bg-slate-200" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="space-y-2 flex-1 mr-6">
                      <div className="h-4 w-40 rounded bg-slate-200" />
                      <div className="h-2 w-full rounded-full bg-slate-200" />
                    </div>
                    <div className="h-11 w-36 rounded-xl bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-16 px-4">
            <div className="inline-flex rounded-full bg-slate-50 p-4 text-slate-400 mb-4">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-heading">No Attempts Found</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              {activeTab === "all"
                ? "You haven't attempted any mock tests yet. Browse the catalog to start practicing!"
                : activeTab === "in-progress"
                ? "You don't have any paused or in-progress tests at the moment."
                : "You haven't submitted any tests yet. Complete an ongoing mock test to see your score analysis."}
            </p>
            <Link
              href="/exams"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1A56DB] to-blue-700 hover:from-blue-700 hover:to-blue-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm"
            >
              Explore Catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((att) => {
              const exam = att.examId;
              const totalQs = getTotalQuestionsCount(att);
              const answered = getAnsweredCount(att);
              const progressPercent = totalQs > 0 ? Math.round((answered / totalQs) * 100) : 0;

              return (
                <div
                  key={att._id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                  <div className="space-y-2.5 flex-1">
                    {/* Category & Status Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          exam
                            ? CATEGORY_COLORS[exam.category] || "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {exam ? exam.category : "Unknown Category"}
                      </span>
                      {att.status === "in-progress" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                          Submitted
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-extrabold text-slate-800 font-heading leading-tight">
                      {exam ? exam.title : "Deleted Exam"}
                    </h3>

                    {/* Timestamp */}
                    <div className="flex items-center gap-4 text-slate-400 text-xs font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(att.startedAt)}
                      </span>
                      {exam && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {exam.totalDuration} Mins
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics and CTA */}
                  <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center justify-between gap-6 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                    {/* Metrics view */}
                    {att.status === "submitted" && att.result ? (
                      <div className="flex gap-4 sm:gap-6 text-center sm:text-left justify-around sm:justify-start">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-0.5 justify-center sm:justify-start">
                            <Award className="h-3 w-3 text-[#1A56DB]" /> Score
                          </p>
                          <p className="text-sm font-black text-slate-700">
                            {att.result.totalScore} / {att.result.totalMarks}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-0.5 justify-center sm:justify-start">
                            <Percent className="h-3 w-3 text-emerald-600" /> Accuracy
                          </p>
                          <p className="text-sm font-black text-slate-700">
                            {att.result.sectionResults[0]
                              ? Math.round(
                                  (att.result.sectionResults.reduce((s, r) => s + r.accuracy, 0) /
                                    att.result.sectionResults.length)
                                )
                              : 0}
                            %
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 flex-1 max-w-[220px]">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-0.5">
                            <HelpCircle className="h-3.5 w-3.5 text-amber-500" /> {answered}/{totalQs} Qs
                          </span>
                          <span>{progressPercent}% Done</span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {att.status === "in-progress" ? (
                      <Link
                        id={`resume-${att._id}`}
                        href={exam ? `/exam/${exam._id}/test/${att._id}` : "#"}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-5 py-3 text-xs font-extrabold text-white shadow-sm hover:shadow-md transition-all text-center"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Resume Test
                      </Link>
                    ) : (
                      <Link
                        id={`analysis-${att._id}`}
                        href={exam ? `/exam/${exam._id}/result/${att._id}` : `/results/${att._id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-5 py-3 text-xs font-extrabold shadow-sm hover:shadow transition-all text-center"
                      >
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        Analysis & solutions
                      </Link>
                    )}
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
