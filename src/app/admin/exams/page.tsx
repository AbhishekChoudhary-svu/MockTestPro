"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Loader2,
  Trash2,
  Edit2,
  Plus,
  Eye,
  HelpCircle,
  X,
  Clock,
  Target,
  Users,
  CheckCircle,
  XCircle,
  Hash,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { useAlert } from "@/components/ui/AlertProvider";
import { SkeletonExamRow } from "@/components/ui/Skeleton";

/* ─── Types ────────────────────────────────────────────────────── */
interface SectionSummary {
  name: string;
  duration: number;
  questionCount: number;
  markingScheme: { correct: number; wrong: number };
}

interface ExamItem {
  _id: string;
  title: string;
  category: string;
  totalDuration: number;
  sections: SectionSummary[];
  status: "draft" | "upcoming" | "live";
  attemptCount: number;
  createdAt: string;
}

interface QuestionDetail {
  _id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  difficulty: string;
  topic?: string;
}

interface SectionDetail {
  name: string;
  duration: number;
  questionCount: number;
  markingScheme: { correct: number; wrong: number };
  questions: QuestionDetail[];
}

interface ExamDetail {
  _id: string;
  title: string;
  category: string;
  totalDuration: number;
  status: "draft" | "upcoming" | "live";
  attemptCount: number;
  instructions?: string;
  createdAt: string;
  sections: SectionDetail[];
}

