"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Loader2,
  X,
  Lock,
  Maximize,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IQuestion {
  _id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
}

interface ISection {
  name: string;
  duration: number; // minutes
  questionCount: number;
  questions: IQuestion[];
  markingScheme: { correct: number; wrong: number };
}

interface IExam {
  _id: string;
  title: string;
  totalDuration: number; // minutes
  sections: ISection[];
}

interface IResponse {
  questionId: string;
  selectedOption: "A" | "B" | "C" | "D" | null;
  isMarkedForReview: boolean;
  timeSpent: number;
}

type QuestionStatus = "unvisited" | "answered" | "marked" | "skipped";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function buildFlatIndex(sections: ISection[]) {
  const flat: { sectionIdx: number; qIdx: number }[] = [];
  sections.forEach((sec, si) => {
    sec.questions.forEach((_, qi) => flat.push({ sectionIdx: si, qIdx: qi }));
  });
  return flat;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LiveExamPage({
  params,
}: {
  params: { id: string; attemptId: string };
}) {
  const { status } = useSession();
  const router = useRouter();
  const { id: examId, attemptId } = params;

  // ── State ──
  const [exam, setExam] = useState<IExam | null>(null);
  const [responses, setResponses] = useState<IResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQIdx, setActiveQIdx] = useState(0); // within section

  // Timers (in seconds)
  const [overallTimer, setOverallTimer] = useState(0);
  const [sectionTimer, setSectionTimer] = useState(0);
  const overallTimerRef = useRef(0);
  const sectionTimerRef = useRef(0);

  // Section blocking: track how long user has spent in each section
  // sectionUnlocked[i] = true means section i's timer has expired and user can move forward
  const [sectionTimerExpired, setSectionTimerExpired] = useState(false);
  const sectionTimerExpiredRef = useRef(false);

  // Anti-cheat
  const [tabWarnings, setTabWarnings] = useState(0);
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const tabWarningsRef = useRef(0);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Flag to suppress visibilitychange events during fullscreen transitions
  const fullscreenTransitionRef = useRef(false);
  // Grace period: don't trigger anti-cheat for first 5 seconds after page load
  const antiCheatReadyRef = useRef(false);

  // Submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Section transition modal — shown when section timer expires
  const [showSectionTransition, setShowSectionTransition] = useState(false);
  const [transitionCountdown, setTransitionCountdown] = useState(5);

  // Question start time for timeSpent tracking
  const questionStartRef = useRef<number>(Date.now());

  // Flat index helper
  const flatIndex = exam ? buildFlatIndex(exam.sections) : [];

  // Offset into responses[] for a given section+q
  const getResponseIdx = useCallback(
    (si: number, qi: number) => {
      if (!exam) return -1;
      let offset = 0;
      for (let i = 0; i < si; i++) offset += exam.sections[i].questions.length;
      return offset + qi;
    },
    [exam]
  );

  // ── Fullscreen utilities ──
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // not supported
    }
  };

  const exitFullscreen = () => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    } catch {
      // not supported
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      // Mark that we're in a fullscreen transition — suppress anti-cheat for 2s
      fullscreenTransitionRef.current = true;
      setTimeout(() => {
        fullscreenTransitionRef.current = false;
      }, 2000);
    };
    document.addEventListener("fullscreenchange", handleFsChange);

    // Only request fullscreen if not already in it (instructions page may have already done it)
    if (!document.fullscreenElement) {
      fullscreenTransitionRef.current = true;
      enterFullscreen().finally(() => {
        setTimeout(() => { fullscreenTransitionRef.current = false; }, 2000);
      });
    } else {
      setIsFullscreen(true);
    }

    // Enable anti-cheat after 5-second grace period (enough time for fullscreen to settle)
    const gracePeriod = setTimeout(() => {
      antiCheatReadyRef.current = true;
    }, 5000);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      clearTimeout(gracePeriod);
    };
  }, []);

  // ── Load exam + attempt ──
  useEffect(() => {
    if (status === "authenticated") loadExamAndAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const loadExamAndAttempt = async () => {
    try {
      const [examRes, attemptRes] = await Promise.all([
        fetch(`/api/exams/${examId}`),
        fetch(`/api/attempts/${attemptId}`),
      ]);
      if (!examRes.ok || !attemptRes.ok) {
        router.push(`/exam/${examId}`);
        return;
      }
      const examData: IExam = await examRes.json();
      const attemptData = await attemptRes.json();

      if (attemptData.status === "submitted") {
        exitFullscreen();
        router.push(`/exam/${examId}/result/${attemptId}`);
        return;
      }

      setExam(examData);
      setResponses(attemptData.responses);
      setActiveSectionIdx(attemptData.currentSection ?? 0);

      // Initialize timers
      const elapsed = Math.floor(
        (Date.now() - new Date(attemptData.startedAt).getTime()) / 1000
      );
      const totalSec = examData.totalDuration * 60;
      const remaining = Math.max(0, totalSec - elapsed);
      overallTimerRef.current = remaining;
      setOverallTimer(remaining);

      const currentSectionIdx = attemptData.currentSection ?? 0;
      const sectionSec = examData.sections[currentSectionIdx].duration * 60;
      // Restore remaining section timer from localStorage if available
      const storedSectionRemaining = sessionStorage.getItem(
        `section_timer_${attemptId}_${currentSectionIdx}`
      );
      let sectionRemaining = sectionSec;
      if (storedSectionRemaining) {
        sectionRemaining = parseInt(storedSectionRemaining, 10);
      }
      sectionTimerRef.current = sectionRemaining;
      setSectionTimer(sectionRemaining);

      // If section time already expired (stored as 0), mark as unlocked
      if (sectionRemaining <= 0) {
        setSectionTimerExpired(true);
        sectionTimerExpiredRef.current = true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Countdown Timers ──
  useEffect(() => {
    if (!exam) return;
    const interval = setInterval(() => {
      // Overall timer
      overallTimerRef.current = Math.max(0, overallTimerRef.current - 1);
      setOverallTimer(overallTimerRef.current);

      // Section timer
      if (sectionTimerRef.current > 0) {
        sectionTimerRef.current = Math.max(0, sectionTimerRef.current - 1);
        setSectionTimer(sectionTimerRef.current);

        // Persist remaining section time for page reloads
        sessionStorage.setItem(
          `section_timer_${attemptId}_${activeSectionIdx}`,
          String(sectionTimerRef.current)
        );

        // Section just expired → unlock next section
        if (sectionTimerRef.current === 0 && !sectionTimerExpiredRef.current) {
          sectionTimerExpiredRef.current = true;
          setSectionTimerExpired(true);
          handleSectionTimerExpired();
        }
      }

      // Overall expired → auto submit
      if (overallTimerRef.current === 0) {
        clearInterval(interval);
        handleAutoSubmit();
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, activeSectionIdx]);

  // ── Anti-Cheat: Tab visibility ──
  useEffect(() => {
    const handleVisibility = () => {
      // Skip if:
      // 1. We're still in the startup grace period (fullscreen settling)
      // 2. A fullscreen transition is in progress (browser briefly hides page)
      if (!antiCheatReadyRef.current) return;
      if (fullscreenTransitionRef.current) return;

      if (document.hidden) {
        tabWarningsRef.current += 1;
        setTabWarnings(tabWarningsRef.current);
        setShowWarningBanner(true);
        if (tabWarningsRef.current >= 3) {
          handleAutoSubmit();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-save (every 15s) ──
  useEffect(() => {
    if (!exam) return;
    const interval = setInterval(() => {
      autoSave();
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, responses, activeSectionIdx]);

  const autoSave = async () => {
    try {
      await fetch(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses, currentSection: activeSectionIdx }),
      });
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  };

  // ── Section Timer Expired ──
  const handleSectionTimerExpired = useCallback(() => {
    if (!exam) return;
    if (activeSectionIdx < exam.sections.length - 1) {
      // Show transition modal with 5s countdown before auto-advancing
      setShowSectionTransition(true);
      setTransitionCountdown(5);
    } else {
      // Last section expired → auto submit
      handleAutoSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, activeSectionIdx]);

  // Section transition countdown
  useEffect(() => {
    if (!showSectionTransition) return;
    if (transitionCountdown <= 0) {
      setShowSectionTransition(false);
      advanceToNextSection();
      return;
    }
    const t = setTimeout(() => setTransitionCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSectionTransition, transitionCountdown]);

  const advanceToNextSection = useCallback(() => {
    if (!exam) return;
    const nextIdx = activeSectionIdx + 1;
    if (nextIdx < exam.sections.length) {
      setActiveSectionIdx(nextIdx);
      setActiveQIdx(0);
      const nextSectionSec = exam.sections[nextIdx].duration * 60;
      sectionTimerRef.current = nextSectionSec;
      setSectionTimer(nextSectionSec);
      // Reset section lock for new section
      setSectionTimerExpired(false);
      sectionTimerExpiredRef.current = false;
      autoSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, activeSectionIdx]);

  // ── Submit ──
  const handleAutoSubmit = useCallback(async () => {
    await autoSave();
    submitExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses, activeSectionIdx]);

  const submitExam = async () => {
    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      await fetch(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses, currentSection: activeSectionIdx }),
      });
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
      });
      if (res.ok) {
        exitFullscreen();
        router.push(`/exam/${examId}/result/${attemptId}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitting(false);
    }
  };

  // ── Track time spent on current question ──
  const recordTimeSpent = useCallback(() => {
    const rIdx = getResponseIdx(activeSectionIdx, activeQIdx);
    if (rIdx === -1) return;
    const spent = Math.floor((Date.now() - questionStartRef.current) / 1000);
    setResponses((prev) => {
      const next = [...prev];
      if (next[rIdx]) {
        next[rIdx] = { ...next[rIdx], timeSpent: (next[rIdx].timeSpent || 0) + spent };
      }
      return next;
    });
    questionStartRef.current = Date.now();
  }, [activeSectionIdx, activeQIdx, getResponseIdx]);

  // ── Option selection ──
  const selectOption = (opt: "A" | "B" | "C" | "D") => {
    const rIdx = getResponseIdx(activeSectionIdx, activeQIdx);
    if (rIdx === -1) return;
    setResponses((prev) => {
      const next = [...prev];
      next[rIdx] = { ...next[rIdx], selectedOption: opt };
      return next;
    });
  };

  const clearResponse = () => {
    const rIdx = getResponseIdx(activeSectionIdx, activeQIdx);
    if (rIdx === -1) return;
    setResponses((prev) => {
      const next = [...prev];
      next[rIdx] = { ...next[rIdx], selectedOption: null };
      return next;
    });
  };

  const toggleMarkForReview = () => {
    const rIdx = getResponseIdx(activeSectionIdx, activeQIdx);
    if (rIdx === -1) return;
    setResponses((prev) => {
      const next = [...prev];
      next[rIdx] = {
        ...next[rIdx],
        isMarkedForReview: !next[rIdx].isMarkedForReview,
      };
      return next;
    });
  };

  // ── Navigation ──
  // Section is "navigable" only if:
  //  - It's the current active section, OR
  //  - It's a previous section (already completed, locked for editing - not allowed)
  //  - Future sections are blocked until sectionTimer expires
  const navigateTo = (si: number, qi: number) => {
    // Prevent going to previous sections (locked after leaving)
    if (si < activeSectionIdx) return;
    // Prevent jumping to FUTURE sections before timer expires
    if (si > activeSectionIdx) return;
    recordTimeSpent();
    setActiveSectionIdx(si);
    setActiveQIdx(qi);
    questionStartRef.current = Date.now();
  };

  const goNext = async () => {
    if (!exam) return;
    recordTimeSpent();
    const section = exam.sections[activeSectionIdx];
    if (activeQIdx < section.questions.length - 1) {
      // Move to next question in same section
      setActiveQIdx(activeQIdx + 1);
    } else if (activeSectionIdx < exam.sections.length - 1) {
      // At last question of section → only advance if timer has expired
      if (sectionTimerExpired) {
        advanceToNextSection();
        await autoSave();
      }
      // If timer hasn't expired, do nothing (user must wait)
    }
    questionStartRef.current = Date.now();
  };

  const goPrev = () => {
    if (!exam) return;
    recordTimeSpent();
    if (activeQIdx > 0) {
      setActiveQIdx(activeQIdx - 1);
    }
    questionStartRef.current = Date.now();
  };

  // ── Question Status Color ──
  const getQStatus = (si: number, qi: number): QuestionStatus => {
    const rIdx = getResponseIdx(si, qi);
    if (rIdx === -1) return "unvisited";
    const r = responses[rIdx];
    if (!r) return "unvisited";
    if (r.isMarkedForReview) return "marked";
    if (r.selectedOption) return "answered";
    const currentFlat = flatIndex.findIndex(
      (f) => f.sectionIdx === activeSectionIdx && f.qIdx === activeQIdx
    );
    const thisFlat = flatIndex.findIndex(
      (f) => f.sectionIdx === si && f.qIdx === qi
    );
    if (thisFlat < currentFlat) return "skipped";
    return "unvisited";
  };

  const statusColor: Record<QuestionStatus, string> = {
    unvisited: "bg-slate-100 text-slate-600 border border-slate-200",
    answered: "bg-emerald-500 text-white border border-emerald-600",
    marked: "bg-amber-400 text-white border border-amber-500",
    skipped: "bg-red-100 text-red-700 border border-red-200",
  };

  // ── Derived state ──
  const isLastQuestion = exam ? activeQIdx === exam.sections[activeSectionIdx].questions.length - 1 : false;
  const isLastSection = exam ? activeSectionIdx === exam.sections.length - 1 : false;
  // Can only move to next section if timer expired and not already on last section
  const canAdvanceSection = sectionTimerExpired && !isLastSection;

  // ── Loading / Auth ──
  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
          <p className="font-medium text-slate-300">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <p className="mb-4 text-red-400">Session expired. Please log in again.</p>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700 transition"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  const section = exam.sections[activeSectionIdx];
  const question = section?.questions[activeQIdx];
  const rIdx = getResponseIdx(activeSectionIdx, activeQIdx);
  const currentResponse = responses[rIdx] ?? null;

  // Stats for palette legend
  const answeredCount = responses.filter((r) => r?.selectedOption).length;
  const markedCount = responses.filter((r) => r?.isMarkedForReview).length;

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-white overflow-hidden font-sans select-none">

      {/* ── Section Timer Expired Transition Modal ── */}
      {showSectionTransition && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
              <Clock className="h-7 w-7 text-amber-400" />
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2 font-heading">
              Section Time&apos;s Up!
            </h2>
            <p className="text-sm text-slate-400 mb-1">
              Moving to next section in
            </p>
            <p className="text-5xl font-black text-amber-400 my-4">{transitionCountdown}</p>
            <p className="text-xs text-slate-500">You will be automatically moved to the next section.</p>
            <button
              onClick={() => { setShowSectionTransition(false); advanceToNextSection(); }}
              className="mt-6 w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-sm font-bold text-slate-900 transition-colors"
            >
              Proceed Now
            </button>
          </div>
        </div>
      )}

      {/* ── Top Bar ── */}
      <header className="flex-shrink-0 bg-slate-800 border-b border-slate-700 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-300 font-heading truncate max-w-xs">
            {exam.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Section Timer */}
          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
              sectionTimer < 120 && sectionTimer > 0
                ? "bg-red-600 text-white animate-pulse"
                : sectionTimerExpired
                ? "bg-emerald-700 text-white"
                : "bg-slate-700 text-slate-200"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="text-xs text-slate-300 mr-0.5">Section:</span>
            {sectionTimerExpired ? "Done ✓" : formatTime(sectionTimer)}
          </div>
          {/* Overall Timer */}
          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
              overallTimer < 300
                ? "bg-red-600 text-white animate-pulse"
                : "bg-blue-700 text-white"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="text-xs mr-0.5 opacity-70">Total:</span>
            {formatTime(overallTimer)}
          </div>
          {/* Fullscreen re-enter button */}
          {!isFullscreen && (
            <button
              onClick={enterFullscreen}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-slate-900 transition-colors"
              title="Re-enter fullscreen"
            >
              <Maximize className="h-4 w-4" />
              Fullscreen
            </button>
          )}
          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-bold transition-colors"
          >
            <Send className="h-4 w-4" />
            Submit
          </button>
        </div>
      </header>

      {/* ── Anti-Cheat Warning Banner ── */}
      {showWarningBanner && (
        <div className="flex-shrink-0 bg-amber-500 text-slate-900 px-4 py-2 flex items-center justify-between text-sm font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Warning {tabWarnings}/3: Tab switching detected! After 3 warnings, your test will be auto-submitted.
          </div>
          <button onClick={() => setShowWarningBanner(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Section Tabs ── */}
      <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 px-4 flex items-center gap-1 overflow-x-auto py-2">
        {exam.sections.map((sec, si) => {
          const isPrev = si < activeSectionIdx;   // completed, locked
          const isNext = si > activeSectionIdx;   // future, blocked until timer expires
          const isActive = si === activeSectionIdx;
          // Future sections are unlocked only after the current section timer expires AND they are the immediate next
          const canGoToNext = si === activeSectionIdx + 1 && sectionTimerExpired;
          const locked = isPrev || (isNext && !canGoToNext);

          return (
            <button
              key={si}
              onClick={() => {
                if (locked) return;
                if (si === activeSectionIdx) return;
                // Can only move to next section (si === activeSectionIdx + 1) when timer expired
                if (canGoToNext) {
                  advanceToNextSection();
                }
              }}
              disabled={locked}
              className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-bold transition-all flex items-center gap-1 ${
                isActive
                  ? "bg-blue-600 text-white"
                  : isPrev
                  ? "bg-slate-700/40 text-slate-500 cursor-not-allowed"
                  : isNext && !canGoToNext
                  ? "bg-slate-700/40 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-700 text-white hover:bg-emerald-600"
              }`}
            >
              {isPrev && <Lock className="h-3 w-3" />}
              {isNext && !canGoToNext && <Lock className="h-3 w-3" />}
              {sec.name}
              {isActive && !sectionTimerExpired && (
                <span className="ml-1 text-[10px] text-blue-300">({formatTime(sectionTimer)})</span>
              )}
              {isActive && sectionTimerExpired && (
                <span className="ml-1 text-[10px] text-emerald-300">✓ Time Done</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Section Blocking Notice ── */}
      {!sectionTimerExpired && (
        <div className="flex-shrink-0 bg-blue-900/40 border-b border-blue-700/40 px-4 py-2 flex items-center gap-2 text-xs text-blue-300 font-semibold">
          <Lock className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            You must complete this section&apos;s time ({formatTime(sectionTimer)} remaining) before you can advance to the next section.
          </span>
        </div>
      )}
      {sectionTimerExpired && !isLastSection && (
        <div className="flex-shrink-0 bg-emerald-900/30 border-b border-emerald-700/40 px-4 py-2 flex items-center gap-2 text-xs text-emerald-300 font-semibold">
          <span>✓ Section time completed! You may now move to the next section using the tab above or &quot;Save &amp; Next&quot; on the last question.</span>
        </div>
      )}

      {/* ── Main Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Question Panel (left) ── */}
        <main className="flex flex-1 flex-col overflow-y-auto bg-slate-900 p-5">
          {/* Question Header */}
          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {section.name} · Question {activeQIdx + 1} of{" "}
              {section.questions.length}
            </span>
            {currentResponse?.isMarkedForReview && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-bold text-amber-400">
                <Flag className="h-3 w-3" /> Marked for Review
              </span>
            )}
          </div>

          {/* Question Text */}
          <div className="mb-6 rounded-xl bg-slate-800 border border-slate-700 p-5">
            <p className="text-base font-medium text-slate-100 leading-relaxed">
              {question?.question ?? "Question not found."}
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3 mb-8">
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const optText =
                opt === "A"
                  ? question?.optionA
                  : opt === "B"
                  ? question?.optionB
                  : opt === "C"
                  ? question?.optionC
                  : question?.optionD;
              const isSelected = currentResponse?.selectedOption === opt;
              return (
                <button
                  key={opt}
                  onClick={() => selectOption(opt)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-600/20 text-blue-300 ring-1 ring-blue-500"
                      : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-slate-700 text-slate-400 border-slate-600"
                    }`}
                  >
                    {opt}
                  </span>
                  <span>{optText}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
            <div className="flex gap-2">
              <button
                onClick={clearResponse}
                className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-slate-400 hover:border-slate-400 hover:text-slate-200 transition-colors"
              >
                Clear Response
              </button>
              <button
                onClick={toggleMarkForReview}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                  currentResponse?.isMarkedForReview
                    ? "border-amber-500 bg-amber-500/20 text-amber-400"
                    : "border-slate-600 text-slate-400 hover:border-amber-500 hover:text-amber-400"
                }`}
              >
                <Flag className="h-3.5 w-3.5" />
                {currentResponse?.isMarkedForReview ? "Unmark" : "Mark for Review"}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={goPrev}
                disabled={activeQIdx === 0}
                className="flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-slate-400 hover:border-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                onClick={goNext}
                disabled={(isLastQuestion && isLastSection) || (isLastQuestion && !isLastSection && !canAdvanceSection)}
                title={
                  isLastQuestion && !isLastSection && !canAdvanceSection
                    ? `Wait ${formatTime(sectionTimer)} for section timer to complete`
                    : undefined
                }
                className={`flex items-center gap-1 rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isLastQuestion && !isLastSection && !canAdvanceSection
                    ? "bg-slate-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLastQuestion && !isLastSection && !canAdvanceSection ? (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    Locked ({formatTime(sectionTimer)})
                  </>
                ) : (
                  <>
                    Save &amp; Next <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </main>

        {/* ── Navigation Palette (right sidebar) ── */}
        <aside className="w-64 flex-shrink-0 overflow-y-auto bg-slate-800 border-l border-slate-700 p-4 flex flex-col gap-4">
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded bg-emerald-500 flex-shrink-0" />
              <span className="text-slate-400">Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded bg-amber-400 flex-shrink-0" />
              <span className="text-slate-400">Marked ({markedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded bg-red-100 border border-red-200 flex-shrink-0" />
              <span className="text-slate-400">Skipped</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded bg-slate-100 border border-slate-200 flex-shrink-0" />
              <span className="text-slate-400">Not Visited</span>
            </div>
          </div>

          {/* Question Grid per section */}
          {exam.sections.map((sec, si) => {
            const isPrevSection = si < activeSectionIdx;
            const isFutureSection = si > activeSectionIdx;
            const isActiveSection = si === activeSectionIdx;
            return (
              <div key={si}>
                <p
                  className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${
                    isActiveSection ? "text-blue-400" : isPrevSection ? "text-slate-600" : "text-slate-500"
                  }`}
                >
                  {isPrevSection && <Lock className="h-3 w-3" />}
                  {isFutureSection && <Lock className="h-3 w-3" />}
                  {sec.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sec.questions.map((_, qi) => {
                    const isCurrentQ = si === activeSectionIdx && qi === activeQIdx;
                    const qNum =
                      exam.sections
                        .slice(0, si)
                        .reduce((a, s) => a + s.questions.length, 0) +
                      qi +
                      1;
                    const qStatus = getQStatus(si, qi);
                    const lockedQ = isPrevSection || isFutureSection;
                    return (
                      <button
                        key={qi}
                        onClick={() => !lockedQ && navigateTo(si, qi)}
                        disabled={lockedQ}
                        className={`h-8 w-8 rounded text-[11px] font-bold transition-all ${
                          isCurrentQ
                            ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-800 scale-110"
                            : ""
                        } ${
                          lockedQ
                            ? "opacity-30 cursor-not-allowed bg-slate-700 text-slate-500"
                            : statusColor[qStatus]
                        }`}
                      >
                        {qNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Submit Button in sidebar */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="mt-auto w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-bold transition-colors"
          >
            <Send className="h-4 w-4" /> Submit Test
          </button>
        </aside>
      </div>

      {/* ── Submit Confirmation Modal ── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-emerald-500/20 p-2">
                <Send className="h-6 w-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-extrabold font-heading text-white">
                Submit Test?
              </h2>
            </div>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              You are about to submit your test. This action is{" "}
              <strong className="text-white">irreversible</strong>. Your current
              responses will be saved and scored immediately.
            </p>

            {/* Quick Summary */}
            <div className="grid grid-cols-3 gap-2 mb-6 text-center">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                <p className="text-lg font-black text-emerald-400">{answeredCount}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Answered</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <p className="text-lg font-black text-amber-400">{markedCount}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Marked</p>
              </div>
              <div className="rounded-lg bg-slate-700/50 border border-slate-600 p-3">
                <p className="text-lg font-black text-slate-300">
                  {responses.length - answeredCount - markedCount}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Skipped</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="flex-1 rounded-xl border border-slate-600 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={submitExam}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-bold text-white transition-colors disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Confirm Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
