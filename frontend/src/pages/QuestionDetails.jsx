import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Printer,
  Sparkles,
  BookOpen,
  Layers,
  AlertCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import {
  fetchQuestionById,
  fetchRelatedQuestions,
  fetchSubjects,
  fetchTopics,
  formatQuestionType,
  formatDifficulty,
} from "../services/questionApi";
import { useBookmarks } from "../hooks/useBookmarks";
import { useProgress } from "../hooks/useProgress";
import { useGroq } from "../hooks/useGroq";

const DIFFICULTY_PILL_CLASSES = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function QuestionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [retryTick, setRetryTick] = useState(0);
  const [detailState, setDetailState] = useState({
    requestKey: "",
    question: null,
    related: [],
    subjects: [],
    topics: [],
    error: "",
    statusCode: null,
  });

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("solution"); // "solution" | "ai"

  // Groq AI Coach integration
  const { chat } = useGroq();
  const [aiState, setAiState] = useState({
    id: "",
    answer: "",
    loading: false,
    error: "",
  });

  const { bookmarks, toggle: toggleBookmark } = useBookmarks();
  const { completed, toggleCompleted } = useProgress();

  const requestKey = `${id || ""}:${retryTick}`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [id]);

  useEffect(() => {
    if (!id) return undefined;

    const controller = new AbortController();
    const { signal } = controller;

    Promise.all([
      fetchQuestionById(id, { signal }),
      fetchRelatedQuestions(id, { limit: 5, signal }).catch(() => []),
      fetchSubjects({ signal }).catch(() => []),
      fetchTopics({ signal }).catch(() => []),
    ])
      .then(([questionData, relatedData, subjectsData, topicsData]) => {
        setDetailState({
          requestKey,
          question: questionData,
          related: Array.isArray(relatedData) ? relatedData : [],
          subjects: Array.isArray(subjectsData) ? subjectsData : [],
          topics: Array.isArray(topicsData) ? topicsData : [],
          error: "",
          statusCode: 200,
        });
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setDetailState({
          requestKey,
          question: null,
          related: [],
          subjects: [],
          topics: [],
          error: err.message || "Failed to load question details.",
          statusCode: err.status || null,
        });
      });

    return () => controller.abort();
  }, [id, requestKey]);

  const subjectMap = useMemo(
    () => Object.fromEntries(detailState.subjects.map((s) => [s.id, s])),
    [detailState.subjects]
  );

  const topicMap = useMemo(
    () => Object.fromEntries(detailState.topics.map((t) => [t.id, t])),
    [detailState.topics]
  );

  const loading = detailState.requestKey !== requestKey;
  const question = detailState.requestKey === requestKey ? detailState.question : null;
  const apiError = detailState.requestKey === requestKey ? detailState.error : "";
  const statusCode = detailState.requestKey === requestKey ? detailState.statusCode : null;

  const aiAnswer = aiState.id === id ? aiState.answer : "";
  const aiLoading = aiState.id === id ? aiState.loading : false;
  const aiError = aiState.id === id ? aiState.error : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
          <Loader text="Loading question details..." fullPage />
        </main>
        <Footer />
      </div>
    );
  }

  if (apiError || !question) {
    const isNotFound = statusCode === 404 || statusCode === 422;
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isNotFound ? "Question Not Found" : "Could Not Load Question"}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {isNotFound
              ? "The requested question was not found or is not published in the Question Bank."
              : apiError || "An unexpected error occurred while fetching this question."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {!isNotFound && (
              <Button
                variant="outline"
                onClick={() => setRetryTick((t) => t + 1)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry
              </Button>
            )}
            <Button variant="primary" onClick={() => navigate("/questions")}>
              Back to Question Bank
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const subjectName = subjectMap[question.subject_id]?.name || "Core Subject";
  const topicName = topicMap[question.topic_id]?.name || "General Topic";
  const typeLabel = formatQuestionType(question.question_type);
  const difficultyKey = String(question.difficulty || "medium").toLowerCase();
  const difficultyLabel = formatDifficulty(question.difficulty);
  const isBookmarked = bookmarks.has(question.id);
  const isSolved = completed.has(question.id);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(question.question_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: question.question_text,
        text: `Check out this ${subjectName} question on CMRIT Placement Hub:`,
        url: window.location.href,
      });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFetchAi = async () => {
    if (aiAnswer) {
      setActiveTab("ai");
      return;
    }
    setActiveTab("ai");
    setAiState({ id, answer: "", loading: true, error: "" });

    try {
      await chat(
        [
          {
            role: "system",
            content:
              "You are an expert technical interview coach at CMRIT Bengaluru. Give structured, student-friendly interview answers. Include key definitions, optimal approach, sample code/pseudocode if applicable, and common follow-up questions.",
          },
          {
            role: "user",
            content: `Placement question (${typeLabel}, ${subjectName} - ${topicName}):\n\n"${question.question_text}"\n\nPlease provide a complete interview-ready answer.`,
          },
        ],
        (_, full) => {
          setAiState({ id, answer: full, loading: true, error: "" });
        }
      );
      setAiState((prev) => (prev.id === id ? { ...prev, loading: false } : prev));
    } catch (err) {
      setAiState({
        id,
        answer: "",
        loading: false,
        error: err.message || "Could not generate AI answer. Please verify your Groq API key.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main
        id="main-content"
        className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6"
      >
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 flex-wrap">
            <Link to="/" className="hover:text-sky-600">
              Home
            </Link>
            <span>/</span>
            <Link to="/questions" className="hover:text-sky-600">
              Question Bank
            </Link>
            <span>/</span>
            <Link
              to={`/questions?subject_id=${question.subject_id}`}
              className="hover:text-sky-600 font-medium"
            >
              {subjectName}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-bold truncate max-w-[200px]">
              {typeLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/questions")}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Bank
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              Print
            </Button>
          </div>
        </div>

        {/* Question Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Subject & Topic Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center flex-shrink-0 text-sky-700">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {subjectName}
                </h3>
                <p className="text-xs text-slate-400">{topicName}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleCompleted(question.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSolved
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 ${isSolved ? "text-emerald-600" : "text-slate-400"}`}
                />
                <span>{isSolved ? "Practiced" : "Mark Practiced"}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleBookmark(question.id)}
                aria-label="Bookmark question"
                className={`p-2 rounded-xl border transition-colors ${
                  isBookmarked
                    ? "bg-amber-50 text-amber-500 border-amber-200 fill-amber-500"
                    : "bg-white text-slate-400 border-slate-200 hover:text-slate-700"
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                aria-label="Share question"
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Question Text */}
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug whitespace-pre-line">
              {question.question_text}
            </h1>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="bg-sky-50 text-sky-700 font-semibold px-2.5 py-1 rounded-lg border border-sky-200/60">
                {typeLabel}
              </span>
              <span
                className={`font-semibold px-2.5 py-1 rounded-lg border ${
                  DIFFICULTY_PILL_CLASSES[difficultyKey] ||
                  DIFFICULTY_PILL_CLASSES.medium
                }`}
              >
                {difficultyLabel}
              </span>
              <span className="bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded-lg border border-purple-200">
                {topicName}
              </span>
            </div>
          </div>
        </div>

        {/* Answer, Explanation & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            {/* Tab Switcher */}
            <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("solution")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "solution"
                    ? "bg-sky-50 text-sky-700 shadow-xs border border-sky-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Answer & Explanation
              </button>

              <button
                type="button"
                onClick={handleFetchAi}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "ai"
                    ? "bg-purple-50 text-purple-700 shadow-xs border border-purple-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>AI Coach</span>
              </button>
            </div>

            {/* Tab 1: Answer & Explanation */}
            {activeTab === "solution" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky-600" /> Official Answer &
                    Explanation
                  </h2>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? "Copied" : "Copy Question"}</span>
                  </button>
                </div>

                {/* Answer Block */}
                <div className="bg-sky-50/60 p-5 rounded-2xl border border-sky-100 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900">
                    Answer
                  </h3>
                  {question.answer?.trim() ? (
                    <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {question.answer}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-500">
                      No answer has been added for this question yet. You can try the{" "}
                      <strong>AI Coach</strong> tab for an instant structured solution.
                    </p>
                  )}
                </div>

                {/* Explanation Block */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Explanation
                  </h3>
                  {question.explanation?.trim() ? (
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {question.explanation}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-500">
                      No detailed explanation is available for this question yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: AI Placement Coach */}
            {activeTab === "ai" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">
                      AI Placement Coach
                    </h3>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFetchAi}
                    loading={aiLoading}
                  >
                    Regenerate
                  </Button>
                </div>

                {aiLoading && !aiAnswer && (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">
                      Consulting placement coach knowledge base...
                    </p>
                  </div>
                )}

                {aiError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700">
                    {aiError}
                  </div>
                )}

                {aiAnswer && (
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line bg-purple-50/20 p-5 rounded-2xl border border-purple-100">
                    {aiAnswer}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar: Topic Profile & Related Questions */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Question Metadata
              </span>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Subject</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {subjectName}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Topic</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {topicName}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Type</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {typeLabel}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Difficulty</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {difficultyLabel}
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <Link
                  to={`/questions?subject_id=${question.subject_id}&topic_id=${question.topic_id}`}
                  className="text-xs text-sky-600 font-semibold hover:underline"
                >
                  Browse more in {topicName} →
                </Link>
              </div>
            </div>

            {detailState.related.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Related Questions
                </h4>
                <div className="space-y-2">
                  {detailState.related.map((rq) => (
                    <Link
                      key={rq.id}
                      to={`/question/${rq.id}`}
                      className="block p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/60 hover:border-sky-200 transition-colors"
                    >
                      <p className="text-xs font-medium text-slate-800 line-clamp-2">
                        {rq.question_text}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {formatQuestionType(rq.question_type)} ·{" "}
                        {formatDifficulty(rq.difficulty)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
