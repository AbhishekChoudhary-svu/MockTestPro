"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Tag,
} from "lucide-react";

export default function ManualQuestionAdd() {
  const [question, setQuestion] = useState("");
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

  // Dynamic suggestions from DB
  const [dbSubjects, setDbSubjects] = useState<string[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const resolvedSubject = customSubject.trim() || subject;

  // Interaction for preview
  const [previewSelectedOption, setPreviewSelectedOption] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load dynamic subjects from DB on mount
  useEffect(() => {
    setLoadingMeta(true);
    fetch("/api/admin/subject-categories")
      .then((r) => r.json())
      .then((data) => {
        const names = Array.from(new Set(data.map((s: { name: string }) => s.name))).sort() as string[];
        setDbSubjects(names);
      })
      .catch(console.error)
      .finally(() => setLoadingMeta(false));
  }, []);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setErrorMsg("Question text is required.");
      return;
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      setErrorMsg("All four options (A, B, C, D) are required.");
      return;
    }

    if (!resolvedSubject.trim()) {
      setErrorMsg("Subject is required.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);
    try {
      const qObject = {
        question: question.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim(),
        optionD: optionD.trim(),
        correctOption,
        explanation: explanation.trim(),
        topic: topic.trim() || "General",
        difficulty,
      };

      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: [qObject],
          category: "",
          subject: resolvedSubject,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Question successfully added to the bank!");
        // Clear fields
        setQuestion("");
        setOptionA("");
        setOptionB("");
        setOptionC("");
        setOptionD("");
        setExplanation("");
        setTopic("");
        setPreviewSelectedOption(null);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to save question.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to bulk save API.");
    } finally {
      setSaving(false);
    }
  };

  const diffBadgeColors =
    difficulty === "easy"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : difficulty === "medium"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-red-50 text-red-700 border-red-100";

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
              <Plus className="h-5 w-5 text-blue-200" />
              Manual Question Builder
            </span>
          </div>
          <Link
            href="/admin"
            className="rounded-lg bg-blue-700 hover:bg-blue-800 px-4 py-2 text-xs font-bold transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
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

        {/* Split Screen Layout: Form and Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form Card */}
          <form
            onSubmit={handleAddQuestion}
            className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5"
          >
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
              Question Details
            </h2>

            {/* Question Text */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Question Text
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter the question text..."
                required
                className="w-full h-24 rounded-xl border border-slate-200 p-3.5 text-xs font-medium focus:border-[#1A56DB] outline-none transition-all placeholder-slate-400"
              />
            </div>

            {/* Options A - D */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Option A", val: optionA, set: setOptionA },
                { label: "Option B", val: optionB, set: setOptionB },
                { label: "Option C", val: optionC, set: setOptionC },
                { label: "Option D", val: optionD, set: setOptionD },
              ].map((opt) => (
                <div key={opt.label} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {opt.label}
                  </label>
                  <input
                    type="text"
                    value={opt.val}
                    onChange={(e) => opt.set(e.target.value)}
                    placeholder={`Enter ${opt.label}...`}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#1A56DB] outline-none transition-all placeholder-slate-400"
                  />
                </div>
              ))}
            </div>

            {/* Correct Option & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Correct Answer Option
                </label>
                <select
                  value={correctOption}
                  onChange={(e) => setCorrectOption(e.target.value as "A" | "B" | "C" | "D")}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1A56DB] transition-all"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1A56DB] transition-all"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-blue-500" />
                Subject
              </label>
              {loadingMeta ? (
                <p className="text-xs text-slate-400">Loading subjects...</p>
              ) : (
                <>
                  <select
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setCustomSubject("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1A56DB] transition-all"
                  >
                    <option value="">— Select Subject —</option>
                    {dbSubjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="">— Or type a new subject below —</option>
                  </select>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => {
                      setCustomSubject(e.target.value);
                      setSubject("");
                    }}
                    placeholder="Type a new subject name, e.g. Geography..."
                    className="w-full mt-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold focus:border-[#1A56DB] outline-none transition-all placeholder-slate-400"
                  />
                  {resolvedSubject && (
                    <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                      ✓ Selected Subject: <span className="uppercase">{resolvedSubject}</span>
                    </p>
                  )}
                </>
              )}
            </div>


            {/* Topic */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Topic Name
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Analogy, Number System, Trigonometry, etc."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#1A56DB] outline-none transition-all placeholder-slate-400"
              />
            </div>

            {/* Explanation */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Solution Explanation
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain the step-by-step solution for this question..."
                className="w-full h-20 rounded-xl border border-slate-200 p-3.5 text-xs font-medium focus:border-[#1A56DB] outline-none transition-all placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-black rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving to Question Bank...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Question to Bank
                </>
              )}
            </button>
          </form>

          {/* Live Preview Card */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pl-1">
              <Eye className="h-4.5 w-4.5 text-[#1A56DB]" />
              Live Student-View Preview
            </h3>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Question tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#1A56DB]/5 text-[#1A56DB] flex items-center justify-center font-black text-xs border border-blue-100/50">
                  1
                </span>
                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded">
                  {resolvedSubject || "Subject Name"}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200/50">
                  {topic || "Topic Name"}
                </span>
                <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded ${diffBadgeColors}`}>
                  {difficulty}
                </span>
              </div>

              {/* Question text */}
              <p className="text-sm font-semibold text-slate-800 leading-relaxed pl-1 whitespace-pre-line">
                {question || "Type your question text in the form to preview..."}
              </p>

              {/* Options list */}
              <div className="space-y-3 pl-1">
                {[
                  { key: "A", text: optionA || "Option A text placeholder..." },
                  { key: "B", text: optionB || "Option B text placeholder..." },
                  { key: "C", text: optionC || "Option C text placeholder..." },
                  { key: "D", text: optionD || "Option D text placeholder..." },
                ].map((opt) => {
                  const isSelected = previewSelectedOption === opt.key;

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setPreviewSelectedOption(opt.key)}
                      className={`w-full border rounded-xl p-3.5 flex items-center text-xs text-left transition-all ${
                        isSelected
                          ? "bg-blue-50/50 border-[#1A56DB] text-blue-900 font-semibold"
                          : "bg-white border-slate-200/80 hover:bg-slate-50/50 text-slate-700"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold mr-3 shrink-0 ${
                          isSelected
                            ? "bg-[#1A56DB] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <div className="flex-1 min-w-0">{opt.text}</div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation (simulated student view solution block) */}
              {explanation && (
                <div className="bg-blue-50/30 border border-blue-100/50 rounded-xl p-4 text-xs text-slate-600 space-y-2 mt-4 leading-relaxed ml-1">
                  <div className="font-bold text-blue-800 flex items-center gap-1.5 mb-0.5">
                    💡 Sample Solution Explanation (Visible after submit):
                  </div>
                  <p className="whitespace-pre-line">{explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
