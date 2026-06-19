"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle,
  XCircle,
  MinusCircle,
  BarChart2,
  Clock,
  Home,
  RotateCcw,
  Loader2,
} from "lucide-react";

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

interface AttemptData {
  _id: string;
  examId: string;
  status: string;
  startedAt: string;
  submittedAt: string;
  result: AttemptResult;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function ResultsPage({
  params,
}: {
  params: { attemptId: string };
}) {
  const { status } = useSession();
  const { attemptId } = params;

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [examTitle, setExamTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const loadResults = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      if (res.ok) {
        const data = await res.json();
        setAttempt(data);
        // Fetch exam title
        const examRes = await fetch(`/api/exams/${data.examId}`);
        if (examRes.ok) {
          const exam = await examRes.json();
          setExamTitle(exam.title);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="h-10 w-10 animate-spin text-[#1A56DB]" />
      </div>
    );
  }

  if (!attempt || attempt.status !== "submitted" || !attempt.result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <p className="text-slate-500 font-semibold mb-4">Result not available.</p>
          <Link
            href="/exams"
            className="rounded-lg bg-[#1A56DB] px-4 py-2 text-white font-bold hover:bg-blue-700"
          >
            Browse Exams
          </Link>
        </div>
      </div>
    );
  }

  const { result } = attempt;
  const percentage =
    result.totalMarks > 0
      ? Math.round((result.totalScore / result.totalMarks) * 100)
      : 0;

  const totalCorrect = result.sectionResults.reduce((a, s) => a + s.correct, 0);
  const totalWrong = result.sectionResults.reduce((a, s) => a + s.wrong, 0);
  const totalSkipped = result.sectionResults.reduce((a, s) => a + s.skipped, 0);
  const totalTime = result.sectionResults.reduce((a, s) => a + s.timeSpent, 0);

  const scoreColor =
    percentage >= 70
      ? "text-emerald-600"
      : percentage >= 40
      ? "text-amber-600"
      : "text-red-600";

  const scoreBg =
    percentage >= 70
      ? "from-emerald-50 to-emerald-100 border-emerald-200"
      : percentage >= 40
      ? "from-amber-50 to-amber-100 border-amber-200"
      : "from-red-50 to-red-100 border-red-200";

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-16">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#1A56DB] text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-xl font-extrabold font-heading tracking-tight hover:opacity-90"
          >
            MockTestPro
          </Link>
          <div className="flex gap-3">
            <Link
              href="/exams"
              className="flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 px-4 py-2 text-sm font-semibold transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              More Tests
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-blue-400 px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <Award className="h-8 w-8 text-[#1A56DB]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
            Test Completed!
          </h1>
          <p className="text-slate-500 mt-1 text-sm truncate max-w-lg mx-auto">
            {examTitle}
          </p>
        </div>

        {/* Score Hero */}
        <div
          className={`bg-gradient-to-br ${scoreBg} border rounded-2xl p-8 text-center mb-8 shadow-sm`}
        >
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
            Your Score
          </p>
          <p className={`text-6xl font-black ${scoreColor}`}>{percentage}%</p>
          <p className="text-slate-600 font-semibold mt-2">
            {result.totalScore} / {result.totalMarks} marks
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {percentage >= 70
              ? "🎉 Excellent performance! Keep it up."
              : percentage >= 40
              ? "📈 Good attempt! Practice more to improve."
              : "💪 Keep practicing! You can do better."}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          {[
            {
              icon: <CheckCircle className="h-5 w-5" />,
              label: "Correct",
              value: totalCorrect,
              color: "text-emerald-600 bg-emerald-50",
            },
            {
              icon: <XCircle className="h-5 w-5" />,
              label: "Wrong",
              value: totalWrong,
              color: "text-red-600 bg-red-50",
            },
            {
              icon: <MinusCircle className="h-5 w-5" />,
              label: "Skipped",
              value: totalSkipped,
              color: "text-slate-500 bg-slate-100",
            },
            {
              icon: <Clock className="h-5 w-5" />,
              label: "Time Spent",
              value: formatTime(totalTime),
              color: "text-blue-600 bg-blue-50",
            },
          ].map(({ icon, label, value, color }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm"
            >
              <div className={`rounded-lg p-2 ${color}`}>{icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-lg font-black text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section-wise Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 font-heading mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-[#1A56DB]" />
            Section-Wise Analysis
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase font-bold text-slate-400 text-left border-b border-slate-100">
                  <th className="pb-3 pr-4">Section</th>
                  <th className="pb-3 pr-4 text-center">Score</th>
                  <th className="pb-3 pr-4 text-center">Correct</th>
                  <th className="pb-3 pr-4 text-center">Wrong</th>
                  <th className="pb-3 pr-4 text-center">Skipped</th>
                  <th className="pb-3 pr-4 text-center">Accuracy</th>
                  <th className="pb-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {result.sectionResults.map((sec, i) => (
                  <tr key={i} className="text-slate-700">
                    <td className="py-3 pr-4 font-bold text-slate-800">
                      {sec.sectionName}
                    </td>
                    <td className="py-3 pr-4 text-center font-bold text-[#1A56DB]">
                      {sec.score}
                    </td>
                    <td className="py-3 pr-4 text-center text-emerald-600 font-semibold">
                      {sec.correct}
                    </td>
                    <td className="py-3 pr-4 text-center text-red-500 font-semibold">
                      {sec.wrong}
                    </td>
                    <td className="py-3 pr-4 text-center text-slate-400 font-semibold">
                      {sec.skipped}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span
                        className={`font-bold ${
                          sec.accuracy >= 70
                            ? "text-emerald-600"
                            : sec.accuracy >= 40
                            ? "text-amber-600"
                            : "text-red-500"
                        }`}
                      >
                        {sec.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400 font-medium text-xs">
                      {formatTime(sec.timeSpent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
