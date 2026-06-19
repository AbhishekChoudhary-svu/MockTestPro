"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Activity,
  BookOpen,
  HelpCircle,
  Trophy,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface Question {
  _id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  examCategory: string;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

interface ResponseItem {
  questionId: Question | null;
  selectedOption: "A" | "B" | "C" | "D" | null;
  isMarkedForReview: boolean;
  timeSpent: number;
}

interface SectionResult {
  sectionName: string;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  timeSpent: number;
  accuracy: number;
}

interface AttemptResult {
  totalScore: number;
  totalMarks: number;
  rank?: number;
  percentile?: number;
  sectionResults: SectionResult[];
}

interface ExamData {
  _id: string;
  title: string;
  category: string;
  totalDuration: number;
  sections: Array<{
    name: string;
    duration: number;
    questionCount: number;
    questions: string[];
    markingScheme: {
      correct: number;
      wrong: number;
    };
  }>;
}

interface AttemptData {
  _id: string;
  examId: ExamData;
  status: string;
  startedAt: string;
  submittedAt: string;
  responses: ResponseItem[];
  result: AttemptResult;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ExamResultsPage({
  params,
}: {
  params: { id: string; attemptId: string };
}) {
  const { status } = useSession();
  const { attemptId } = params;

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Filters for questions
  const [qFilter, setQFilter] = useState<"all" | "correct" | "wrong" | "skipped">("all");
  // Section filter for questions
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>("all");
  // Expanded explanations state
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setMounted(true);
    if (status === "authenticated") {
      loadResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const loadResults = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}/result`);
      if (res.ok) {
        const data = await res.json();
        setAttempt(data);
      }
    } catch (err) {
      console.error("Error loading results:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExplanation = (idx: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Recharts Donut data
  const donutData = useMemo(() => {
    if (!attempt?.result) return [];
    const totalCorrect = attempt.result.sectionResults.reduce((a, s) => a + s.correct, 0);
    const totalWrong = attempt.result.sectionResults.reduce((a, s) => a + s.wrong, 0);
    const totalSkipped = attempt.result.sectionResults.reduce((a, s) => a + s.skipped, 0);

    return [
      { name: "Correct", value: totalCorrect, color: "#10B981" },
      { name: "Wrong", value: totalWrong, color: "#EF4444" },
      { name: "Skipped", value: totalSkipped, color: "#64748B" },
    ];
  }, [attempt]);

  // Recharts Section Scores Bar chart
  const sectionScoresData = useMemo(() => {
    if (!attempt?.result || !attempt?.examId) return [];
    const { sectionResults } = attempt.result;
    const examSections = attempt.examId.sections;

    return sectionResults.map((sec) => {
      const examSec = examSections.find((s) => s.name === sec.sectionName);
      const maxScore = examSec
        ? examSec.questions.length * examSec.markingScheme.correct
        : sec.score;
      return {
        name: sec.sectionName,
        Score: sec.score,
        "Max Score": maxScore,
      };
    });
  }, [attempt]);

  // Recharts Section Time Spent Bar chart
  const sectionTimeData = useMemo(() => {
    if (!attempt?.result) return [];
    return attempt.result.sectionResults.map((sec) => ({
      name: sec.sectionName,
      "Minutes": Math.round((sec.timeSpent / 60) * 10) / 10,
    }));
  }, [attempt]);

  // Fastest and slowest answered questions
  const { fastestQuestion, slowestQuestion } = useMemo(() => {
    if (!attempt?.responses) return { fastestQuestion: null, slowestQuestion: null };

    // Map each response to include its 1-based index and section name
    const responsesWithIndex = attempt.responses.map((res, index) => {
      // Find which section this question belongs to in exam sections
      let sectionName = "General";
      let runningSum = 0;
      if (attempt.examId?.sections) {
        for (const sec of attempt.examId.sections) {
          runningSum += sec.questions.length;
          if (index < runningSum) {
            sectionName = sec.name;
            break;
          }
        }
      }

      return {
        ...res,
        qNum: index + 1,
        sectionName,
      };
    });

    // Answered questions only
    const answered = responsesWithIndex.filter(
      (res) => res.selectedOption !== null && res.questionId !== null
    );

    if (answered.length === 0) {
      return { fastestQuestion: null, slowestQuestion: null };
    }

    const sorted = [...answered].sort((a, b) => a.timeSpent - b.timeSpent);
    return {
      fastestQuestion: sorted[0],
      slowestQuestion: sorted[sorted.length - 1],
    };
  }, [attempt]);

  // Filtered list of questions with their index
  const filteredQuestions = useMemo(() => {
    if (!attempt?.responses) return [];

    const mapped = attempt.responses.map((res, index) => {
      let sectionName = "General";
      if (attempt.examId?.sections) {
        let tempSum = 0;
        for (const sec of attempt.examId.sections) {
          tempSum += sec.questions.length;
          if (index < tempSum) {
            sectionName = sec.name;
            break;
          }
        }
      }

      const isCorrect =
        res.selectedOption !== null &&
        res.questionId !== null &&
        res.selectedOption === res.questionId.correctOption;

      const isWrong =
        res.selectedOption !== null &&
        res.questionId !== null &&
        res.selectedOption !== res.questionId.correctOption;

      return {
        ...res,
        qNum: index + 1,
        sectionName,
        status: isCorrect ? "correct" : isWrong ? "wrong" : "skipped",
      };
    });

    return mapped.filter((item) => {
      const matchSection =
        activeSectionFilter === "all" || item.sectionName === activeSectionFilter;
      const matchStatus = qFilter === "all" || item.status === qFilter;
      return matchSection && matchStatus;
    });
  }, [attempt, qFilter, activeSectionFilter]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="text-center flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#1A56DB] mb-3" />
          <p className="text-slate-500 font-medium">Generating performance insights...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !attempt.result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="text-center p-6 bg-white rounded-xl border border-slate-100 shadow-sm max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Results Found</h2>
          <p className="text-slate-500 text-sm mb-6">
            {"We couldn't retrieve result details for this attempt. It might not be submitted yet."}
          </p>
          <Link
            href="/exams"
            className="inline-flex items-center justify-center w-full px-4 py-2 bg-[#1A56DB] hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Exams
          </Link>
        </div>
      </div>
    );
  }

  const { result, examId: exam } = attempt;
  const examTitle = exam?.title || "Mock Exam";
  const percentage =
    result.totalMarks > 0
      ? Math.round((result.totalScore / result.totalMarks) * 100)
      : 0;

  const totalCorrect = result.sectionResults.reduce((a, s) => a + s.correct, 0);
  const totalWrong = result.sectionResults.reduce((a, s) => a + s.wrong, 0);
  const totalTime = result.sectionResults.reduce((a, s) => a + s.timeSpent, 0);
  const overallAccuracy =
    totalCorrect + totalWrong > 0
      ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
      : 0;

  // Grade color scheme
  const themeColors =
    percentage >= 70
      ? {
          primary: "text-emerald-600",
          bg: "from-emerald-50 to-emerald-100/50 border-emerald-200",
          badge: "bg-emerald-100 text-emerald-800",
          text: "🎉 Excellent job! You did amazing.",
        }
      : percentage >= 40
      ? {
          primary: "text-amber-600",
          bg: "from-amber-50 to-amber-100/50 border-amber-200",
          badge: "bg-amber-100 text-amber-800",
          text: "👍 Good attempt! A bit more practice will get you to the top.",
        }
      : {
          primary: "text-red-600",
          bg: "from-red-50 to-red-100/50 border-red-200",
          badge: "bg-red-100 text-red-800",
          text: "💪 Don't give up! Review explanations and try again.",
        };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-20">
      {/* Top Navbar */}
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/" className="hover:text-[#1A56DB] transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/exams" className="hover:text-[#1A56DB] transition-colors">Exams</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600 truncate max-w-xs">{examTitle}</span>
        </div>

        {/* Dashboard Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading tracking-tight">
            Performance Analysis Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{examTitle}</p>
        </div>

        {/* Section 1: Score Summary Card & Donut Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score Box */}
          <div
            className={`lg:col-span-2 bg-gradient-to-br ${themeColors.bg} border rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Attempt Summary
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${themeColors.badge}`}>
                  {percentage >= 70 ? "Excellent" : percentage >= 40 ? "Pass" : "Needs Review"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 my-4">
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-1">Score</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-800">
                    {result.totalScore} <span className="text-xs font-medium text-slate-400">/ {result.totalMarks}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-1">Percentage</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-800">{percentage}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-1">Accuracy</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-800">{overallAccuracy}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-1">Time Taken</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-800">{formatTime(totalTime)}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200/60 pt-6 mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/30 flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">All India Rank</p>
                  <p className="text-lg font-black text-slate-800">#{result.rank || 1}</p>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/30 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Percentile</p>
                  <p className="text-lg font-black text-slate-800">{result.percentile ?? 100}%</p>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs font-semibold text-slate-500">
              {themeColors.text}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
              Accuracy Breakdown
            </h3>
            <div className="h-[180px] w-full flex items-center justify-center">
              {mounted && donutData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-10 w-10 animate-spin text-[#1A56DB]" />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mt-4">
              {donutData.map((d) => (
                <div key={d.name}>
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
                    style={{ backgroundColor: d.color }}
                  ></span>
                  <span className="text-xs font-bold text-slate-600">{d.name}</span>
                  <p className="text-sm font-black text-slate-800">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Section-wise Analysis (Table & Score Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 font-heading flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#1A56DB]" />
              Section-wise Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase font-bold text-slate-400 text-left border-b border-slate-100">
                    <th className="pb-3 pr-2">Section</th>
                    <th className="pb-3 text-center">Score</th>
                    <th className="pb-3 text-center">Correct</th>
                    <th className="pb-3 text-center font-bold text-red-500">Wrong</th>
                    <th className="pb-3 text-center font-bold text-slate-400">Skipped</th>
                    <th className="pb-3 text-center">Accuracy</th>
                    <th className="pb-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {result.sectionResults.map((sec, idx) => (
                    <tr key={idx} className="text-slate-700 hover:bg-slate-50/50">
                      <td className="py-3 pr-2 font-bold text-slate-800">{sec.sectionName}</td>
                      <td className="py-3 text-center font-black text-[#1A56DB]">{sec.score}</td>
                      <td className="py-3 text-center text-emerald-600 font-bold">{sec.correct}</td>
                      <td className="py-3 text-center text-red-500 font-bold">{sec.wrong}</td>
                      <td className="py-3 text-center text-slate-400">{sec.skipped}</td>
                      <td className="py-3 text-center">
                        <span
                          className={`font-black px-2 py-0.5 rounded text-[10px] ${
                            sec.accuracy >= 70
                              ? "bg-emerald-50 text-emerald-700"
                              : sec.accuracy >= 40
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {sec.accuracy}%
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-500 text-[10px]">
                        {formatTime(sec.timeSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Scores Chart */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
              Scores vs Section Max
            </h3>
            <div className="h-[200px] w-full">
              {mounted && sectionScoresData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionScoresData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey="Score" fill="#1A56DB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Max Score" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-5 w-5 animate-spin text-[#1A56DB]" />
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Time Analysis (Chart & Callouts) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Time spent chart */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-heading mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#1A56DB]" />
                Section-wise Time Distribution
              </h3>
            </div>
            <div className="h-[220px] w-full">
              {mounted && sectionTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionTimeData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} unit="m" />
                    <Tooltip formatter={(value) => `${value} min`} />
                    <Bar dataKey="Minutes" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-5 w-5 animate-spin text-[#1A56DB]" />
              )}
            </div>
          </div>

          {/* Time Callouts */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Pacing Analysis
            </h3>
            
            <div className="space-y-4 my-auto">
              {fastestQuestion ? (
                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 h-fit">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Fastest Question</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{fastestQuestion.sectionName} section</p>
                    <p className="text-sm font-black text-slate-800 mt-2">
                      Q{fastestQuestion.qNum}: {formatTime(fastestQuestion.timeSpent)}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                      {fastestQuestion.selectedOption === fastestQuestion.questionId?.correctOption 
                        ? "✓ Answered Correctly" 
                        : "✗ Answered Incorrectly"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center">No pacing data available</p>
              )}

              {slowestQuestion ? (
                <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 flex gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-700 h-fit">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Slowest Question</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{slowestQuestion.sectionName} section</p>
                    <p className="text-sm font-black text-slate-800 mt-2">
                      Q{slowestQuestion.qNum}: {formatTime(slowestQuestion.timeSpent)}
                    </p>
                    <p className="text-[10px] text-amber-700 font-semibold mt-1">
                      {slowestQuestion.selectedOption === slowestQuestion.questionId?.correctOption 
                        ? "✓ Answered Correctly" 
                        : "✗ Answered Incorrectly"}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            
            <p className="text-[10px] text-slate-400 text-center">
              Pacing metrics are calculated on answered questions only.
            </p>
          </div>
        </div>

        {/* Section 3: Question-level Review */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800 font-heading flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#1A56DB]" />
              Question-level Review
            </h3>
            
            {/* Filter controls */}
            <div className="flex flex-wrap gap-2 text-xs">
              {/* Section dropdown filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-400 font-semibold">Section:</span>
                <select
                  value={activeSectionFilter}
                  onChange={(e) => setActiveSectionFilter(e.target.value)}
                  className="bg-transparent border-none text-slate-600 font-bold outline-none cursor-pointer"
                >
                  <option value="all">All Sections</option>
                  {result.sectionResults.map((sec, idx) => (
                    <option key={idx} value={sec.sectionName}>
                      {sec.sectionName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filters */}
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                {(
                  [
                    { value: "all", label: "All" },
                    { value: "correct", label: "Correct" },
                    { value: "wrong", label: "Wrong" },
                    { value: "skipped", label: "Skipped" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setQFilter(f.value)}
                    className={`px-3 py-1.5 font-bold transition-all border-r border-slate-200 last:border-r-0 ${
                      qFilter === f.value
                        ? "bg-[#1A56DB] text-white"
                        : "text-slate-500 hover:bg-slate-100/60"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-6 divide-y divide-slate-100">
            {filteredQuestions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No questions match the active filters.
              </div>
            ) : (
              filteredQuestions.map((res) => {
                const q = res.questionId;
                if (!q) return null;

                const isCorrect = res.status === "correct";
                const isWrong = res.status === "wrong";
                const isSkipped = res.status === "skipped";

                const diffColor =
                  q.difficulty === "easy"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : q.difficulty === "medium"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : "bg-red-50 text-red-700 border-red-100";

                return (
                  <div key={q._id} className={`pt-6 first:pt-0 space-y-4`}>
                    {/* Tags header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-[#1A56DB]/5 text-[#1A56DB] flex items-center justify-center font-black text-xs border border-blue-100/50">
                          {res.qNum}
                        </span>
                        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {res.sectionName}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/50">
                          {q.topic}
                        </span>
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded ${diffColor}`}>
                          {q.difficulty}
                        </span>
                      </div>
                      
                      {/* Pacing check */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                        <Clock className="h-3.5 w-3.5" />
                        Time spent: {formatTime(res.timeSpent)}
                      </div>
                    </div>

                    {/* Question text */}
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed pl-1 whitespace-pre-line">
                      {q.question}
                    </p>

                    {/* Options list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
                      {[
                        { key: "A", text: q.optionA },
                        { key: "B", text: q.optionB },
                        { key: "C", text: q.optionC },
                        { key: "D", text: q.optionD },
                      ].map((opt) => {
                        const isSelected = res.selectedOption === opt.key;
                        const isCorrectOpt = q.correctOption === opt.key;

                        let optStyle = "bg-white border-slate-200/80 text-slate-700";
                        let checkIcon = null;

                        if (isCorrectOpt) {
                          optStyle = "bg-emerald-50/50 border-emerald-300 text-emerald-900 font-semibold";
                          checkIcon = <CheckCircle2 className="h-4 w-4 text-emerald-600 inline mr-2 shrink-0" />;
                        } else if (isSelected && isWrong) {
                          optStyle = "bg-red-50/50 border-red-300 text-red-900 font-semibold";
                          checkIcon = <XCircle className="h-4 w-4 text-red-600 inline mr-2 shrink-0" />;
                        }

                        return (
                          <div
                            key={opt.key}
                            className={`border rounded-xl p-3 flex items-center text-xs transition-colors ${optStyle}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold mr-3 shrink-0 ${
                                isCorrectOpt
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isSelected && isWrong
                                  ? "bg-red-100 text-red-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {opt.key}
                            </span>
                            <div className="flex-1 min-w-0">
                              {opt.text}
                            </div>
                            {checkIcon}
                          </div>
                        );
                      })}
                    </div>

                    {/* Response banner */}
                    <div className="flex items-center justify-between text-xs font-semibold pl-1">
                      <div>
                        {isCorrect && (
                          <span className="text-emerald-600 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            Correct answer selected
                          </span>
                        )}
                        {isWrong && (
                          <span className="text-red-500 flex items-center gap-1.5">
                            <XCircle className="h-4 w-4" />
                            Incorrect answer selected (Attempted option {res.selectedOption})
                          </span>
                        )}
                        {isSkipped && (
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <HelpCircle className="h-4 w-4" />
                            Question skipped
                          </span>
                        )}
                      </div>

                      {/* Explanation toggle */}
                      {q.explanation && (
                        <button
                          onClick={() => toggleExplanation(res.qNum)}
                          className="text-[#1A56DB] hover:text-blue-700 flex items-center gap-1 hover:underline transition-all"
                        >
                          {expandedQuestions[res.qNum] ? (
                            <>
                              Hide Explanation
                              <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Show Explanation
                              <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Explanation collapse box */}
                    {expandedQuestions[res.qNum] && q.explanation && (
                      <div className="bg-blue-50/30 border border-blue-100/50 rounded-xl p-4 text-xs text-slate-600 space-y-2 mt-2 leading-relaxed ml-1 animate-fadeIn">
                        <div className="flex items-center gap-1.5 font-bold text-blue-800 mb-1">
                          <HelpCircle className="h-4 w-4" />
                          Explanation:
                        </div>
                        <p className="whitespace-pre-line">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
