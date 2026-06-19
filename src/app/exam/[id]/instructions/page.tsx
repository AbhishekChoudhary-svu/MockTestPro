"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/Header";
import {
  Clock,
  HelpCircle,
  Award,
  Layers,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Play,
  Loader2,
} from "lucide-react";

interface ExamSection {
  name: string;
  duration: number;
  questionCount: number;
  markingScheme: { correct: number; wrong: number };
}

interface ExamData {
  _id: string;
  title: string;
  category: string;
  totalDuration: number;
  sections: ExamSection[];
  instructions: string;
  attemptCount: number;
}

export default function InstructionsPage({
  params,
}: {
  params: { id: string };
}) {
  const { status } = useSession();
  const router = useRouter();
  const { id } = params;

  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") fetchExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchExam = async () => {
    try {
      const res = await fetch(`/api/exams/${id}`);
      if (res.ok) setExam(await res.json());
      else setError("Failed to load exam details.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!agreed || !exam) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: exam._id }),
      });
      const data = await res.json();
      if (res.ok && data.attemptId) {
        router.push(`/exam/${id}/test/${data.attemptId}`);
      } else {
        setError(data.error || "Failed to start the test.");
        setStarting(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setStarting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#1A56DB]" />
          <p className="text-slate-500 font-medium">Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-4">
            Please log in to continue.
          </p>
          <Link
            href={`/login?callbackUrl=/exam/${id}/instructions`}
            className="rounded-lg bg-[#1A56DB] px-5 py-2 text-white font-bold hover:bg-blue-700 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const totalQuestions =
    exam?.sections.reduce((s, sec) => s + sec.questionCount, 0) ?? 0;
  const totalMarks =
    exam?.sections.reduce(
      (s, sec) => s + sec.questionCount * sec.markingScheme.correct,
      0
    ) ?? 0;

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      {/* Navbar */}
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 pb-20">
        {/* Back Link */}
        <Link
          href={`/exam/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#1A56DB] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Details
        </Link>
        {/* Title */}
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold uppercase text-[#1A56DB] tracking-wider mb-3">
            Pre-Test Briefing
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
            {exam?.title ?? "Mock Test"}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Read the instructions carefully before starting the test.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          {[
            {
              icon: <Layers className="h-5 w-5" />,
              label: "Sections",
              value: exam?.sections.length ?? 0,
              color: "text-blue-600 bg-blue-50",
            },
            {
              icon: <HelpCircle className="h-5 w-5" />,
              label: "Questions",
              value: totalQuestions,
              color: "text-purple-600 bg-purple-50",
            },
            {
              icon: <Award className="h-5 w-5" />,
              label: "Total Marks",
              value: totalMarks,
              color: "text-emerald-600 bg-emerald-50",
            },
            {
              icon: <Clock className="h-5 w-5" />,
              label: "Duration",
              value: `${exam?.totalDuration ?? 0} min`,
              color: "text-amber-600 bg-amber-50",
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

        {/* Section Pattern */}
        {exam && (
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mb-6">
            <h2 className="text-base font-bold text-slate-800 font-heading mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#1A56DB]" /> Section Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase font-bold text-slate-400 text-left border-b border-slate-100">
                    <th className="pb-3 pr-4">Section</th>
                    <th className="pb-3 pr-4 text-center">Questions</th>
                    <th className="pb-3 pr-4 text-center">Time</th>
                    <th className="pb-3 text-right">Correct / Wrong</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {exam.sections.map((s, i) => (
                    <tr key={i} className="text-slate-700 font-medium">
                      <td className="py-3 pr-4 font-bold text-slate-800">
                        {s.name}
                      </td>
                      <td className="py-3 pr-4 text-center">{s.questionCount}</td>
                      <td className="py-3 pr-4 text-center">{s.duration} min</td>
                      <td className="py-3 text-right">
                        <span className="text-emerald-600 font-bold">
                          +{s.markingScheme.correct}
                        </span>
                        {" / "}
                        <span className="text-red-500 font-bold">
                          {s.markingScheme.wrong}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rules */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mb-6">
          <h2 className="text-base font-bold text-slate-800 font-heading mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#1A56DB]" /> Important Rules
          </h2>
          <ul className="space-y-3.5">
            {[
              "This is a timed test. The overall timer and each section timer run simultaneously. When a section timer expires, you are automatically moved to the next section.",
              "Section Locking: Once you move to the next section, you CANNOT go back to a previous one.",
              "Negative Marking applies. Skipped questions score 0. Only correct answers add marks.",
              "Anti-Cheat: Switching tabs or minimizing the window will trigger a warning. After 3 violations, the test is auto-submitted.",
              "Do NOT refresh the page during the exam. Your responses are auto-saved on every navigation action.",
            ].map((rule, i) => (
              <li key={i} className="flex gap-3 items-start text-sm text-slate-600">
                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Agreement + CTA */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              id="agree-checkbox"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-[#1A56DB] accent-[#1A56DB] cursor-pointer"
            />
            <span className="text-sm font-semibold text-slate-700">
              I have read and agree to all the rules above.
            </span>
          </label>

          <button
            id="start-test-btn"
            onClick={handleStartTest}
            disabled={!agreed || starting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1A56DB] to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-3.5 text-base font-bold text-white shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {starting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Starting...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-white" /> Start Test
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
