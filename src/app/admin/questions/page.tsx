"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Database,
  Plus,
  Sparkles,
  Search,
  Trash2,
  Loader2,
  CheckCircle,
  HelpCircle,
  Eye,
  Edit2,
  X,
  Save,
} from "lucide-react";
import { useAlert } from "@/components/ui/AlertProvider";
import { SkeletonQuestionRow } from "@/components/ui/Skeleton";

interface QuestionItem {
  _id: string;
  question: string;          // matches Mongoose schema
  passage?: string;          // shared passage/context text
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation?: string;
  subject: string;
  topic?: string;
  difficulty: "easy" | "medium" | "hard";
}

interface ParsedQuestion {
  question: string;
  passage?: string;          // shared passage/context text
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

function QuestionsManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { confirm, toast } = useAlert();

  // Tabs state
  const initialTab = searchParams.get("tab") || "list";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync with URL query parameter
  useEffect(() => {
    const tab = searchParams.get("tab") || "list";
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`/admin/questions?${params.toString()}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-[#1A56DB]" /> Question Bank
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Maintain database categories, parse questions using AI, or perform manual question entries.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 w-fit shrink-0">
          <button
            onClick={() => handleTabChange("list")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "list"
                ? "bg-[#1A56DB] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Database className="h-3.5 w-3.5" /> All Questions
          </button>
          <button
            onClick={() => handleTabChange("add")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "add"
                ? "bg-[#1A56DB] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Plus className="h-3.5 w-3.5" /> Add Question
          </button>
          <button
            onClick={() => handleTabChange("import")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "import"
                ? "bg-[#1A56DB] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> AI Import
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "list" && <QuestionsListPanel confirm={confirm} toast={toast} />}
      {activeTab === "add" && (
        <AddQuestionPanel toast={toast} onSaveSuccess={() => handleTabChange("list")} />
      )}
      {activeTab === "import" && (
        <ImportQuestionPanel toast={toast} onSaveSuccess={() => handleTabChange("list")} />
      )}
    </div>
  );
}

/* ============================================================================
   SUB-PANEL 1: QUESTIONS LISTING
   ============================================================================ */
function QuestionsListPanel({
  confirm,
  toast,
}: {
  confirm: (opts: {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    type: "danger" | "warning" | "info";
  }) => Promise<boolean>;
  toast: (type: "success" | "error" | "info" | "warning", message: string, title?: string) => void;
}) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter dropdown lists
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  // Selected filters
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Selections
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  // PreviewModal
  const [previewQuestion, setPreviewQuestion] = useState<QuestionItem | null>(null);

  // EditModal
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [editDraft, setEditDraft] = useState<QuestionItem | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (q: QuestionItem) => {
    setEditingQuestion(q);
    setEditDraft({ ...q });
  };

  const handleEditField = <K extends keyof QuestionItem>(field: K, value: QuestionItem[K]) => {
    setEditDraft((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSaveEdit = async () => {
    if (!editDraft) return;
    try {
      setEditSaving(true);
      const res = await fetch(`/api/admin/questions?id=${editDraft._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions((prev) =>
          prev.map((q) => (q._id === editDraft._id ? { ...q, ...editDraft } : q))
        );
        toast("success", "Question updated successfully.");
        setEditingQuestion(null);
        setEditDraft(null);
      } else {
        toast("error", data.error || "Failed to update question.");
      }
    } catch {
      toast("error", "Network error while saving.");
    } finally {
      setEditSaving(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, selectedTopic, selectedDifficulty, searchQuery]);

  async function fetchMetadata() {
    try {
      const res = await fetch("/api/admin/questions?mode=meta");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.distinctSubjects || []);
        setTopics(data.distinctTopics || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchQuestions() {
    try {
      setLoading(true);
      let query = `/api/admin/questions?subject=${selectedSubject}&topic=${selectedTopic}&difficulty=${selectedDifficulty}`;
      if (searchQuery.trim()) {
        query += `&q=${encodeURIComponent(searchQuery)}`;
      }
      const res = await fetch(query);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSingle(id: string) {
    const ok = await confirm({
      title: "Delete Question?",
      message: "Are you sure you want to delete this question from the bank?",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      type: "danger",
    });
    if (!ok) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q._id !== id));
        setSelectedIds((prev) => prev.filter((val) => val !== id));
        toast("success", "Question deleted successfully.");
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error deleting question");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteBulk() {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      title: "Delete Multiple Questions?",
      message: `Are you sure you want to delete all ${selectedIds.length} selected questions? This cannot be undone.`,
      confirmLabel: "Delete Selected",
      cancelLabel: "Cancel",
      type: "danger",
    });
    if (!ok) return;

    try {
      setDeleting(true);
      const res = await fetch("/api/admin/questions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => !selectedIds.includes(q._id)));
        setSelectedIds([]);
        toast("success", `${selectedIds.length} questions deleted successfully.`);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Bulk delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(questions.map((q) => q._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtering Row */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Search Text
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Subject Filter */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="block w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
          >
            <option value="All">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Topic Filter */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Topic
          </label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="block w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
          >
            <option value="All">All Topics</option>
            {topics.map((top) => (
              <option key={top} value={top}>
                {top}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Difficulty
          </label>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="block w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
          >
            <option value="All">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Bulk actions and Question count */}
      <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs">
        <div className="font-semibold text-slate-600">
          Showing {questions.length} questions
        </div>
        {selectedIds.length > 0 && (
          <button
            disabled={deleting}
            onClick={handleDeleteBulk}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
          >
            {deleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Questions Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["#", "Question Text", "Subject & Topic", "Difficulty", "Ans", "Actions"].map((h) => (
                    <th key={h} className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonQuestionRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-16 text-center">
            <HelpCircle className="h-8 w-8 text-slate-400 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-800">No Questions Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add some manually or import them using AI.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={
                        questions.length > 0 && selectedIds.length === questions.length
                      }
                      onChange={handleSelectAll}
                      className="rounded text-[#1A56DB] focus:ring-[#1A56DB]"
                    />
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/2">
                    Question Text
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Subject & Topic
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Difficulty
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Correct Ans
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(q._id)}
                        onChange={(e) => handleSelectOne(q._id, e.target.checked)}
                        className="rounded text-[#1A56DB] focus:ring-[#1A56DB]"
                      />
                    </td>
                    <td className="p-4 min-w-[200px] max-w-xs lg:max-w-md">
                      <p className="text-xs font-bold text-slate-800 line-clamp-2" title={q.question}>
                        {q.question}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="inline-block bg-blue-50 text-[#1A56DB] border border-blue-100 px-2 py-0.5 rounded text-[10px] font-extrabold">
                          {q.subject}
                        </span>
                        {q.topic && (
                          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                            {q.topic}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block border rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          q.difficulty === "easy"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : q.difficulty === "medium"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="p-4 text-center font-black text-xs text-[#1A56DB]">
                      {q.correctOption}
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setPreviewQuestion(q)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            title="Preview Question options"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEdit(q)}
                            className="p-1.5 text-slate-400 hover:text-[#1A56DB] hover:bg-blue-50 rounded-lg transition"
                            title="Edit Question"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            disabled={deleting}
                            onClick={() => handleDeleteSingle(q._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setPreviewQuestion(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-100 max-w-xl w-full p-6 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                Question Preview
              </h3>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {previewQuestion.passage && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                  <p className="font-extrabold uppercase text-[9px] text-[#1A56DB] mb-1.5">
                    Passage / Context
                  </p>
                  {previewQuestion.passage}
                </div>
              )}

              <p className="text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                {previewQuestion.question}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {(["A", "B", "C", "D"] as const).map((key) => {
                  const isCorrect = previewQuestion.correctOption === key;
                  return (
                    <div
                      key={key}
                      className={`flex gap-3 items-start p-3 rounded-xl border text-xs font-semibold leading-normal ${
                        isCorrect
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-100 text-slate-600"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                          isCorrect
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {key}
                      </span>
                      <span>{
                        key === "A" ? previewQuestion.optionA
                        : key === "B" ? previewQuestion.optionB
                        : key === "C" ? previewQuestion.optionC
                        : previewQuestion.optionD
                      }</span>
                    </div>
                  );
                })}
              </div>

              {previewQuestion.explanation && (
                <div className="bg-blue-50 border border-blue-100/50 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
                  <p className="font-extrabold uppercase text-[10px] text-blue-500 mb-1">
                    Answer Explanation
                  </p>
                  <p>{previewQuestion.explanation}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Question Modal ── */}
      {editingQuestion && editDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => { setEditingQuestion(null); setEditDraft(null); }}
        >
          <div
            className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-800">Edit Question</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Changes are saved directly to the database.</p>
              </div>
              <button
                onClick={() => { setEditingQuestion(null); setEditDraft(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Question text */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Question Text</label>
                <textarea
                  rows={3}
                  value={editDraft.question}
                  onChange={(e) => handleEditField("question", e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Options grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["optionA", "optionB", "optionC", "optionD"] as const).map((key, i) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Option {["A","B","C","D"][i]}
                    </label>
                    <input
                      type="text"
                      value={editDraft[key]}
                      onChange={(e) => handleEditField(key, e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>

              {/* Correct option + difficulty */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Correct Answer</label>
                  <select
                    value={editDraft.correctOption}
                    onChange={(e) => handleEditField("correctOption", e.target.value as "A"|"B"|"C"|"D")}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-bold"
                  >
                    {(["A","B","C","D"] as const).map((l) => (
                      <option key={l} value={l}>Option {l}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Difficulty</label>
                  <select
                    value={editDraft.difficulty}
                    onChange={(e) => handleEditField("difficulty", e.target.value as "easy"|"medium"|"hard")}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Topic</label>
                  <input
                    type="text"
                    value={editDraft.topic || ""}
                    onChange={(e) => handleEditField("topic", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</label>
                <input
                  type="text"
                  value={editDraft.subject}
                  onChange={(e) => handleEditField("subject", e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Explanation */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Explanation (optional)</label>
                <textarea
                  rows={2}
                  value={editDraft.explanation || ""}
                  onChange={(e) => handleEditField("explanation", e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex justify-between items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <button
                onClick={() => { setEditingQuestion(null); setEditDraft(null); }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                disabled={editSaving}
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1A56DB] text-white text-xs font-bold hover:bg-blue-700 transition disabled:opacity-60"
              >
                {editSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   SUB-PANEL 2: MANUAL QUESTION ADD FORM
   ============================================================================ */
function AddQuestionPanel({
  toast,
  onSaveSuccess,
}: {
  toast: (type: "success" | "error" | "info" | "warning", message: string, title?: string) => void;
  onSaveSuccess: () => void;
}) {
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState<"A" | "B" | "C" | "D">("A");
  const [explanation, setExplanation] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const [dbSubjects, setDbSubjects] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const resolvedSubject = customSubject.trim() || subject;

  useEffect(() => {
    fetch("/api/admin/subject-categories")
      .then((r) => r.json())
      .then((data) => {
        const names = Array.from(new Set(data.map((s: { name: string }) => s.name))).sort() as string[];
        setDbSubjects(names);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      toast("error", "Question text is required.");
      return;
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      toast("error", "All four options (A, B, C, D) are required.");
      return;
    }
    if (!resolvedSubject.trim()) {
      toast("error", "Subject is required.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: [
            {
              question: questionText.trim(),
              optionA: optionA.trim(),
              optionB: optionB.trim(),
              optionC: optionC.trim(),
              optionD: optionD.trim(),
              correctOption,
              explanation: explanation.trim(),
              topic: topic.trim() || "General",
              difficulty,
            },
          ],
          category: "",
          subject: resolvedSubject,
        }),
      });

      if (res.ok) {
        toast("success", "Question added successfully to the database.");
        onSaveSuccess();
      } else {
        const data = await res.json();
        toast("error", data.error || "Failed to save question.");
      }
    } catch (err) {
      console.error("Error adding question manually:", err);
      toast("error", "Network connection failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm max-w-3xl mx-auto">
      <h2 className="text-base font-bold text-slate-800 font-heading mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
        <Plus className="h-5 w-5 text-blue-600" /> Manual Question Entry
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Text */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700">Question Text</label>
          <textarea
            required
            rows={4}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question content here..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["A", "B", "C", "D"] as const).map((key) => {
            const state =
              key === "A"
                ? optionA
                : key === "B"
                ? optionB
                : key === "C"
                ? optionC
                : optionD;
            const setter =
              key === "A"
                ? setOptionA
                : key === "B"
                ? setOptionB
                : key === "C"
                ? setOptionC
                : setOptionD;

            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Option {key}</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={`Option ${key} text...`}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            );
          })}
        </div>

        {/* Option Selection & Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Correct Answer Key</label>
            <select
              value={correctOption}
              onChange={(e) => setCorrectOption(e.target.value as "A" | "B" | "C" | "D")}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="A">Option A</option>
              <option value="B">Option B</option>
              <option value="C">Option C</option>
              <option value="D">Option D</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Difficulty Grade</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Metadata subjects */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Select Existing Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">— Select Subject —</option>
              {dbSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Or Type Custom Subject</label>
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="e.g. Zoology"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Topic Tag (Optional)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Cellular Division"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Explanation text */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700">Answer Explanation (Optional)</label>
          <textarea
            rows={3}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Type explanation, reasoning, or references..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 px-6 py-2.5 text-xs font-extrabold text-white shadow transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Save Question
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ============================================================================
   SUB-PANEL 3: AI BULK IMPORT WIZARD (PDF)
   ============================================================================ */
function ImportQuestionPanel({
  toast,
  onSaveSuccess,
}: {
  toast: (type: "success" | "error" | "info" | "warning", message: string, title?: string) => void;
  onSaveSuccess: () => void;
}) {
  const [pastedText, setPastedText] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const resolvedSubject = customSubject.trim() || subject;

  const [dbSubjects, setDbSubjects] = useState<string[]>([]);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Custom Groq Key override interface
  const [groqApiKey, setGroqApiKey] = useState("");

  useEffect(() => {
    fetch("/api/admin/subject-categories")
      .then((r) => r.json())
      .then((data) => {
        const names = Array.from(new Set(data.map((s: { name: string }) => s.name))).sort() as string[];
        setDbSubjects(names);
      })
      .catch(console.error);

    // Hydrate Groq key
    const saved = localStorage.getItem("mock_test_groq_key");
    if (saved) setGroqApiKey(saved);
  }, []);

  // handleGroqKeyChange is inlined into the input's onChange below

  const handleParse = async () => {
    if (!pastedText.trim()) {
      toast("error", "Please paste question text contents first.");
      return;
    }
    if (!resolvedSubject.trim()) {
      toast("error", "Subject is required.");
      return;
    }

    try {
      setParsing(true);
      const res = await fetch("/api/admin/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pastedText,
          subject: resolvedSubject,
          groqApiKey: groqApiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setParsedQuestions(data.questions || []);
        if (data.questions?.length === 0) {
          toast("warning", "No structured questions could be extracted from the content.");
        } else {
          toast("success", `AI successfully parsed ${data.questions.length} questions! Review below.`);
        }
      } else {
        toast("error", data.error || "AI parsing service failed.");
      }
    } catch {
      toast("error", "Network connection to parsing route failed.");
    } finally {
      setParsing(false);
    }
  };

  const handleSaveAll = async () => {
    if (parsedQuestions.length === 0) return;
    try {
      setSaving(true);

      // Merge passage + question into a single question string before saving.
      // If a passage is set, prepend it to the question text so the DB stores
      // everything in one field and the student quiz page can render it cleanly.
      const questionsToSave = parsedQuestions.map((q) => ({
        ...q,
        question: q.passage?.trim()
          ? `${q.passage.trim()}\n\n${q.question.trim()}`
          : q.question.trim(),
        passage: "", // clear the separate passage field — it's now in question
      }));

      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: questionsToSave, subject: resolvedSubject }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("success", data.message || "All parsed questions saved to database successfully!");
        setParsedQuestions([]);
        setPastedText("");
        onSaveSuccess();
      } else {
        toast("error", data.error || "Save error occurred.");
      }
    } catch {
      toast("error", "Bulk save database connection failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (index: number, field: keyof ParsedQuestion, value: string) => {
    setParsedQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleDeleteRow = (index: number) => {
    setParsedQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-6">
      {/* Import source inputs */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm max-w-4xl mx-auto space-y-6">
        <h2 className="text-base font-bold text-slate-800 font-heading border-b border-slate-100 pb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" /> AI-Powered Bulk Import Wizard
        </h2>

        {/* pasted text area */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700">Paste Question Material</label>
          <textarea
            rows={6}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste text contents from copy-pasting textbook PDFs, docx, or AI generated dumps here..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Custom Groq API Key override configuration */}
        <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              🔑 Custom Groq API Key Override
            </label>
            <span className="text-[10px] text-slate-400 font-semibold italic">
              Optional — saved in browser. Groq runs first, no 429 errors.
            </span>
          </div>
          <input
            type="password"
            value={groqApiKey}
            onChange={(e) => {
              const val = e.target.value;
              setGroqApiKey(val);
              if (val.trim()) {
                localStorage.setItem("mock_test_groq_key", val.trim());
              } else {
                localStorage.removeItem("mock_test_groq_key");
              }
            }}
            placeholder="gsk_..."
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white font-mono"
          />
        </div>

        {/* Subject metadata tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Select Target Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">— Select Subject —</option>
              {dbSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Or Enter Custom Subject</label>
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="e.g. Physics Mechanics"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={handleParse}
            disabled={parsing || !pastedText.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 px-6 py-2.5 text-xs font-extrabold text-white shadow transition-all disabled:opacity-50"
          >
            {parsing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing AI extraction...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Start AI Extraction
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview list & editing parsed questions */}
      {parsedQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-4">
            <div className="text-xs text-slate-700 font-semibold">
              Verify and edit the {parsedQuestions.length} parsed questions before saving to the DB.
            </div>
            <button
              disabled={saving}
              onClick={handleSaveAll}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              Save All to Database
            </button>
          </div>

          <div className="space-y-4">
            {parsedQuestions.map((q, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm relative space-y-4"
              >
                {/* Delete row button */}
                <button
                  onClick={() => handleDeleteRow(idx)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                {/* Index tag */}
                <span className="inline-block bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                  Parsed Question #{idx + 1}
                </span>

                {/* Editable inputs */}

                {/* Passage / Context — merged into question string on save */}
                {(q.passage !== undefined) && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                      📄 Passage / Context
                      <span className="ml-1 normal-case font-normal text-amber-500">
                        — will be prepended to the question text when saved to DB
                      </span>
                    </label>
                    <textarea
                      rows={4}
                      value={q.passage || ""}
                      onChange={(e) => handleFieldChange(idx, "passage", e.target.value)}
                      placeholder="Leave blank if this question isn't passage-based..."
                      className="w-full text-xs p-2 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 bg-amber-50/40"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Question Text
                  </label>
                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => handleFieldChange(idx, "question", e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Options list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["optionA", "optionB", "optionC", "optionD"] as const).map((key, optIdx) => {
                    const label = ["A", "B", "C", "D"][optIdx];
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Option {label}
                        </label>
                        <input
                          type="text"
                          value={q[key]}
                          onChange={(e) => handleFieldChange(idx, key, e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Correct Option, Topic, Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Correct Key
                    </label>
                    <select
                      value={q.correctOption}
                      onChange={(e) => handleFieldChange(idx, "correctOption", e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Topic Tag
                    </label>
                    <input
                      type="text"
                      value={q.topic}
                      onChange={(e) => handleFieldChange(idx, "topic", e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Difficulty
                    </label>
                    <select
                      value={q.difficulty}
                      onChange={(e) => handleFieldChange(idx, "difficulty", e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Explanation
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation}
                    onChange={(e) => handleFieldChange(idx, "explanation", e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuestionsManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A56DB] mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading Question Bank...</p>
        </div>
      </div>
    }>
      <QuestionsManagementContent />
    </Suspense>
  );
}
