"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Loader2,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Eye,
  HelpCircle,
} from "lucide-react";
import { useAlert } from "@/components/ui/AlertProvider";

interface SectionSummary {
  name: string;
  duration: number;
  questionCount: number;
  markingScheme: {
    correct: number;
    wrong: number;
  };
}

interface ExamItem {
  _id: string;
  title: string;
  category: string; // dynamic — any string
  totalDuration: number;
  sections: SectionSummary[];
  status: "draft" | "published";
  attemptCount: number;
  createdAt: string;
}

export default function AdminExamsDashboard() {
  const { confirm } = useAlert();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Status banners
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/exams");
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      } else {
        setErrorMsg("Failed to load mock tests.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error trying to fetch exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleToggleStatus = async (examId: string, currentStatus: "draft" | "published") => {
    setTogglingId(examId);
    setErrorMsg("");
    setSuccessMsg("");
    const newStatus = currentStatus === "draft" ? "published" : "draft";

    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setExams((prev) =>
          prev.map((exam) => (exam._id === examId ? { ...exam, status: newStatus } : exam))
        );
        setSuccessMsg(`Mock test status updated to ${newStatus}!`);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to update exam status.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error updating status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    const ok = await confirm({
      title: "Delete Exam?",
      message: "Are you absolutely sure? Student attempt records will remain but won't link to this exam properly.",
      confirmLabel: "Yes, Delete",
      cancelLabel: "Cancel",
      type: "danger",
    });
    if (!ok) return;
    setDeletingId(examId);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setExams((prev) => prev.filter((exam) => exam._id !== examId));
        setSuccessMsg("Exam deleted successfully!");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to delete exam.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error deleting exam.");
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryColor = (cat: ExamItem["category"]) => {
    switch (cat) {
      case "SSC":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Railway":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "Banking":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "PSC":
        return "bg-pink-50 text-pink-700 border-pink-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-20">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#1A56DB] text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="text-lg font-extrabold font-heading tracking-tight flex items-center gap-1.5">
              <BookOpen className="h-5 w-5 text-blue-200" />
              Manage Mock Tests
            </span>
          </div>
          <Link
            href="/admin/exams/create"
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-xs font-black transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Exam
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fadeIn">
        {/* Error/Success alerts */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Exams Table Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 font-heading">
                All Mock Exams
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Overview of your active and draft exams, sections count, and total candidate attempts.
              </p>
            </div>
            <button
              onClick={fetchExams}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Refresh List
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-10 w-10 text-[#1A56DB] animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Fetching exam catalog...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-20 max-w-sm mx-auto space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
                <HelpCircle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700">No Exams Found</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  You haven&apos;t built any exams yet. Start by creating a mock exam template.
                </p>
              </div>
              <Link
                href="/admin/exams/create"
                className="inline-flex items-center gap-1 bg-[#1A56DB] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-black transition-colors shadow-sm"
              >
                <Plus className="h-4.5 w-4.5" />
                Build First Exam
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Exam Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Sections</th>
                    <th className="p-4 text-center">Total Questions</th>
                    <th className="p-4 text-center">Duration</th>
                    <th className="p-4 text-center">Total Marks</th>
                    <th className="p-4 text-center">Attempts</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {exams.map((exam) => {
                    const totalQuestionsCount = exam.sections.reduce(
                      (acc, sec) => acc + (sec.questionCount || 0),
                      0
                    );
                    const totalMarks = exam.sections.reduce(
                      (acc, sec) => acc + (sec.questionCount * (sec.markingScheme?.correct || 0)),
                      0
                    );

                    const isPublished = exam.status === "published";

                    return (
                      <tr key={exam._id} className="hover:bg-slate-50/40 transition-colors">
                        {/* Title */}
                        <td className="p-4 pl-6 font-bold text-slate-800 max-w-[240px] truncate">
                          {exam.title}
                        </td>

                        {/* Category */}
                        <td className="p-4">
                          <span
                            className={`border text-[10px] font-black uppercase px-2.5 py-0.5 rounded ${getCategoryColor(
                              exam.category
                            )}`}
                          >
                            {exam.category}
                          </span>
                        </td>

                        {/* Sections count */}
                        <td className="p-4 text-center font-bold text-slate-600">
                          {exam.sections.length}
                        </td>

                        {/* Total Questions */}
                        <td className="p-4 text-center font-bold text-slate-600">
                          {totalQuestionsCount}
                        </td>

                        {/* Duration */}
                        <td className="p-4 text-center font-bold text-slate-600">
                          {exam.totalDuration}m
                        </td>

                        {/* Total Marks */}
                        <td className="p-4 text-center font-black text-slate-800">
                          {totalMarks}
                        </td>

                        {/* Attempts count */}
                        <td className="p-4 text-center font-bold text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                            {exam.attemptCount}
                          </span>
                        </td>

                        {/* Status Toggle */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(exam._id, exam.status)}
                            disabled={togglingId === exam._id}
                            className={`flex items-center justify-center mx-auto hover:scale-105 transition-transform ${
                              togglingId === exam._id ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title={`Click to toggle ${isPublished ? "Draft" : "Publish"}`}
                          >
                            {isPublished ? (
                              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5 text-[10px] font-black">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                Active
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Draft
                              </div>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-4 pr-6 text-right space-x-1.5">
                          {/* Student View Link */}
                          {isPublished && (
                            <Link
                              href={`/exam/${exam._id}`}
                              className="inline-flex p-2 text-[#1A56DB] hover:bg-blue-50 rounded-lg transition-colors"
                              title="Go to Test Screen"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          )}
                          {/* Edit button */}
                          <Link
                            href={`/admin/exams/${exam._id}/edit`}
                            className="inline-flex p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Exam Layout"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteExam(exam._id)}
                            disabled={deletingId === exam._id}
                            className="inline-flex p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Exam"
                          >
                            {deletingId === exam._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
