"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  Plus,
  Database,
  Users,
  BookOpen,
  ArrowLeft,
  ShieldCheck,
  Trash2,
  Tag,
  BookMarked,
  FolderOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAlert } from "@/components/ui/AlertProvider";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const { confirm, toast } = useAlert();
  const [examCategories, setExamCategories] = useState<{ _id: string; name: string }[]>([]);
  const [subjectCategories, setSubjectCategories] = useState<{ _id: string; name: string; examCategory: string }[]>([]);
  const [newExamCatName, setNewExamCatName] = useState("");
  const [newSubjCatName, setNewSubjCatName] = useState("");
  const [selectedExamCatForSubj, setSelectedExamCatForSubj] = useState("");
  const [loadingCats, setLoadingCats] = useState(true);


  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoadingCats(true);
    try {
      const [res1, res2] = await Promise.all([
        fetch("/api/admin/exam-categories"),
        fetch("/api/admin/subject-categories")
      ]);
      if (res1.ok) {
        const data = await res1.json();
        setExamCategories(data);
        if (data.length > 0) {
          setSelectedExamCatForSubj(data[0].name);
        }
      }
      if (res2.ok) {
        const data = await res2.json();
        setSubjectCategories(data);
      }
    } catch (e) {
      console.error("Error loading categories", e);
    } finally {
      setLoadingCats(false);
    }
  }

  async function handleAddExamCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newExamCatName.trim()) return;
    try {
      const res = await fetch("/api/admin/exam-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newExamCatName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add category");
      setExamCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast("success", `Exam category "${newExamCatName}" added successfully!`, "Category Added");
      if (!selectedExamCatForSubj) setSelectedExamCatForSubj(data.name);
      setNewExamCatName("");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error adding category", "Failed");
    }
  }

  async function handleDeleteExamCategory(id: string, name: string) {
    const ok = await confirm({
      title: "Delete Exam Category?",
      message: `Delete "${name}"? Existing questions/exams will not be deleted but they will no longer match this category.`,
      confirmLabel: "Yes, Delete",
      cancelLabel: "Cancel",
      type: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/exam-categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setExamCategories(prev => prev.filter(c => c._id !== id));
      toast("success", `Exam category "${name}" deleted.`, "Deleted");
      if (selectedExamCatForSubj === name) {
        const remaining = examCategories.filter(c => c._id !== id);
        setSelectedExamCatForSubj(remaining.length > 0 ? remaining[0].name : "");
      }
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error deleting category", "Error");
    }
  }

  async function handleAddSubjectCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubjCatName.trim() || !selectedExamCatForSubj) return;
    try {
      const res = await fetch("/api/admin/subject-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubjCatName, examCategory: selectedExamCatForSubj }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add subject");
      setSubjectCategories(prev => [...prev, data].sort((a, b) => a.examCategory.localeCompare(b.examCategory) || a.name.localeCompare(b.name)));
      toast("success", `Subject "${newSubjCatName}" added to "${selectedExamCatForSubj}".`, "Subject Added");
      setNewSubjCatName("");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error adding subject", "Failed");
    }
  }

  async function handleDeleteSubjectCategory(id: string, name: string, examCat: string) {
    const ok = await confirm({
      title: "Delete Subject?",
      message: `Delete subject "${name}" under "${examCat}"? Questions tagged with this subject won't be affected.`,
      confirmLabel: "Yes, Delete",
      cancelLabel: "Cancel",
      type: "warning",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/subject-categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setSubjectCategories(prev => prev.filter(s => s._id !== id));
      toast("success", `Subject "${name}" deleted.`, "Deleted");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error deleting subject", "Error");
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-16">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#1A56DB] text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-blue-200" />
            <span className="text-lg font-extrabold font-heading tracking-tight">
              MockTestPro <span className="text-blue-200 text-xs font-normal ml-1">Admin</span>
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-blue-400 px-4 py-2 text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Student View
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-10 animate-fadeIn">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-6 sm:p-8 shadow-md">
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
            Welcome, {session?.user?.name || "Administrator"}!
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-lg">
            Manage your question bank, edit exam configurations, parse content using AI, and view student attempt logs.
          </p>
        </div>

        {/* Dashboard Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: <Database className="h-6 w-6 text-[#1A56DB]" />,
              label: "Question Bank Status",
              value: "Ready",
              color: "bg-blue-50 border-blue-100",
            },
            {
              icon: <BookOpen className="h-6 w-6 text-emerald-600" />,
              label: "Exam Content Templates",
              value: "Active",
              color: "bg-emerald-50 border-emerald-100",
            },
            {
              icon: <Users className="h-6 w-6 text-purple-600" />,
              label: "Authorized Role",
              value: "Admin Only",
              color: "bg-purple-50 border-purple-100",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`border ${stat.color} rounded-2xl p-5 flex items-center gap-4 bg-white shadow-sm`}
            >
              <div className="rounded-xl p-3 bg-white shadow-sm border border-slate-100">{stat.icon}</div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-base font-black text-slate-800 mt-0.5">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Areas */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800 font-heading">Question Bank Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: AI Question Import */}
            <Link
              href="/admin/questions/import"
              className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex flex-col justify-between space-y-4 cursor-pointer"
            >
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded-xl text-[#1A56DB] w-fit group-hover:bg-blue-100 transition-colors">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 group-hover:text-[#1A56DB] transition-colors">
                  AI-Powered Bulk Import
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Paste raw text from files, PDFs, or AI outputs, and let Gemini/OpenAI parse and format them into structured exam questions with answers and explanations automatically.
                </p>
              </div>
              <div className="text-xs font-bold text-[#1A56DB] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Launch Import Wizard &rarr;
              </div>
            </Link>

            {/* Card 2: Manual Question Entry */}
            <Link
              href="/admin/questions/add"
              className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex flex-col justify-between space-y-4 cursor-pointer"
            >
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 w-fit group-hover:bg-emerald-100 transition-colors">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  Manual Question Entry
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Add single questions manually with fields for options, correct answer keys, topics, difficulty tags, and detailed markdown explanations. Includes real-time student view layout preview.
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Question Builder &rarr;
              </div>
            </Link>
          </div>
        </div>

        {/* Exam Configuration Management */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800 font-heading">Mock Test Templates</h2>
          <div className="grid grid-cols-1 gap-6">
            <Link
              href="/admin/exams"
              className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 cursor-pointer"
            >
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blue-50 rounded-xl text-[#1A56DB] group-hover:bg-blue-100 transition-colors shrink-0">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 group-hover:text-[#1A56DB] transition-colors">
                    Mock Test Template Builder
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">
                    Configure structural parameters, specify section timers, assign questions manually or auto-fill them randomly, set marking schemes, and publish mock tests to the live student catalog.
                  </p>
                </div>
              </div>
              <div className="text-xs font-bold text-[#1A56DB] flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
                Manage Exams &rarr;
              </div>
            </Link>
          </div>
        </div>

        {/* Categories & Subjects Management */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800 font-heading flex items-center gap-2">
            <Tag className="h-5 w-5 text-[#1A56DB]" /> Manage Categories & Subjects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Exam Categories */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <FolderOpen className="h-5 w-5 text-[#1A56DB]" />
                  <h3 className="text-sm font-bold text-slate-800">Exam Categories</h3>
                </div>



                <form onSubmit={handleAddExamCategory} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New category, e.g. NEET"
                    value={newExamCatName}
                    onChange={(e) => setNewExamCatName(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 bg-[#1A56DB] hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </form>

                {loadingCats ? (
                  <p className="text-xs text-slate-400">Loading categories...</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {examCategories.length === 0 ? (
                      <p className="text-xs text-slate-400">No categories found.</p>
                    ) : (
                      examCategories.map((cat) => (
                        <div
                          key={cat._id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium hover:bg-slate-100 transition-colors"
                        >
                          <span className="truncate">{cat.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteExamCategory(cat._id, cat.name)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title={`Delete ${cat.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subject Categories */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <BookMarked className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">Subject Categories</h3>
                </div>



                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Select Exam Category
                    </label>
                    <select
                      value={selectedExamCatForSubj}
                      onChange={(e) => setSelectedExamCatForSubj(e.target.value)}
                      className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                    >
                      {examCategories.length === 0 ? (
                        <option value="">— No Categories Available —</option>
                      ) : (
                        examCategories.map((c) => (
                          <option key={c._id} value={c.name}>
                            {c.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <form onSubmit={handleAddSubjectCategory} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New subject, e.g. Mathematics"
                      value={newSubjCatName}
                      onChange={(e) => setNewSubjCatName(e.target.value)}
                      disabled={!selectedExamCatForSubj}
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={!selectedExamCatForSubj}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </form>
                </div>

                {loadingCats ? (
                  <p className="text-xs text-slate-400">Loading subjects...</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {!selectedExamCatForSubj ? (
                      <p className="text-xs text-slate-400">Please select or add an exam category first.</p>
                    ) : subjectCategories.filter((s) => s.examCategory.toLowerCase() === selectedExamCatForSubj.toLowerCase()).length === 0 ? (
                      <p className="text-xs text-slate-400">No subjects defined under &quot;{selectedExamCatForSubj}&quot;.</p>
                    ) : (
                      subjectCategories
                        .filter((s) => s.examCategory.toLowerCase() === selectedExamCatForSubj.toLowerCase())
                        .map((subj) => (
                          <div
                            key={subj._id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium hover:bg-slate-100 transition-colors"
                          >
                            <span className="truncate">{subj.name}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubjectCategory(subj._id, subj.name, subj.examCategory)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                              title={`Delete ${subj.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
