"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { 
  ArrowLeft,
  Clock, 
  HelpCircle, 
  Award, 
  Layers, 
  Play,
  Info,
  CheckCircle,
  AlertTriangle,
  Loader2
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
  category: string;
  totalDuration: number;
  sections: ExamSection[];
  instructions: string;
  status: string;
  attemptCount: number;
}

export default function ExamDetailsPage({ params }: { params: { id: string } }) {
  const { status } = useSession();
  const { id } = params;

  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchExamDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/exams/${id}`);
      if (res.ok) {
        const data = await res.json();
        setExam(data);
      } else {
        if (res.status === 404) {
          setError("Exam not found");
        } else {
          setError("Failed to retrieve exam details");
        }
      }
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred while fetching details");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#1A56DB]" />
          <p className="text-gray-500 font-medium font-sans">Retrieving exam pattern...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="text-center font-sans">
          <p className="text-red-500 font-semibold mb-4 font-heading">Please log in to view this exam.</p>
          <Link
            href={`/login?callbackUrl=/exam/${id}`}
            className="inline-block rounded-lg bg-[#1A56DB] px-4 py-2 text-white font-semibold hover:bg-blue-700 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="text-center max-w-md p-6 bg-white rounded-2xl border border-slate-100 shadow-sm font-sans">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 font-heading">Error</h2>
          <p className="text-slate-500 text-sm mt-1">{error || "Could not retrieve details."}</p>
          <Link
            href="/exams"
            className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-[#1A56DB] hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const totalQs = exam.sections.reduce((sum, s) => sum + s.questionCount, 0);
  const totalMarks = exam.sections.reduce((sum, s) => sum + (s.questionCount * s.markingScheme.correct), 0);

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

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-16">
      {/* Top Navbar */}
      <Header />

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/exams"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#1A56DB] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </Link>

        {/* Title Block */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <span className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${getCategoryBadgeColor(exam.category)}`}>
              {exam.category === "PSC" ? "State PSC" : exam.category}
            </span>
            <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-xs font-extrabold uppercase">
              100% Free Mock Simulation
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
            {exam.title}
          </h1>

          {/* Stat summary cards */}
          <div className="grid grid-cols-3 gap-4 mt-6 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Questions</p>
                <p className="text-lg font-black text-slate-700">{totalQs} Qs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Marks</p>
                <p className="text-lg font-black text-slate-700">{totalMarks} Marks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Time</p>
                <p className="text-lg font-black text-slate-700">{exam.totalDuration} Mins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left Column: Pattern breakdown table */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm md:col-span-2">
            <h2 className="text-lg font-bold text-slate-800 font-heading mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#1A56DB]" />
              Exam Pattern Breakdown
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-slate-400 font-semibold text-xs uppercase text-left">
                    <th className="py-3 px-4">Section Name</th>
                    <th className="py-3 px-4 text-center">Questions</th>
                    <th className="py-3 px-4 text-center">Section Time</th>
                    <th className="py-3 px-4 text-right">Marking Scheme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {exam.sections.map((section, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{section.name}</td>
                      <td className="py-3.5 px-4 text-center">{section.questionCount}</td>
                      <td className="py-3.5 px-4 text-center">{section.duration} mins</td>
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        +{section.markingScheme.correct} / {section.markingScheme.wrong}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Rules box & CTA */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex-1">
              <h2 className="text-lg font-bold text-slate-800 font-heading mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-[#1A56DB]" />
                Rules & Guidelines
              </h2>
              
              <ul className="space-y-3.5 text-xs text-slate-600 font-medium leading-relaxed">
                <li className="flex gap-2 items-start">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Negative Marking:</strong> Deductions apply on wrong answers as per the table. Unanswered questions score 0.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Section Locking:</strong> Sections are locked individually. You must finish your current section before moving forward. Back navigation is disabled.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Simultaneous Timers:</strong> Both overall exam timer and active section timer run in parallel.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Anti-Cheat Shield:</strong> Switching tabs or refreshing during the live test will record alerts and may trigger auto-submission.</span>
                </li>
              </ul>
            </div>

            {/* Start Mock CTA Button */}
            <Link
              href={`/exam/${exam._id}/instructions`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1A56DB] to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-4 text-base font-bold text-white shadow-md hover:shadow-lg transition-all"
            >
              <Play className="h-5 w-5 fill-white" />
              Start Mock Test
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
