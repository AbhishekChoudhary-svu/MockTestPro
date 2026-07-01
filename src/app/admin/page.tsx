"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Database,
  Users,
  Award,
  Sparkles,
  Plus,
  Settings,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { SkeletonStatCard, SkeletonBlock } from "@/components/ui/Skeleton";

interface AttemptItem {
  _id: string;
  userId: {
    name: string;
    email: string;
  } | null;
  examId: {
    title: string;
    category: string;
  } | null;
  status: "in-progress" | "submitted";
  startedAt: string;
  result?: {
    totalScore: number;
    totalMarks: number;
  };
}

interface StatsData {
  totalExams: number;
  totalQuestions: number;
  totalUsers: number;
  totalAttempts: number;
  recentAttempts: AttemptItem[];
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/dashboard-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Error loading dashboard stats:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-8 w-56 rounded-xl" />
            <SkeletonBlock className="h-4 w-80 rounded-lg" />
          </div>
          <SkeletonBlock className="h-8 w-48 rounded-lg" />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        {/* Two-column skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 flex gap-4">
                <SkeletonBlock className="h-11 w-11 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-32 rounded-md" />
                  <SkeletonBlock className="h-3 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <SkeletonBlock className="h-4 w-36 rounded-md" />
                  <SkeletonBlock className="h-3 w-52 rounded" />
                </div>
                <SkeletonBlock className="h-8 w-24 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Exams",
      value: stats?.totalExams ?? 0,
      icon: BookOpen,
      color: "from-blue-500 to-indigo-600",
      bg: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Questions",
      value: stats?.totalQuestions ?? 0,
      icon: Database,
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Registered Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "from-purple-500 to-pink-600",
      bg: "bg-purple-50 text-purple-600",
    },
    {
      label: "Total Practice Attempts",
      value: stats?.totalAttempts ?? 0,
      icon: Award,
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#1A56DB]" /> Admin Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Overview of MockTestPro systems, database size, and student engagement levels.
          </p>
        </div>
        <div className="text-xs bg-slate-100 font-bold px-3 py-1.5 rounded-lg text-slate-600 border border-slate-200">
          Signed in as {session?.user?.email}
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {card.label}
                </span>
                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-800 font-heading">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Section split: Quick actions & Recent attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Actions */}
        <div className="space-y-6 lg:col-span-1">
          <h2 className="text-base font-bold text-slate-800 font-heading flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-[#1A56DB]" /> Quick Task Panels
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {/* Create Exam Card */}
            <Link
              href="/admin/exams/create"
              className="group bg-white border border-slate-100 hover:border-blue-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex gap-4"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors shrink-0">
                <Plus className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#1A56DB] transition-colors">
                  Create Mock Test
                </h3>
                <p className="text-slate-400 text-[11px] leading-normal">
                  Design new tests, define sections, and assign questions.
                </p>
              </div>
            </Link>

            {/* AI Bulk Import Card */}
            <Link
              href="/admin/questions?tab=import"
              className="group bg-white border border-slate-100 hover:border-blue-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex gap-4"
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  AI Question Import
                </h3>
                <p className="text-slate-400 text-[11px] leading-normal">
                  Extract formatted MCQs from uploaded files using AI models.
                </p>
              </div>
            </Link>

            {/* Cleanup & Settings Card */}
            <Link
              href="/admin/settings"
              className="group bg-white border border-slate-100 hover:border-blue-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex gap-4"
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors shrink-0">
                <Settings className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                  System Settings
                </h3>
                <p className="text-slate-400 text-[11px] leading-normal">
                  Wipe test logs, audit data, and manage administrative settings.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-800 font-heading flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-[#1A56DB]" /> Recent Student Practice
            </h2>
            <Link
              href="/admin/settings"
              className="text-xs font-bold text-[#1A56DB] hover:underline flex items-center gap-0.5"
            >
              View Analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            {!stats?.recentAttempts || stats.recentAttempts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No mock test attempts recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recentAttempts.map((item) => (
                  <div
                    key={item._id}
                    className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1 truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {item.userId?.name ?? "Guest User"}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 truncate">
                        Attempted: <span className="text-slate-600 font-semibold">{item.examId?.title ?? "Deleted Test"}</span> ({item.examId?.category})
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400">
                          {new Date(item.startedAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {item.status === "submitted" && item.result ? (
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[9px] font-bold uppercase mt-1">
                            Score: {item.result.totalScore}/{item.result.totalMarks}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 text-amber-800 px-2 py-0.5 text-[9px] font-bold uppercase mt-1">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