/* ─── Preview Dialog ────────────────────────────────────────────── */
function PreviewDialog({
  examId,
  onClose,
}: {
  examId: string;
  onClose: () => void;
}) {
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/admin/exams/${examId}`);
        if (!res.ok) throw new Error("Failed to fetch exam details");
        const data = await res.json();
        setExam(data);
        // open first section by default
        setOpenSections({ 0: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [examId]);

  const toggleSection = (idx: number) =>
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const statusColor =
    exam?.status === "live"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : exam?.status === "upcoming"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-slate-100 text-slate-600 border-slate-200";

  const optionLetters = ["A", "B", "C", "D"];
  const optionKeys: (keyof QuestionDetail)[] = [
    "optionA",
    "optionB",
    "optionC",
    "optionD",
  ];

  const totalQ = exam?.sections.reduce((a, s) => a + s.questions.length, 0) ?? 0;
  const totalMarks =
    exam?.sections.reduce(
      (a, s) => a + s.questions.length * (s.markingScheme?.correct ?? 0),
      0
    ) ?? 0;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Dialog */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="h-6 w-64 bg-slate-200 rounded-lg animate-pulse" />
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusColor}`}
                  >
                    {exam?.status}
                  </span>
                  <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {exam?.category}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 font-heading truncate">
                  {exam?.title}
                </h2>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm font-semibold text-slate-700">{error}</p>
            </div>
          ) : exam ? (
            <>
              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    icon: <Clock className="h-4 w-4 text-blue-500" />,
                    label: "Duration",
                    value: `${exam.totalDuration} min`,
                  },
                  {
                    icon: <Hash className="h-4 w-4 text-violet-500" />,
                    label: "Questions",
                    value: totalQ,
                  },
                  {
                    icon: <Target className="h-4 w-4 text-emerald-500" />,
                    label: "Max Marks",
                    value: totalMarks,
                  },
                  {
                    icon: <Users className="h-4 w-4 text-amber-500" />,
                    label: "Attempts",
                    value: exam.attemptCount,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3"
                  >
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                        {stat.label}
                      </div>
                      <div className="text-sm font-black text-slate-800">
                        {stat.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              {exam.instructions && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">
                    Instructions
                  </p>
                  <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">
                    {exam.instructions}
                  </p>
                </div>
              )}

              {/* Sections + Questions */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Sections &amp; Questions
                </h3>
                {exam.sections.map((section, sIdx) => (
                  <div
                    key={sIdx}
                    className="border border-slate-200 rounded-2xl overflow-hidden"
                  >
                    {/* Section header — click to expand */}
                    <button
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition text-left"
                      onClick={() => toggleSection(sIdx)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#1A56DB] text-white text-[10px] font-black flex items-center justify-center">
                          {sIdx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {section.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {section.questions.length} questions &middot;{" "}
                            {section.duration} min &middot; +
                            {section.markingScheme.correct}/
                            {section.markingScheme.wrong} marking
                          </p>
                        </div>
                      </div>
                      {openSections[sIdx] ? (
                        <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {/* Questions list */}
                    {openSections[sIdx] && (
                      <div className="divide-y divide-slate-100">
                        {section.questions.length === 0 ? (
                          <p className="p-4 text-xs text-slate-400 italic">
                            No questions assigned to this section yet.
                          </p>
                        ) : (
                          section.questions.map((q, qIdx) => (
                            <div key={q._id} className="p-4 space-y-3">
                              {/* Q number + difficulty */}
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold text-slate-800 leading-relaxed flex-1">
                                  <span className="inline-block mr-2 text-[#1A56DB] font-black">
                                    Q{qIdx + 1}.
                                  </span>
                                  {q.question}
                                </p>
                                <span
                                  className={`shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                    q.difficulty === "easy"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : q.difficulty === "hard"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {q.difficulty}
                                </span>
                              </div>

                              {/* Options */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5">
                                {optionKeys.map((key, oIdx) => {
                                  const letter = optionLetters[oIdx];
                                  const isCorrect =
                                    q.correctOption === `option${letter}`;
                                  return (
                                    <div
                                      key={key}
                                      className={`flex items-start gap-2 text-[11px] rounded-xl px-3 py-2 border ${
                                        isCorrect
                                          ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                                          : "bg-white border-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {isCorrect ? (
                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      ) : (
                                        <XCircle className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-0.5" />
                                      )}
                                      <span>
                                        <strong>{letter}.</strong>{" "}
                                        {String(q[key] ?? "")}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50/60">
          <p className="text-[10px] text-slate-400">
            Admin Preview — changes are made via the Edit button.
          </p>
          <div className="flex gap-2">
            {exam && (
              <Link
                href={`/admin/exams/${exam._id}/edit`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A56DB] text-white text-xs font-bold hover:bg-blue-700 transition"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Exam
              </Link>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────── */
export default function AdminExamsDashboard() {
  const { confirm, toast } = useAlert();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [previewExamId, setPreviewExamId] = useState<string | null>(null);

  const [activeStatusTab, setActiveStatusTab] = useState<
    "all" | "draft" | "upcoming" | "live"
  >("all");

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/exams");
      if (res.ok) {
        const data = await res.json();
        const mappedData = data.map(
          (
            exam: Omit<ExamItem, "status"> & { status: string }
          ): ExamItem => ({
            ...exam,
            status: (exam.status === "published"
              ? "live"
              : exam.status) as "draft" | "upcoming" | "live",
          })
        );
        setExams(mappedData);
      } else {
        toast("error", "Failed to retrieve mock exams list.");
      }
    } catch (err) {
      console.error("Error loading exams:", err);
      toast("error", "Connection error when fetching exams.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleStatusChange = async (
    examId: string,
    newStatus: "draft" | "upcoming" | "live"
  ) => {
    try {
      setUpdatingStatusId(examId);
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setExams((prev) =>
          prev.map((exam) =>
            exam._id === examId ? { ...exam, status: newStatus } : exam
          )
        );
        toast("success", `Exam status updated to ${newStatus.toUpperCase()}`);
      } else {
        toast("error", data.error || "Failed to update exam status.");
      }
    } catch (err) {
      console.error("Error changing status:", err);
      toast("error", "Error connection during status update.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteExam = async (examId: string, title: string) => {
    const ok = await confirm({
      title: "Delete Exam permanently?",
      message: `Delete the mock test template "${title}"? This cannot be undone, though past student results will be preserved.`,
      confirmLabel: "Delete Template",
      cancelLabel: "Cancel",
      type: "danger",
    });
    if (!ok) return;
    try {
      setDeletingId(examId);
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setExams((prev) => prev.filter((exam) => exam._id !== examId));
        toast("success", `Mock test "${title}" deleted.`);
      } else {
        const data = await res.json();
        toast("error", data.error || "Failed to delete exam.");
      }
    } catch (err) {
      console.error("Error deleting exam:", err);
      toast("error", "Network connection failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredExams =
    activeStatusTab === "all"
      ? exams
      : exams.filter((e) => e.status === activeStatusTab);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "SSC":
        return "bg-blue-50 text-blue-700 border border-blue-200/50";
      case "Railway":
        return "bg-amber-50 text-amber-700 border border-amber-200/50";
      case "Banking":
        return "bg-purple-50 text-purple-700 border border-purple-200/50";
      case "PSC":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/50";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200/50";
    }
  };

  return (
    <>
      {/* Preview Dialog */}
      {previewExamId && (
        <PreviewDialog
          examId={previewExamId}
          onClose={() => setPreviewExamId(null)}
        />
      )}

      <div className="space-y-6 animate-fadeIn">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-[#1A56DB]" /> Mock Tests Layouts
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Build and edit custom practice tests, section timers, rules, and
              question configurations.
            </p>
          </div>
          <Link
            href="/admin/exams/create"
            className="flex items-center gap-1.5 bg-[#1A56DB] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-sm shadow-blue-500/10 shrink-0"
          >
            <Plus className="h-4 w-4" /> Create Mock Test
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {[
              { id: "all", label: "All Tests", count: exams.length },
              {
                id: "draft",
                label: "Drafts",
                count: exams.filter((e) => e.status === "draft").length,
              },
              {
                id: "upcoming",
                label: "Upcoming",
                count: exams.filter((e) => e.status === "upcoming").length,
              },
              {
                id: "live",
                label: "Live",
                count: exams.filter((e) => e.status === "live").length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveStatusTab(
                    tab.id as "all" | "draft" | "upcoming" | "live"
                  )
                }
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  activeStatusTab === tab.id
                    ? "bg-[#1A56DB] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <button
            onClick={fetchExams}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-white shadow-sm"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Refresh List
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {[
                      "Exam Title",
                      "Category",
                      "Sections",
                      "Questions",
                      "Duration",
                      "Max Marks",
                      "Attempts",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonExamRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="p-16 text-center">
              <HelpCircle className="h-8 w-8 text-slate-400 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-800">
                No Exams Found
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select a different status filter or create a new mock test.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 pl-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Exam Title
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Category
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Sections
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Questions
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Duration
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Max Marks
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Attempts
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Availability Status
                    </th>
                    <th className="p-4 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExams.map((exam) => {
                    const totalQuestionsCount = exam.sections.reduce(
                      (acc, sec) => acc + (sec.questionCount || 0),
                      0
                    );
                    const totalMarks = exam.sections.reduce(
                      (acc, sec) =>
                        acc +
                        sec.questionCount * (sec.markingScheme?.correct || 0),
                      0
                    );
                    const isUpdating = updatingStatusId === exam._id;

                    return (
                      <tr
                        key={exam._id}
                        className="hover:bg-slate-50/30 transition-colors"
                      >
                        {/* Title */}
                        <td className="p-4 pl-6 font-bold text-slate-800 max-w-[200px] truncate">
                          {exam.title}
                        </td>

                        {/* Category */}
                        <td className="p-4">
                          <span
                            className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded ${getCategoryColor(exam.category)}`}
                          >
                            {exam.category}
                          </span>
                        </td>

                        <td className="p-4 text-center font-bold text-slate-500">
                          {exam.sections.length}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-500">
                          {totalQuestionsCount}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-500">
                          {exam.totalDuration}m
                        </td>
                        <td className="p-4 text-center font-black text-slate-800">
                          {totalMarks}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-500">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                            {exam.attemptCount}
                          </span>
                        </td>

                        {/* Status Dropdown */}
                        <td className="p-4">
                          <select
                            disabled={isUpdating}
                            value={exam.status}
                            onChange={(e) =>
                              handleStatusChange(
                                exam._id,
                                e.target.value as "draft" | "upcoming" | "live"
                              )
                            }
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border bg-white focus:outline-none transition ${
                              exam.status === "live"
                                ? "text-emerald-700 border-emerald-200 bg-emerald-50 focus:border-emerald-500"
                                : exam.status === "upcoming"
                                ? "text-amber-700 border-amber-200 bg-amber-50 focus:border-amber-500"
                                : "text-slate-500 border-slate-200 bg-slate-50 focus:border-slate-500"
                            }`}
                          >
                            <option value="draft">Draft</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="live">Live</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end gap-1.5">
                            {/* 👁 Preview Dialog — works for ALL statuses */}
                            <button
                              onClick={() => setPreviewExamId(exam._id)}
                              className="p-1.5 text-slate-400 hover:text-[#1A56DB] hover:bg-blue-50 rounded-lg transition"
                              title="Preview Exam Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Edit button */}
                            <Link
                              href={`/admin/exams/${exam._id}/edit`}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                              title="Edit Exam Configuration"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>

                            {/* Delete button */}
                            <button
                              onClick={() =>
                                handleDeleteExam(exam._id, exam.title)
                              }
                              disabled={deletingId === exam._id}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Exam template"
                            >
                              {deletingId === exam._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
