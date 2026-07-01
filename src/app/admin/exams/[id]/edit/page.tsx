"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Search,
  CheckCircle,
  Loader2,
  Save,
  AlertTriangle,
  Tag,
  Clock,
} from "lucide-react";
import { useAlert } from "@/components/ui/AlertProvider";

interface QuestionItem {
  _id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  examCategory: string;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

interface SectionConfig {
  name: string;
  subject: string;
  duration: number; // minutes
  questionCount: number;
  markingScheme: {
    correct: number;
    wrong: number;
  };
  questions: string[]; // question ids
}

export default function EditExamWizard() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const { toast } = useAlert();

  // Loading states
  const [loadingExam, setLoadingExam] = useState(true);

  // Wizard state
  const [step, setStep] = useState(1);

  // Step 1: Basic Info
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [totalDuration, setTotalDuration] = useState<number>(60);
  const [instructions, setInstructions] = useState("");
  const resolvedCategory = customCategory.trim() || category;

  // Step 2: Setup Sections
  const [sections, setSections] = useState<SectionConfig[]>([]);

  // Step 3: Question Assignment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);

  // Question Pool and Filters for Step 3 Modal
  const [questionsPool, setQuestionsPool] = useState<QuestionItem[]>([]);
  const [distinctSubjects, setDistinctSubjects] = useState<string[]>([]);
  const [distinctTopics, setDistinctTopics] = useState<string[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);

