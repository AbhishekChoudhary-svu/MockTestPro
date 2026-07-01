"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Trash2,
  RefreshCw,
  Database,
  Users,
  BookOpen,
  Award,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useAlert } from "@/components/ui/AlertProvider";
import { SkeletonStatCard, SkeletonBlock } from "@/components/ui/Skeleton";

interface DatabaseStats {
  usersCount: number;
  questionsCount: number;
  examsCount: number;
  attemptsCount: number;
}

interface ExamItem {
  _id: string;
  title: string;
  category: string;
}

export default function AdminSettingsPage() {
  const { confirm, toast } = useAlert();
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState("");

  useEffect(() => {
    loadSettingsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSettingsData() {
    try {
      setLoading(true);
      const [res1, res2] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/exams"),
      ]);

      if (res1.ok) {
        const data = await res1.json();
        setStats(data);
      }
      if (res2.ok) {
        const data = await res2.json();
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0]._id);
        }
      }
    } catch (e) {
      console.error("Error loading settings info:", e);
      toast("error", "Error loading system data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleWipeAllAttempts() {
    const ok = await confirm({
      title: "Wipe All Attempts?",
      message: "Are you sure? This will delete all student mock test logs and results from the database. This action is irreversible.",
      confirmLabel: "Wipe Database Logs",
      cancelLabel: "Cancel",
      type: "danger",
    });
    if (!ok) return;

    try {
      setActionLoading("clear-all");
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-all-attempts" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("success", data.message || "All attempts logs wiped successfully!");
        loadSettingsData();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error executing wipe operation");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleWipeExamAttempts() {
    if (!selectedExamId) return;
    const selectedExam = exams.find((e) => e._id === selectedExamId);
    if (!selectedExam) return;

    const ok = await confirm({
      title: "Wipe Specific Attempts?",
      message: `Delete all student attempt history for the exam "${selectedExam.title}"? Other exams won't be affected.`,
      confirmLabel: "Wipe History",
      cancelLabel: "Cancel",
      type: "danger",
    });
    if (!ok) return;

    try {
      setActionLoading("clear-exam");
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clear-exam-attempts",
          targetExamId: selectedExamId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("success", data.message || "Exam attempt records wiped.");
        loadSettingsData();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Wipe failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetCounters() {
    const ok = await confirm({
      title: "Reset Attempt Counters?",
      message: "This resets the attempt counters shown on exam cards to 0. Attempt logs themselves will NOT be deleted.",
      confirmLabel: "Reset Counters",
      cancelLabel: "Cancel",
      type: "warning",
    });
    if (!ok) return;

    try {
      setActionLoading("reset-counts");
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-attempt-counts" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("success", data.message || "All exam attempt counters reset to 0.");
        loadSettingsData();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Reset failed");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-52 rounded-xl animate-pulse" />
          <SkeletonBlock className="h-4 w-80 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 animate-pulse">
              <SkeletonBlock className="h-5 w-48 rounded-lg mb-3" />
              <SkeletonBlock className="h-4 w-full rounded mb-2" />
              <SkeletonBlock className="h-4 w-3/4 rounded mb-4" />
              <SkeletonBlock className="h-10 w-40 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Registered Candidates",
      value: stats?.usersCount ?? 0,
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: "Questions Stored",
      value: stats?.questionsCount ?? 0,
      icon: Database,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Exams Built",
      value: stats?.examsCount ?? 0,
      icon: BookOpen,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
    {
      label: "Practice Logs Size",
      value: stats?.attemptsCount ?? 0,
      icon: Award,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#1A56DB]" /> System Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Perform administrative database cleanup operations, monitor collections size, and reset metrics.
        </p>
      </div>

      {/* Database Statistics */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 font-heading">Database Diagnostics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm"
              >
                <div className={`p-3 rounded-xl border ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {card.label}
                  </p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Database cleanup tools */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 font-heading flex items-center gap-1.5">
          <ShieldAlert className="h-5 w-5 text-red-500" /> Database Cleanup Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Clear attempts for a specific exam */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800">Clear Attempts by Exam</h3>
              <p className="text-slate-400 text-xs leading-normal">
                Select an exam category layout and delete all student progress logs associated with it. This resets attempt counters for this exam only.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Select Target Exam
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                >
                  {exams.length === 0 ? (
                    <option value="">— No Exams Built Yet —</option>
                  ) : (
                    exams.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.title} ({e.category})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                disabled={!selectedExamId || actionLoading !== null}
                onClick={handleWipeExamAttempts}
                className="flex items-center justify-center gap-1.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100/50 hover:border-red-300 font-extrabold text-xs px-5 py-2.5 rounded-xl transition w-full disabled:opacity-50"
              >
                {actionLoading === "clear-exam" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Clear Exam Logs
              </button>
            </div>
          </div>

          {/* Card 2: Wipe all attempts & reset counters */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#1A56DB]">System Diagnostics Reset</h3>
              <p className="text-slate-400 text-xs leading-normal">
                Wipe all mock attempt files and candidate logs. This action resets all exam attempts lists and counter statistics on all cards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                disabled={actionLoading !== null}
                onClick={handleResetCounters}
                className="flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100/50 hover:border-amber-300 font-extrabold text-xs px-4 py-3 rounded-xl transition disabled:opacity-50"
              >
                {actionLoading === "reset-counts" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Reset Counters
              </button>

              <button
                disabled={actionLoading !== null}
                onClick={handleWipeAllAttempts}
                className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {actionLoading === "clear-all" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Wipe All Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
