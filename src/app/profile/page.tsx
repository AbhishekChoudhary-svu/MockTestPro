"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { 
  User as UserIcon, 
  BookOpen, 
  Award, 
  Flame, 
  Calendar, 
  MapPin, 
  CheckCircle,
  Save,
  Loader2
} from "lucide-react";

const TARGET_EXAMS = [
  "SSC CGL",
  "SSC CHSL",
  "SSC MTS",
  "RRB NTPC",
  "RRB Group D",
  "IBPS PO",
  "SBI PO",
  "WBPSC",
  "UPPSC",
  "BPSC",
  "MPSC"
];

const STATES = [
  "Andhra Pradesh",
  "Bihar",
  "Delhi",
  "Gujarat",
  "Karnataka",
  "Maharashtra",
  "Madhya Pradesh",
  "Rajasthan",
  "Tamil Nadu",
  "Uttar Pradesh",
  "West Bengal"
];

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  targetExam: string;
  state: string;
  streak: number;
  createdAt: string;
}

interface StatsData {
  testsAttempted: number;
  averageScore: string;
  streak: number;
  joinedDate: string;
}

export default function ProfilePage() {
  const { status, update } = useSession();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [targetExam, setTargetExam] = useState("");
  const [userState, setUserState] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfileData();
    }
  }, [status]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setStats(data.stats);
        setTargetExam(data.user.targetExam || "");
        setUserState(data.user.state || "");
      }
    } catch (e) {
      console.error("Error fetching profile details:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetExam,
          state: userState,
        }),
      });

      if (res.ok) {
        await res.json();
        setMessage({ type: "success", text: "Profile updated successfully!" });
        
        // Sync local profile state
        if (profile) {
          setProfile({
            ...profile,
            targetExam,
            state: userState,
          });
        }

        // Trigger session update so metadata syncs
        await update({ targetExam, state: userState });
      } else {
        const errorData = await res.json();
        setMessage({ type: "error", text: errorData.error || "Failed to update profile." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#1A56DB]" />
          <p className="text-gray-500 font-medium font-sans">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="text-center font-sans">
          <p className="text-red-500 font-semibold mb-4">Please log in to view this page.</p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-[#1A56DB] px-4 py-2 text-white font-semibold hover:bg-blue-700 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      {/* Top Navbar */}
      <Header />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading text-slate-900">
            Welcome back, {profile.name}!
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your mock test preferences and track your learning progress.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: User Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profile.name)}`}
                alt={profile.name}
                className="h-24 w-24 rounded-full border-4 border-blue-50 object-cover shadow-sm"
              />
              <span className={`absolute bottom-0 right-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase shadow-sm ${
                isAdmin ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}>
                {profile.role}
              </span>
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 font-heading">{profile.name}</h2>
            <p className="text-slate-500 text-sm mb-6">{profile.email}</p>

            <div className="w-full border-t border-slate-100 pt-4 text-left space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-[#1A56DB]" />
                <span>Joined {formatDate(profile.createdAt)}</span>
              </div>
              {profile.targetExam && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Award className="h-4 w-4 text-[#1A56DB]" />
                  <span>Targeting: <strong className="text-slate-800">{profile.targetExam}</strong></span>
                </div>
              )}
              {profile.state && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-[#1A56DB]" />
                  <span>State: <strong className="text-slate-800">{profile.state}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Middle Column: Edit Profile Preference */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-800 font-heading mb-6 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-[#1A56DB]" />
              Exam Preferences
            </h2>

            {message && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 border text-sm font-medium ${
                message.type === "success" 
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                  : "bg-red-50 text-red-800 border-red-200"
              }`}>
                {message.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="target-exam" className="block text-sm font-semibold text-slate-700">
                    Target Exam
                  </label>
                  <select
                    id="target-exam"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-[#1A56DB] focus:outline-none focus:ring-1 focus:ring-[#1A56DB] sm:text-sm h-10"
                  >
                    <option value="">Select Target Exam</option>
                    {TARGET_EXAMS.map((exam) => (
                      <option key={exam} value={exam}>
                        {exam}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">We will customize your exam suggestions based on this choice.</p>
                </div>

                <div>
                  <label htmlFor="user-state" className="block text-sm font-semibold text-slate-700">
                    State / Region
                  </label>
                  <select
                    id="user-state"
                    value={userState}
                    onChange={(e) => setUserState(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-[#1A56DB] focus:outline-none focus:ring-1 focus:ring-[#1A56DB] sm:text-sm h-10"
                  >
                    <option value="">Select State</option>
                    {STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Required for state-specific PSC exam relevancy.</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#1A56DB] hover:bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Stats Grid Dashboard */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-800 font-heading mb-6">Learning Analytics</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Stat Card 1: Tests Attempted */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tests Attempted</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats?.testsAttempted ?? 0}</p>
              </div>
            </div>

            {/* Stat Card 2: Average Score */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Average Score</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats?.averageScore ?? "0%"}</p>
              </div>
            </div>

            {/* Stat Card 3: Daily Streak */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="rounded-lg bg-amber-50 p-3 text-amber-600 animate-bounce" style={{ animationDuration: '3s' }}>
                <Flame className="h-6 w-6 fill-amber-500 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Daily Streak</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats?.streak ?? 0} { (stats?.streak ?? 0) > 0 ? "Days 🔥" : "Days" }</p>
              </div>
            </div>

            {/* Stat Card 4: Account Age / Joined Date */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Member Since</p>
                <p className="text-lg font-bold text-slate-800 mt-1.5 truncate">
                  {stats?.joinedDate ? new Date(stats.joinedDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