  // Modal filters
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterTopic, setFilterTopic] = useState("All");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Pending questions selection in Modal
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Page level saving state
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch single exam details to pre-load editor state
  const loadExamDetails = async () => {
    setLoadingExam(true);
    try {
      const res = await fetch(`/api/exams/${examId}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title || "");
        setTotalDuration(data.totalDuration || 60);
        setInstructions(data.instructions || "");

        const loadedCat = data.category || "";
        try {
          const metaRes = await fetch("/api/admin/questions?mode=meta");
          if (metaRes.ok) {
            const metaData = await metaRes.json();
            const cats = metaData.distinctCategories || [];
            setDbCategories(cats);
            if (cats.includes(loadedCat) || ["SSC", "Railway", "Banking", "PSC"].includes(loadedCat)) {
              setCategory(loadedCat);
              setCustomCategory("");
            } else {
              setCategory("");
              setCustomCategory(loadedCat);
            }
          } else {
            setCategory(loadedCat);
          }
        } catch {
          setCategory(loadedCat);
        }

        // Convert backend populated questions schema into simple configs for state
        const sectionConfigs: SectionConfig[] = (data.sections || []).map((sec: { name: string; duration: number; questionCount: number; markingScheme?: { correct: number; wrong: number }; questions: (string | { _id: string })[] }) => ({
          name: sec.name || "",
          subject: sec.name || "",
          duration: sec.duration || 15,
          questionCount: sec.questionCount || 0,
          markingScheme: {
            correct: sec.markingScheme?.correct || 2,
            wrong: sec.markingScheme?.wrong || -0.5,
          },
          // extract ids from populated question list if they are populated, or fallback to IDs directly
          questions: (sec.questions || []).map((q: string | { _id: string }) => (typeof q === "object" ? q._id : q)),
        }));
        setSections(sectionConfigs);
      } else {
        setErrorMsg("Failed to retrieve exam details.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error fetching exam details.");
    } finally {
      setLoadingExam(false);
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    if (examId) {
      loadExamDetails();
    } else {
      setLoadingMeta(true);
      fetch("/api/admin/questions?mode=meta")
        .then((r) => r.json())
        .then((data) => {
          setDbCategories(data.distinctCategories || []);
        })
        .catch(console.error)
        .finally(() => setLoadingMeta(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // Sync totalDuration dynamically when section durations change
  useEffect(() => {
    const calculatedSum = sections.reduce((sum, sec) => sum + (sec.duration || 0), 0);
    setTotalDuration(calculatedSum || 60);
  }, [sections]);

  // Fetch question pool — filtered only by subject (questions have no exam category)
  const loadQuestionPool = async (subjectFilter?: string) => {
    setLoadingPool(true);
    try {
      const params = new URLSearchParams();
      if (subjectFilter && subjectFilter !== "All") params.set("subject", subjectFilter);
      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestionsPool(data.questions || []);
        setDistinctSubjects(data.distinctSubjects || []);
        setDistinctTopics(data.distinctTopics || []);
      }
    } catch (err) {
      console.error("Failed to load questions pool:", err);
    } finally {
      setLoadingPool(false);
    }
  };

  useEffect(() => {
    loadQuestionPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Step 2 Actions (Section configuration) ---
  const handleAddSection = () => {
    setSections((prev) => [
      ...prev,
      {
        name: "",
        subject: "",
        duration: 15,
        questionCount: 5,
        markingScheme: { correct: 2, wrong: -0.5 },
        questions: [],
      },
    ]);
  };

  const handleRemoveSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSectionFieldChange = (
    index: number,
    field: keyof SectionConfig,
    value: SectionConfig[keyof SectionConfig]
  ) => {
    setSections((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      if (field === "subject") {
        next[index].name = value as string;
      }
      return next;
    });
  };

  const handleSectionMarkingChange = (
    index: number,
    type: "correct" | "wrong",
    value: number
  ) => {
    setSections((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        markingScheme: {
          ...next[index].markingScheme,
          [type]: value,
        },
      };
      return next;
    });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    setSections((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[swapIndex];
      next[swapIndex] = temp;
      return next;
    });
  };

  // --- Step 3 Actions (Question Selection) ---
  const openPickModal = async (sectionIdx: number) => {
    setActiveSectionIndex(sectionIdx);
    setSelectedQuestionIds([...sections[sectionIdx].questions]);

    // Auto-pre-filter by section's subject
    const sectionSubject = sections[sectionIdx].subject || "All";
    setFilterSubject(sectionSubject);
    setFilterTopic("All");
    setFilterDifficulty("All");
    setSearchQuery("");

    // Load questions scoped to section subject
    await loadQuestionPool(sectionSubject !== "All" ? sectionSubject : undefined);
    setIsModalOpen(true);
  };

  const applySelectedQuestions = () => {
    if (activeSectionIndex === null) return;
    const targetQCount = sections[activeSectionIndex].questionCount;

    if (selectedQuestionIds.length > targetQCount) {
      toast(
        "warning",
        `You selected ${selectedQuestionIds.length} questions but the target was ${targetQCount}. Question count adjusted automatically.`,
        "Count Adjusted"
      );
      handleSectionFieldChange(activeSectionIndex, "questionCount", selectedQuestionIds.length);
    }

    handleSectionFieldChange(activeSectionIndex, "questions", selectedQuestionIds);
    setIsModalOpen(false);
    setActiveSectionIndex(null);
  };

  const handleAutoRandomize = async (sectionIdx: number) => {
    const sec = sections[sectionIdx];
    const targetCount = sec.questionCount;

    // Fetch questions filtered only by this section's subject (no exam category filter)
    let pool: QuestionItem[] = [];

    try {
      const params = new URLSearchParams();
      if (sec.subject && sec.subject !== "All") params.set("subject", sec.subject);
      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        pool = data.questions || [];
      }
    } catch {
      // Fallback: filter the already-loaded pool by subject on client side
      pool = sec.subject
        ? questionsPool.filter((q) => q.subject === sec.subject)
        : questionsPool;
    }

    if (pool.length === 0) {
      toast(
        "error",
        `No questions found for subject "${sec.subject || "Any"}". Please upload questions tagged with this subject first.`,
        "No Questions Found"
      );
      return;
    }

    const randomized = [...pool].sort(() => 0.5 - Math.random());
    const selectedIds = randomized.slice(0, targetCount).map((q) => q._id);

    handleSectionFieldChange(sectionIdx, "questions", selectedIds);
    toast(
      "success",
      `Auto-assigned ${selectedIds.length} random questions matching subject "${sec.subject}" to this section.`,
      "Questions Randomized"
    );
  };

  const getFilteredModalQuestions = () => {
    return questionsPool.filter((q) => {
      if (filterSubject !== "All" && q.subject !== filterSubject) return false;
      if (filterTopic !== "All" && q.topic !== filterTopic) return false;
      if (filterDifficulty !== "All" && q.difficulty !== filterDifficulty) return false;
      if (searchQuery.trim()) {
        const text = q.question.toLowerCase();
        const search = searchQuery.toLowerCase().trim();
        if (!text.includes(search)) return false;
      }
      return true;
    });
  };

  const handleToggleQuestionSelect = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  // --- Step 4 Actions (Submit layout) ---
  const handleSaveExam = async (publishStatus: "draft" | "upcoming" | "live") => {
    setErrorMsg("");
    setSuccessMsg("");

    // Validate that questions are filled for all sections (only for live or upcoming status)
    if (publishStatus === "live" || publishStatus === "upcoming") {
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        if (sec.questions.length === 0) {
          setErrorMsg(`Section "${sec.name}" has no assigned questions. Assign questions in Step 3 before publishing.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category: resolvedCategory,
          totalDuration,
          sections,
          instructions,
          status: publishStatus,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Exam successfully updated!`);
        setTimeout(() => {
          router.push("/admin/exams");
        }, 1500);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to update mock test.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error saving the exam.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingExam) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center space-y-3 font-sans">
        <Loader2 className="h-10 w-10 text-[#1A56DB] animate-spin" />
        <p className="text-xs text-slate-400 font-bold">Loading exam editor data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-20">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#1A56DB] text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/exams"
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="text-lg font-extrabold font-heading tracking-tight">
              Edit Mock Exam Layout
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                  step === s
                    ? "bg-white text-[#1A56DB] border-white"
                    : step > s
                    ? "bg-blue-700 text-blue-200 border-blue-400"
                    : "bg-blue-900 text-blue-400 border-blue-800"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
        {/* Error/Success alerts */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: Basic details */}
        {step === 1 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Step 1: General Information
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set the foundational attributes for the mock test template.
              </p>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SSC CGL Tier-1 Full Length Mock #05"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold focus:border-[#1A56DB] outline-none transition-all placeholder-slate-400"
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Exam Category
                  </label>
                  {loadingMeta ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading categories...
                    </div>
                  ) : (
                    <>
                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setCustomCategory("");
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1A56DB] transition-all"
                      >
                        <option value="">— Select existing category —</option>
                        {dbCategories.length > 0 ? (
                          dbCategories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))
                        ) : (
                          <>
                            <option value="SSC">SSC (CGL, CHSL, MTS)</option>
                            <option value="Railway">Railway (RRB NTPC, ALP)</option>
                            <option value="Banking">Banking (IBPS, SBI)</option>
                            <option value="PSC">State PSC</option>
                          </>
                        )}
                        <option value="">— Or type a new one below —</option>
                      </select>
                      
                      {resolvedCategory && (
                        <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                          ✓ Using: <span className="uppercase">{resolvedCategory}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Duration Sum Preview */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Total Time (Minutes)
                  </label>
                  <div className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-black text-slate-500">
                    {totalDuration} mins <span className="text-[10px] font-normal text-slate-400 ml-1">(Sum of section times)</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Exam Guidelines & Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter the rules shown to students prior to start..."
                  className="w-full h-32 rounded-xl border border-slate-200 p-4 text-xs font-medium focus:border-[#1A56DB] outline-none transition-all placeholder-slate-400"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => handleSaveExam("draft")}
                disabled={saving}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Draft
              </button>
              <button
                onClick={() => {
                  if (!title.trim()) {
                    setErrorMsg("Please set an exam title.");
                    return;
                  }
                  setErrorMsg("");
                  setStep(2);
                }}
                className="px-6 py-3 bg-[#1A56DB] hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                Configure Sections
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Configure Sections */}
        {step === 2 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                  Step 2: Define Sections Structure
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Specify timelines, counts, and scoring offsets per section.
                </p>
              </div>
              <button
                onClick={handleAddSection}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-[#1A56DB] rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Section
              </button>
            </div>

            {sections.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl max-w-sm mx-auto space-y-2">
                <p className="text-xs font-bold text-slate-600">No Sections Added</p>
                <p className="text-[11px] text-slate-400">Click the button above to add your first exam section.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-150 rounded-xl p-5 bg-slate-50/20 relative space-y-4"
                  >
                    {/* Section Action Controls */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                        Section #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        {/* Order adjustment */}
                        <button
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 hover:bg-white rounded border border-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === sections.length - 1}
                          className="p-1 hover:bg-white rounded border border-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleRemoveSection(idx)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded border border-slate-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Subject — links to question subject for filtering and acts as Section Name */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <Tag className="h-3 w-3 text-blue-500" />
                          Subject Tag (Section Name)
                        </label>
                        {distinctSubjects.length > 0 ? (
                          <select
                            value={section.subject}
                            onChange={(e) => handleSectionFieldChange(idx, "subject", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1A56DB]"
                          >
                            <option value="">— Select subject —</option>
                            {distinctSubjects.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={section.subject}
                            onChange={(e) => handleSectionFieldChange(idx, "subject", e.target.value)}
                            placeholder="e.g. Maths, Reasoning..."
                            className="w-full rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:border-[#1A56DB] outline-none placeholder-slate-400"
                          />
                        )}
                        <p className="text-[9px] text-slate-400 leading-tight">
                          This subject will act as the section name, and only questions matching this subject will be selected.
                        </p>
                      </div>

                      {/* Duration */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Duration (Minutes)
                        </label>
                        <input
                          type="number"
                          value={section.duration}
                          onChange={(e) => handleSectionFieldChange(idx, "duration", Math.max(1, parseInt(e.target.value) || 0))}
                          required
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-[#1A56DB] outline-none"
                        />
                      </div>

                      {/* Target Count */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Target Question Count
                        </label>
                        <input
                          type="number"
                          value={section.questionCount}
                          onChange={(e) => handleSectionFieldChange(idx, "questionCount", Math.max(1, parseInt(e.target.value) || 0))}
                          required
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-[#1A56DB] outline-none"
                        />
                      </div>

                      {/* Scoring Scheme */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Marking Scheme (+ / -)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-emerald-600 shrink-0">Correct:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={section.markingScheme.correct}
                              onChange={(e) => handleSectionMarkingChange(idx, "correct", parseFloat(e.target.value) || 0)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold focus:border-[#1A56DB] outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-red-500 shrink-0">Wrong:</span>
                            <input
                              type="number"
                              step="0.01"
                              value={section.markingScheme.wrong}
                              onChange={(e) => handleSectionMarkingChange(idx, "wrong", parseFloat(e.target.value) || 0)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold focus:border-[#1A56DB] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Back
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveExam("draft")}
                  disabled={saving}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Draft
                </button>
                <button
                  onClick={() => {
                    if (sections.length === 0) {
                      setErrorMsg("Please add at least one section.");
                      return;
                    }
                    for (let i = 0; i < sections.length; i++) {
                      if (!sections[i].subject.trim()) {
                        setErrorMsg(`Section #${i + 1} does not have a subject specified.`);
                        return;
                      }
                    }
                    setErrorMsg("");
                    setStep(3);
                  }}
                  className="px-6 py-3 bg-[#1A56DB] hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  Assign Questions
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Assign Questions */}
        {step === 3 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Step 3: Question Assignment
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Link questions from the bank or auto-fill them randomly matching section rules.
              </p>
            </div>

            <div className="space-y-4">
              {sections.map((section, idx) => {
                const assignedCount = section.questions.length;
                const isTargetMet = assignedCount === section.questionCount;

                return (
                  <div
                    key={idx}
                    className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      isTargetMet ? "bg-emerald-50/20 border-emerald-150" : "bg-slate-50/20 border-slate-200"
                    }`}
                  >
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        {section.name}
                        {isTargetMet ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <CheckCircle className="h-3 w-3" /> Fully Filled
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded-full">
                            Pending ({assignedCount} / {section.questionCount})
                          </span>
                        )}
                      </h3>
                      <p className="text-slate-400 text-[11px] mt-1">
                        Time: {section.duration} mins | Subject: {section.subject || "Any"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        onClick={() => openPickModal(idx)}
                        className="px-4 py-2 bg-white border border-slate-200 hover:border-[#1A56DB] text-slate-700 hover:text-[#1A56DB] rounded-xl text-xs font-bold transition-all"
                      >
                        Pick Questions ({assignedCount})
                      </button>

                      <button
                        onClick={() => handleAutoRandomize(idx)}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#1A56DB] rounded-xl text-xs font-black transition-all flex items-center gap-1"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        Auto-Randomize
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Back
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveExam("draft")}
                  disabled={saving}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Draft
                </button>
                <button
                  onClick={() => {
                    setErrorMsg("");
                    setStep(4);
                  }}
                  className="px-6 py-3 bg-[#1A56DB] hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  Review & Publish
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review and Publish */}
        {step === 4 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Step 4: Final Review
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify the mock exam properties before updating it.
              </p>
            </div>

            {/* Config summary layout */}
            <div className="space-y-6 border border-slate-150 rounded-xl p-5 bg-slate-50/20">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mock Title</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Category</p>
                  <p className="text-xs font-black uppercase text-slate-700 mt-1">{category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Time Sum</p>
                  <p className="text-xs font-black text-slate-700 mt-1">{totalDuration} minutes</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Sections Structure</p>
                <div className="space-y-3">
                  {sections.map((sec, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-lg text-xs">
                      <div>
                        <p className="font-bold text-slate-700">{sec.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Duration: {sec.duration} mins | Target Count: {sec.questionCount}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-800">{sec.questions.length} / {sec.questionCount} questions set</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Marking Scheme: +{sec.markingScheme.correct}/{sec.markingScheme.wrong}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Back
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSaveExam("draft")}
                  disabled={saving}
                  className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSaveExam("upcoming")}
                  disabled={saving}
                  className="px-4 py-3 border border-amber-200 bg-amber-50 hover:bg-amber-100/50 text-amber-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                  Set as Upcoming
                </button>
                <button
                  onClick={() => handleSaveExam("live")}
                  disabled={saving}
                  className="px-5 py-3 bg-[#1A56DB] hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Update Live
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* STEP 3 PICK QUESTIONS MODAL */}
      {isModalOpen && activeSectionIndex !== null && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black font-heading">
                  Pick Questions for section: &quot;{sections[activeSectionIndex].name}&quot;
                </h3>
                <p className="text-[10px] text-blue-100 mt-0.5">
                  Select up to {sections[activeSectionIndex].questionCount} questions from the {category} pool. Currently selected: {selectedQuestionIds.length}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setActiveSectionIndex(null);
                }}
                className="text-blue-100 hover:text-white text-xs font-bold p-1"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-4 border-b border-slate-150 bg-slate-50 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
              {/* Subject */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Subject</label>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none"
                >
                  <option value="All">All Subjects</option>
                  {distinctSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Topic</label>
                <select
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none"
                >
                  <option value="All">All Topics</option>
                  {distinctTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Difficulty</label>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none"
                >
                  <option value="All">All Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Keyword Search */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search keywords..."
                    className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-[11px] font-medium outline-none focus:border-[#1A56DB]"
                  />
                </div>
              </div>
            </div>

            {/* Modal Questions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 min-h-[300px]">
              {loadingPool ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-2">
                  <Loader2 className="h-8 w-8 text-[#1A56DB] animate-spin" />
                  <p className="text-[11px] text-slate-400">Loading question bank...</p>
                </div>
              ) : getFilteredModalQuestions().length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs">
                  No matching questions found in the database.
                </div>
              ) : (
                getFilteredModalQuestions().map((q) => {
                  const isChecked = selectedQuestionIds.includes(q._id);

                  return (
                    <div
                      key={q._id}
                      onClick={() => handleToggleQuestionSelect(q._id)}
                      className={`border rounded-xl p-3.5 flex items-start gap-3.5 cursor-pointer bg-white transition-all hover:border-[#1A56DB] ${
                        isChecked ? "border-[#1A56DB] ring-1 ring-[#1A56DB]/20" : "border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 shrink-0 rounded border-slate-300 text-[#1A56DB] focus:ring-[#1A56DB]"
                      />
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200/50">
                            {q.subject}
                          </span>
                          <span className="text-[8px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                            {q.topic}
                          </span>
                          <span
                            className={`text-[8px] font-bold border px-2 py-0.5 rounded ${
                              q.difficulty === "easy"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : q.difficulty === "medium"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-red-50 text-red-700 border-red-100"
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                          {q.question}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-medium">
                          <div>A) {q.optionA}</div>
                          <div>B) {q.optionB}</div>
                          <div>C) {q.optionC}</div>
                          <div>D) {q.optionD}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-150 flex items-center justify-between bg-slate-50">
              <span className="text-[11px] font-bold text-slate-500">
                Selected: {selectedQuestionIds.length} of {sections[activeSectionIndex].questionCount} target questions
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setActiveSectionIndex(null);
                  }}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={applySelectedQuestions}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-sm"
                >
                  Confirm & Assign Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
