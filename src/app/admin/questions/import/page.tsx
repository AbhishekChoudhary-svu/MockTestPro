"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Save,
} from "lucide-react";

interface ParsedQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

export default function AIQuestionImport() {


  const [pastedText, setPastedText] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const resolvedSubject = customSubject.trim() || subject;

  // Dynamic suggestions from DB
  const [dbSubjects, setDbSubjects] = useState<string[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

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

  // State for parsed questions
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseSource, setParseSource] = useState<string>("");

  // Status banners
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleParse = async () => {
    if (!pastedText.trim()) {
      setErrorMsg("Please paste some text first.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setParsing(true);
    try {
      const res = await fetch("/api/admin/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText, subject: resolvedSubject }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setParseSource(data.source || "unknown");
        if (data.questions?.length === 0) {
          setErrorMsg("No questions could be parsed from the text.");
        }
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to parse questions.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected network error occurred.");
    } finally {
      setParsing(false);
    }
  };

  const handleFieldChange = (index: number, field: keyof ParsedQuestion, value: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const handleDeleteRow = (index: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveAll = async () => {
    if (questions.length === 0) return;
    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, subject: resolvedSubject }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message || "Successfully saved all questions!");
        setQuestions([]);
        setPastedText("");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to save questions to database.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to database API.");
    } finally {
      setSaving(false);
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
              <Sparkles className="h-5 w-5 text-blue-200" />
              AI Question Import
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

        {/* Top Split Panel: Input Text & Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Input Text Area */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
              Raw Question Text
            </h2>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`Paste your exam questions here. Format example:
1. What is Mongoose?
A) An Express server
B) An ODM for MongoDB
C) A UI design library
D) A Node package builder
Answer: B
Explanation: Mongoose is an ODM library that connects MongoDB schemas to Node.js.`}
              className="flex-1 w-full min-h-[220px] rounded-xl border border-slate-200 p-4 text-xs font-medium focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB] outline-none transition-all placeholder-slate-400"
            />
          </div>

          {/* Configuration Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Categorization
              </h2>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Subject Tag
                </label>
                {loadingMeta ? (
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-400 animate-pulse">
                    Loading subjects...
                  </div>
                ) : (
                  <>
                    <select
                      value={subject}
                      onChange={(e) => { setSubject(e.target.value); setCustomSubject(""); }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB] transition-all appearance-none cursor-pointer"
                    >
                      <option value="">— Select a subject —</option>
                      {dbSubjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="__custom__">＋ Type a new subject</option>
                    </select>
                    {subject === "__custom__" && (
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Type subject name..."
                        autoFocus
                        className="w-full rounded-xl border border-[#1A56DB] bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#1A56DB] transition-all mt-1 placeholder-slate-400"
                      />
                    )}
                  </>
                )}
                <p className="text-[9px] text-slate-400">Must match section Subject Tag in your exam</p>
              </div>
            </div>

            <button
              onClick={handleParse}
              disabled={parsing}
              className="w-full py-3 bg-[#1A56DB] hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-black rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {parsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing text...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-blue-200" />
                  Parse with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* OpenRouter Success Banner */}
        {questions.length > 0 && parseSource === "openrouter" && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-4 flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Parsed via OpenRouter (openai/gpt-oss-120b:free)</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Questions were successfully structured using the free OpenRouter model. Review and edit any fields below before saving to the database.
              </p>
            </div>
          </div>
        )}

        {/* Fallback Warning Banner */}
        {questions.length > 0 && parseSource === "fallback" && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Local Fallback Parser Active</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                No active API key was detected (OpenRouter, OpenAI, or Gemini). We used the regex pattern extractor to format your questions. Add <code className="bg-amber-100 px-1 rounded">OPENROUTER_API_KEY</code> to your <code className="bg-amber-100 px-1 rounded">.env</code> file to enable the free AI model.
              </p>
            </div>
          </div>
        )}

        {/* Parsed Preview Table */}
        {questions.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-heading">
                  Parsed Questions Preview ({questions.length})
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Review, edit, or delete items inline before saving them to the database.
                </p>
              </div>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-black rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save All to Question Bank
                  </>
                )}
              </button>
            </div>

            {/* Questions Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 min-w-[300px]">Question Text</th>
                    <th className="p-3 min-w-[200px]">Options (A - D)</th>
                    <th className="p-3 w-28 text-center">Correct Answer</th>
                    <th className="p-3 min-w-[150px]">Explanation</th>
                    <th className="p-3 min-w-[120px]">Topic</th>
                    <th className="p-3 w-28">Difficulty</th>
                    <th className="p-3 w-16 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {questions.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40">
                      {/* Index */}
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>

                      {/* Question Text */}
                      <td className="p-3">
                        <textarea
                          value={q.question}
                          onChange={(e) => handleFieldChange(idx, "question", e.target.value)}
                          className="w-full h-20 rounded-lg border border-slate-200 p-2 text-xs focus:border-[#1A56DB] outline-none resize-y"
                        />
                      </td>

                      {/* Options */}
                      <td className="p-3 space-y-1.5">
                        <div className="flex items-center gap-1">
                          <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">A</span>
                          <input
                            type="text"
                            value={q.optionA}
                            onChange={(e) => handleFieldChange(idx, "optionA", e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-[#1A56DB] outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">B</span>
                          <input
                            type="text"
                            value={q.optionB}
                            onChange={(e) => handleFieldChange(idx, "optionB", e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-[#1A56DB] outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">C</span>
                          <input
                            type="text"
                            value={q.optionC}
                            onChange={(e) => handleFieldChange(idx, "optionC", e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-[#1A56DB] outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">D</span>
                          <input
                            type="text"
                            value={q.optionD}
                            onChange={(e) => handleFieldChange(idx, "optionD", e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-[#1A56DB] outline-none"
                          />
                        </div>
                      </td>

                      {/* Correct Option */}
                      <td className="p-3 text-center">
                        <select
                          value={q.correctOption}
                          onChange={(e) => handleFieldChange(idx, "correctOption", e.target.value)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1A56DB]"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </td>

                      {/* Explanation */}
                      <td className="p-3">
                        <textarea
                          value={q.explanation}
                          onChange={(e) => handleFieldChange(idx, "explanation", e.target.value)}
                          className="w-full h-20 rounded-lg border border-slate-200 p-2 text-xs focus:border-[#1A56DB] outline-none resize-y"
                        />
                      </td>

                      {/* Topic */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={q.topic}
                          onChange={(e) => handleFieldChange(idx, "topic", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-[#1A56DB] outline-none"
                        />
                      </td>

                      {/* Difficulty */}
                      <td className="p-3">
                        <select
                          value={q.difficulty}
                          onChange={(e) => handleFieldChange(idx, "difficulty", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1A56DB]"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </td>

                      {/* Delete Action */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
