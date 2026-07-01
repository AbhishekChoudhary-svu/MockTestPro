"use client";

import { useState, useEffect } from "react";
import {
  Tag,
  FolderOpen,
  BookMarked,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useAlert } from "@/components/ui/AlertProvider";
import { SkeletonBlock } from "@/components/ui/Skeleton";

interface ExamCategoryItem {
  _id: string;
  name: string;
}

interface SubjectCategoryItem {
  _id: string;
  name: string;
  examCategory: string;
}

export default function CategoriesTopicsPage() {
  const { confirm, toast } = useAlert();
  const [examCategories, setExamCategories] = useState<ExamCategoryItem[]>([]);
  const [subjectCategories, setSubjectCategories] = useState<SubjectCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newExamCatName, setNewExamCatName] = useState("");
  const [newSubjCatName, setNewSubjCatName] = useState("");
  const [selectedExamCatForSubj, setSelectedExamCatForSubj] = useState("");

  const [addingExamCat, setAddingExamCat] = useState(false);
  const [addingSubjCat, setAddingSubjCat] = useState(false);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const [res1, res2] = await Promise.all([
        fetch("/api/admin/exam-categories"),
        fetch("/api/admin/subject-categories"),
      ]);

      if (res1.ok) {
        const data = await res1.json();
        setExamCategories(data);
        if (data.length > 0 && !selectedExamCatForSubj) {
          setSelectedExamCatForSubj(data[0].name);
        }
      }
      if (res2.ok) {
        const data = await res2.json();
        setSubjectCategories(data);
      }
    } catch (e) {
      console.error("Error loading categories:", e);
      toast("error", "Error loading categories and subjects from server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExamCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newExamCatName.trim()) return;

    try {
      setAddingExamCat(true);
      const res = await fetch("/api/admin/exam-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newExamCatName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add category");

      setExamCategories((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      );
      toast("success", `Exam category "${newExamCatName}" added successfully!`);
      if (!selectedExamCatForSubj) setSelectedExamCatForSubj(data.name);
      setNewExamCatName("");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error adding category");
    } finally {
      setAddingExamCat(false);
    }
  }

  async function handleDeleteExamCategory(id: string, name: string) {
    const ok = await confirm({
      title: "Delete Exam Category?",
      message: `Are you sure you want to delete "${name}"? Exams linked to this category will remain, but they will not match this label.`,
      confirmLabel: "Delete Category",
      cancelLabel: "Cancel",
      type: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/exam-categories?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete category");

      setExamCategories((prev) => prev.filter((c) => c._id !== id));
      toast("success", `Exam category "${name}" has been deleted.`);

      if (selectedExamCatForSubj === name) {
        const remaining = examCategories.filter((c) => c._id !== id);
        setSelectedExamCatForSubj(remaining.length > 0 ? remaining[0].name : "");
      }
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error deleting category");
    }
  }

  async function handleAddSubjectCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubjCatName.trim() || !selectedExamCatForSubj) return;

    try {
      setAddingSubjCat(true);
      const res = await fetch("/api/admin/subject-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubjCatName.trim(),
          examCategory: selectedExamCatForSubj,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add subject");

      setSubjectCategories((prev) =>
        [...prev, data].sort(
          (a, b) =>
            a.examCategory.localeCompare(b.examCategory) ||
            a.name.localeCompare(b.name)
        )
      );
      toast("success", `Subject "${newSubjCatName}" added under "${selectedExamCatForSubj}".`);
      setNewSubjCatName("");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error adding subject");
    } finally {
      setAddingSubjCat(false);
    }
  }

  async function handleDeleteSubjectCategory(id: string, name: string, examCat: string) {
    const ok = await confirm({
      title: "Delete Subject Category?",
      message: `Delete subject "${name}" under "${examCat}"? Questions tagged with this subject won't be deleted.`,
      confirmLabel: "Delete Subject",
      cancelLabel: "Cancel",
      type: "warning",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/subject-categories?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete subject");

      setSubjectCategories((prev) => prev.filter((s) => s._id !== id));
      toast("success", `Subject "${name}" deleted successfully.`);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error deleting subject");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-64 rounded-xl animate-pulse" />
          <SkeletonBlock className="h-4 w-96 rounded-lg animate-pulse" />
        </div>
        {/* Two column skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
              <SkeletonBlock className="h-6 w-40 rounded-lg" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <SkeletonBlock className="h-9 flex-1 rounded-xl mr-2" />
                    <SkeletonBlock className="h-9 w-9 rounded-lg shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-center gap-2">
          <Tag className="h-6 w-6 text-[#1A56DB]" /> Categories & Topics
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Maintain lists of active exam categories and specific subject headings used to tag mock tests.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1: Exam Categories */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FolderOpen className="h-5 w-5 text-[#1A56DB]" />
              <h3 className="text-sm font-bold text-slate-800">Exam Categories</h3>
            </div>

            {/* Form */}
            <form onSubmit={handleAddExamCategory} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="New category, e.g. WBPSC"
                value={newExamCatName}
                onChange={(e) => setNewExamCatName(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={addingExamCat || !newExamCatName.trim()}
                className="flex items-center gap-1 bg-[#1A56DB] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition disabled:opacity-50"
              >
                {addingExamCat ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                Add
              </button>
            </form>

            {/* List */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {examCategories.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No exam categories registered yet.
                </div>
              ) : (
                examCategories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/50 text-xs text-slate-700 font-bold hover:bg-slate-100/50 transition-colors"
                  >
                    <span>{cat.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExamCategory(cat._id, cat.name)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title={`Delete category ${cat.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Subject Headings */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <BookMarked className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">Subject Headings</h3>
            </div>

            {/* Category selection */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Select Exam Category
                </label>
                <select
                  value={selectedExamCatForSubj}
                  onChange={(e) => setSelectedExamCatForSubj(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                >
                  {examCategories.length === 0 ? (
                    <option value="">— No categories available —</option>
                  ) : (
                    examCategories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Form */}
              <form onSubmit={handleAddSubjectCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="New subject, e.g. Physical Chemistry"
                  value={newSubjCatName}
                  onChange={(e) => setNewSubjCatName(e.target.value)}
                  disabled={!selectedExamCatForSubj}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={addingSubjCat || !newSubjCatName.trim() || !selectedExamCatForSubj}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition disabled:opacity-50"
                >
                  {addingSubjCat ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  Add
                </button>
              </form>
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {!selectedExamCatForSubj ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Create an exam category to manage subjects.
                </div>
              ) : subjectCategories.filter(
                  (s) => s.examCategory.toLowerCase() === selectedExamCatForSubj.toLowerCase()
                ).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No subjects registered under &quot;{selectedExamCatForSubj}&quot;.
                </div>
              ) : (
                subjectCategories
                  .filter((s) => s.examCategory.toLowerCase() === selectedExamCatForSubj.toLowerCase())
                  .map((subj) => (
                    <div
                      key={subj._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/50 text-xs text-slate-700 font-bold hover:bg-slate-100/50 transition-colors"
                    >
                      <span>{subj.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteSubjectCategory(subj._id, subj.name, subj.examCategory)
                        }
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title={`Delete subject ${subj.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
