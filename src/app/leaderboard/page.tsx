"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/ui/Header";
import {
  Trophy,
  Flame,
  Search,
  BookOpen,
  MapPin,
  Award,
  ChevronUp,
  ChevronDown,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface LeaderboardItem {
  id: string;
  name: string;
  avatar: string;
  state: string;
  targetExam: string;
  streak: number;
  testsAttempted: number;
  averageScore: number;
  points: number;
  joinedDate: string;
  rank: number;
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedTargetExam, setSelectedTargetExam] = useState("All");
  const [sortBy, setSortBy] = useState<"points" | "streak" | "averageScore" | "testsAttempted">("points");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        }
      } catch (e) {
        console.error("Failed fetching leaderboard:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  // Update streak check on page load to keep user active day count fresh
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/streak", { method: "POST" }).catch(console.error);
    }
  }, [status]);

  // Extract unique filters
  const statesList = Array.from(
    new Set(leaderboard.map((item) => item.state).filter((s) => s && s !== "N/A"))
  ).sort();
  const examsList = Array.from(
    new Set(leaderboard.map((item) => item.targetExam).filter((e) => e && e !== "N/A"))
  ).sort();

  // Sorting handler
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Filtered & Sorted items
  const filteredItems = leaderboard
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesState = selectedState === "All" || item.state === selectedState;
      const matchesExam = selectedTargetExam === "All" || item.targetExam === selectedTargetExam;
      return matchesSearch && matchesState && matchesExam;
    })
    .sort((a, b) => {
      const scoreA = a[sortBy];
      const scoreB = b[sortBy];
      if (sortOrder === "asc") {
        return scoreA > scoreB ? 1 : -1;
      } else {
        return scoreA < scoreB ? 1 : -1;
      }
    });

  // Find current user's entry in leaderboard
  const currentUserEntry = leaderboard.find((item) => item.id === session?.user?.id);


  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-amber-100 border border-amber-300 text-amber-800";
    if (rank === 2) return "bg-slate-100 border border-slate-300 text-slate-800";
    if (rank === 3) return "bg-orange-100 border border-orange-300 text-orange-800";
    return "bg-slate-50 border border-slate-200 text-slate-600";
  };

  // Top 3 Podium elements
  const top3 = leaderboard.slice(0, 3);
  // Re-order top3 to display as: 2nd place - 1st place - 3rd place
  const podiumList = [];
  if (top3[1]) podiumList.push(top3[1]); // 2nd
  if (top3[0]) podiumList.push(top3[0]); // 1st
  if (top3[2]) podiumList.push(top3[2]); // 3rd

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-12">
      <Header />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8 animate-fadeIn">
        {/* Page title section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#1A56DB] to-[#0A3D91] p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 -left-12 h-48 w-48 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-black font-heading flex items-center gap-2.5">
              <Trophy className="h-8 w-8 text-amber-400 animate-bounce" /> Hall of Fame
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              See how you rank against students nationwide. Boost your streaks, complete mock tests, and claim the top spot!
            </p>
          </div>

          {/* Current user mini status panel */}
          {status === "authenticated" && currentUserEntry && (
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-4 shrink-0 w-full md:w-auto">
              <div className="h-10 w-10 rounded-full bg-amber-400 text-slate-900 font-black text-lg flex items-center justify-center shadow-lg border border-amber-300">
                #{currentUserEntry.rank}
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Your Position</p>
                <p className="text-sm font-bold truncate max-w-[150px]">{currentUserEntry.name}</p>
                <p className="text-xs text-blue-100 mt-0.5 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
                  {currentUserEntry.streak} Days Streak
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-sm font-semibold text-slate-500">Compiling leaderboard rankings...</p>
          </div>
        ) : (
          <>
            {/* Top Podium Displays */}
            {podiumList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-6 pb-2">
                {podiumList.map((player) => {
                  const isFirst = player.rank === 1;
                  const isSecond = player.rank === 2;

                  return (
                    <div
                      key={player.id}
                      className={`bg-white rounded-3xl p-6 shadow-md border flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg relative ${
                        isFirst
                          ? "border-amber-400 ring-2 ring-amber-400/20 md:scale-105 z-10 md:-translate-y-4"
                          : isSecond
                          ? "border-slate-200"
                          : "border-orange-200"
                      }`}
                    >
                      {/* Place Badge */}
                      <span
                        className={`absolute -top-3.5 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow ${
                          isFirst
                            ? "bg-amber-400 text-slate-900"
                            : isSecond
                            ? "bg-slate-200 text-slate-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {isFirst ? "🏆 Winner" : isSecond ? "🥈 2nd Place" : "🥉 3rd Place"}
                      </span>

                      {/* Avatar */}
                      <div className="relative mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className={`h-20 w-20 rounded-full object-cover border-4 ${
                            isFirst
                              ? "border-amber-400 shadow-amber-400/10"
                              : isSecond
                              ? "border-slate-300"
                              : "border-orange-300"
                          }`}
                        />
                        <div
                          className={`absolute -bottom-2 -right-2 h-7 w-7 rounded-full text-white text-xs font-black flex items-center justify-center border-2 ${
                            isFirst
                              ? "bg-amber-400 border-white text-slate-900"
                              : isSecond
                              ? "bg-slate-400 border-white"
                              : "bg-orange-500 border-white"
                          }`}
                        >
                          {player.rank}
                        </div>
                      </div>

                      {/* Info */}
                      <h3 className="font-extrabold text-slate-800 mt-4 text-sm truncate max-w-full">
                        {player.name}
                      </h3>
                      <div className="flex flex-wrap justify-center items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3 text-slate-350" /> {player.state}
                        </span>
                        <span>&bull;</span>
                        <span>{player.targetExam}</span>
                      </div>

                      {/* Stats Grid inside podium card */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 w-full text-center">
                        <div>
                          <p className="text-xs font-black text-slate-800">{player.streak}</p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-0.5">
                            <Flame className="h-2.5 w-2.5 text-orange-500 fill-orange-500" /> Streak
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{player.testsAttempted}</p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-0.5">
                            <BookOpen className="h-2.5 w-2.5 text-blue-500" /> Tests
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{player.averageScore}%</p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-0.5">
                            <Award className="h-2.5 w-2.5 text-emerald-500" /> Score
                          </p>
                        </div>
                      </div>

                      {/* points */}
                      <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-3 w-full text-center text-xs font-bold text-slate-700">
                        Score: <span className="text-[#1A56DB] font-extrabold">{player.points} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Filter and search row */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Search bar */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Search Student Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* State Filter */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Filter by State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="block w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="All">All States</option>
                  {statesList.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Exam Filter */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Filter by Target Exam
                </label>
                <select
                  value={selectedTargetExam}
                  onChange={(e) => setSelectedTargetExam(e.target.value)}
                  className="block w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="All">All Exams</option>
                  {examsList.map((exam) => (
                    <option key={exam} value={exam}>
                      {exam}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leaderboard Table Grid */}
            <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 select-none">
                      <th className="p-4 pl-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">
                        Rank
                      </th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Student
                      </th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Target Exam &amp; Location
                      </th>
                      <th
                        onClick={() => handleSort("streak")}
                        className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-slate-100 transition-colors w-24"
                      >
                        <div className="flex items-center justify-center gap-1">
                          🔥 Streak
                          {sortBy === "streak" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("testsAttempted")}
                        className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-slate-100 transition-colors w-28"
                      >
                        <div className="flex items-center justify-center gap-1">
                          📝 Tests Attempted
                          {sortBy === "testsAttempted" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("averageScore")}
                        className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-slate-100 transition-colors w-28"
                      >
                        <div className="flex items-center justify-center gap-1">
                          🎯 Avg Score
                          {sortBy === "averageScore" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("points")}
                        className="p-4 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-slate-100 transition-colors w-28"
                      >
                        <div className="flex items-center justify-center gap-1">
                          🏆 Points
                          {sortBy === "points" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-16 text-center">
                          <HelpCircle className="h-8 w-8 text-slate-350 mx-auto mb-4" />
                          <h3 className="text-sm font-bold text-slate-800">No Student Matches</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Try adjusting your filters or search query terms.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((player) => {
                        const isMe = player.id === session?.user?.id;
                        return (
                          <tr
                            key={player.id}
                            className={`transition-colors ${
                              isMe ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-slate-50/30"
                            }`}
                          >
                            {/* Rank */}
                            <td className="p-4 text-center">
                              <span
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-black ${getRankBadge(
                                  player.rank
                                )}`}
                              >
                                {player.rank}
                              </span>
                            </td>

                            {/* User details */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={player.avatar}
                                  alt={player.name}
                                  className="h-8 w-8 rounded-full object-cover border border-slate-100"
                                />
                                <div>
                                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    {player.name}
                                    {isMe && (
                                      <span className="bg-blue-100 text-[#1A56DB] text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border border-blue-200">
                                        You
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Target Exam + State */}
                            <td className="p-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-black text-slate-600 uppercase">
                                  {player.targetExam}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                                  <MapPin className="h-3 w-3" /> {player.state}
                                </span>
                              </div>
                            </td>

                            {/* Streak */}
                            <td className="p-4 text-center font-black text-xs text-orange-600">
                              <span className="flex items-center justify-center gap-1">
                                <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
                                {player.streak}
                              </span>
                            </td>

                            {/* Attempts */}
                            <td className="p-4 text-center font-bold text-xs text-slate-500">
                              {player.testsAttempted}
                            </td>

                            {/* Average Score */}
                            <td className="p-4 text-center font-bold text-xs text-emerald-600">
                              {player.averageScore}%
                            </td>

                            {/* Points */}
                            <td className="p-4 pr-6 text-center font-black text-xs text-[#1A56DB]">
                              {player.points}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
