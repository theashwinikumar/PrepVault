import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  BookOpen,
  Filter,
  CheckCircle2,
  Bookmark,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Printer,
  LayoutGrid,
  List,
  RotateCcw,
  Code2,
  FileText,
  HelpCircle,
  ListChecks,
  Terminal,
  CheckSquare,
  Eye,
  X,
  AlertCircle,
  RefreshCw,
  Building2,
  Layers,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import SearchBar from "../components/common/SearchBar";
import Button from "../components/common/Button";
import { SkeletonGrid, Spinner } from "../components/common/Loader";
import {
  QUESTION_TYPES,
  DIFFICULTIES,
  isValidQuestionType,
  isValidDifficulty,
  formatQuestionType,
  formatDifficulty,
  fetchPublishedQuestions,
  fetchQuestionById,
  fetchSubjects,
  fetchTopics,
  fetchCompanies,
  fetchStatisticsOverview,
} from "../services/questionApi";
import { useBookmarks } from "../hooks/useBookmarks";
import { useProgress } from "../hooks/useProgress";
import { COMPANY_DOMAINS } from "../utils/companyDomains";
import { slugify } from "../utils/slug";

const PAGE_SIZE = 20;

const QUESTION_TYPE_ICONS = {
  theory: FileText,
  mcq: ListChecks,
  coding: Code2,
  output_based: Terminal,
  multiple_select: CheckSquare,
};

const QUESTION_TYPE_BADGE_CLASSES = {
  theory: "bg-sky-50 text-sky-700 border border-sky-200/60",
  mcq: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
  coding: "bg-blue-50 text-blue-700 border border-blue-200/60",
  output_based: "bg-violet-50 text-violet-700 border border-violet-200/60",
  multiple_select: "bg-teal-50 text-teal-700 border border-teal-200/60",
};

const DIFFICULTY_BADGE_CLASSES = {
  easy: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  medium: "bg-amber-50 text-amber-700 border border-amber-200/60",
  hard: "bg-rose-50 text-rose-700 border border-rose-200/60",
};

export default function QuestionBank() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL-driven parameters
  const queryParam = searchParams.get("q") || "";
  const selectedSubjectId = searchParams.get("subject_id") || "";
  const selectedTopicId = searchParams.get("topic_id") || "";
  const companyIdParam = searchParams.get("company_id") || "";
  const legacyCompanyParam = searchParams.get("company") || "";

  const rawTypeParam = searchParams.get("question_type") || searchParams.get("type") || "";
  const selectedType = isValidQuestionType(rawTypeParam)
    ? rawTypeParam.toLowerCase()
    : "";

  const rawDifficultyParam = searchParams.get("difficulty") || "";
  const selectedDifficulty = isValidDifficulty(rawDifficultyParam)
    ? rawDifficultyParam.toLowerCase()
    : "";

  const selectedStatus =
    searchParams.get("bookmarks") === "true"
      ? "bookmarked"
      : searchParams.get("status") || "all";

  const currentPage = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1
  );

  // Local search input with debounce
  const [localSearch, setLocalSearch] = useState(queryParam);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  // Reference metadata from FastAPI
  const [subjects, setSubjects] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [subjectTopics, setSubjectTopics] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [overview, setOverview] = useState(null);
  const [metadataError, setMetadataError] = useState("");

  // Question list state keyed by active request so loading is derived cleanly
  const [questionsState, setQuestionsState] = useState({
    key: "",
    items: [],
    hasNextPage: false,
    error: "",
  });

  // Detail modal state (fetches by ID from FastAPI)
  const [modalState, setModalState] = useState({
    open: false,
    questionId: null,
    loading: false,
    data: null,
    error: "",
  });

  const { bookmarks, toggle: toggleBookmark } = useBookmarks();
  const { completed, toggleCompleted } = useProgress();

  // Resolve legacy ?company=Name param to UUID if needed
  const selectedCompanyId = useMemo(() => {
    if (companyIdParam) return companyIdParam;
    if (!legacyCompanyParam || companies.length === 0) return "";
    const targetSlug = slugify(legacyCompanyParam);
    const match = companies.find(
      (c) =>
        c.id === legacyCompanyParam ||
        c.slug === targetSlug ||
        slugify(c.name) === targetSlug
    );
    return match ? match.id : "";
  }, [companyIdParam, legacyCompanyParam, companies]);

  // Lookup maps
  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])),
    [subjects]
  );

  const topicMap = useMemo(() => {
    const merged = [...allTopics, ...(subjectTopics || [])];
    return Object.fromEntries(merged.map((t) => [t.id, t]));
  }, [allTopics, subjectTopics]);

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c])),
    [companies]
  );

  // Topics shown in dropdown: strictly match selected subject when one is selected
  const availableTopics = useMemo(() => {
    if (selectedSubjectId) {
      if (subjectTopics !== null) return subjectTopics;
      return allTopics.filter((t) => t.subject_id === selectedSubjectId);
    }
    return allTopics;
  }, [selectedSubjectId, subjectTopics, allTopics]);

  // Update filter URL params and ALWAYS reset to page 1
  const updateFilterParams = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams);
      // Clean legacy params if updated via new filter controls
      if (Object.hasOwn(updates, "question_type")) next.delete("type");
      if (Object.hasOwn(updates, "company_id")) next.delete("company");

      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "all" || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      // Reset to page 1 whenever a filter or search changes
      next.delete("page");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Navigate to a specific page without resetting filters
  const goToPage = useCallback(
    (pageNumber) => {
      const next = new URLSearchParams(searchParams);
      if (pageNumber <= 1) {
        next.delete("page");
      } else {
        next.set("page", String(pageNumber));
      }
      setSearchParams(next, { replace: true });
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 300, behavior: "smooth" });
      }
    },
    [searchParams, setSearchParams]
  );

  // Load reference metadata (subjects, all topics, companies, overview)
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    Promise.all([
      fetchSubjects({ signal }),
      fetchTopics({ signal }),
      fetchCompanies({ signal }),
      fetchStatisticsOverview({ signal }).catch(() => null),
    ])
      .then(([subjectsData, topicsData, companiesData, overviewData]) => {
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        setAllTopics(Array.isArray(topicsData) ? topicsData : []);
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
        if (overviewData) setOverview(overviewData);
        setMetadataError("");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setMetadataError(err.message || "Failed to load filter options.");
      });

    return () => controller.abort();
  }, [retryTick]);

  // Load subject-specific topics from FastAPI when subject changes
  useEffect(() => {
    if (!selectedSubjectId) return undefined;

    const controller = new AbortController();
    fetchTopics({ subject_id: selectedSubjectId, signal: controller.signal })
      .then((topicsData) => {
        setSubjectTopics(Array.isArray(topicsData) ? topicsData : []);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setSubjectTopics([]);
      });

    return () => controller.abort();
  }, [selectedSubjectId]);

  // Debounced search sync (resets page to 1 when search changes)
  const latestQueryParamRef = useRef(queryParam);
  useEffect(() => {
    latestQueryParamRef.current = queryParam;
  }, [queryParam]);

  useEffect(() => {
    const trimmed = localSearch.trim();
    if (trimmed === latestQueryParamRef.current.trim()) return undefined;

    const timer = setTimeout(() => {
      updateFilterParams({ q: trimmed });
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, updateFilterParams]);

  // Unique request key for published questions fetch
  const requestKey = useMemo(
    () =>
      JSON.stringify({
        subject_id: selectedSubjectId || undefined,
        topic_id: selectedTopicId || undefined,
        company_id: selectedCompanyId || undefined,
        difficulty: selectedDifficulty || undefined,
        question_type: selectedType || undefined,
        search: queryParam.trim() || undefined,
        skip: (currentPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE + 1,
        retryTick,
      }),
    [
      selectedSubjectId,
      selectedTopicId,
      selectedCompanyId,
      selectedDifficulty,
      selectedType,
      queryParam,
      currentPage,
      retryTick,
    ]
  );

  // Fetch published questions from FastAPI
  useEffect(() => {
    const controller = new AbortController();

    fetchPublishedQuestions({
      subject_id: selectedSubjectId || undefined,
      topic_id: selectedTopicId || undefined,
      company_id: selectedCompanyId || undefined,
      difficulty: selectedDifficulty || undefined,
      question_type: selectedType || undefined,
      search: queryParam.trim() || undefined,
      skip: (currentPage - 1) * PAGE_SIZE,
      limit: PAGE_SIZE + 1,
      signal: controller.signal,
    })
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        setQuestionsState({
          key: requestKey,
          items: list.slice(0, PAGE_SIZE),
          hasNextPage: list.length > PAGE_SIZE,
          error: "",
        });
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setQuestionsState({
          key: requestKey,
          items: [],
          hasNextPage: false,
          error: err.message || "Unable to fetch questions from the server.",
        });
      });

    return () => controller.abort();
  }, [
    requestKey,
    selectedSubjectId,
    selectedTopicId,
    selectedCompanyId,
    selectedDifficulty,
    selectedType,
    queryParam,
    currentPage,
  ]);

  const loading = questionsState.key !== requestKey;
  const apiError = questionsState.key === requestKey ? questionsState.error : "";

  // Optional local practice-status filtering on current page items
  const displayedQuestions = useMemo(() => {
    const items = questionsState.items;
    if (selectedStatus === "bookmarked") {
      return items.filter((q) => bookmarks.has(q.id));
    }
    if (selectedStatus === "solved") {
      return items.filter((q) => completed.has(q.id));
    }
    if (selectedStatus === "unsolved") {
      return items.filter((q) => !completed.has(q.id));
    }
    return items;
  }, [questionsState.items, selectedStatus, bookmarks, completed]);

  // Open question detail modal by fetching GET /api/questions/{id}
  const openQuestionDetail = useCallback(async (questionId) => {
    setModalState({
      open: true,
      questionId,
      loading: true,
      data: null,
      error: "",
    });

    try {
      const detail = await fetchQuestionById(questionId);
      setModalState({
        open: true,
        questionId,
        loading: false,
        data: detail,
        error: "",
      });
    } catch (err) {
      setModalState({
        open: true,
        questionId,
        loading: false,
        data: null,
        error: err.message || "Failed to load question details.",
      });
    }
  }, []);

  const closeQuestionDetail = () => {
    setModalState({
      open: false,
      questionId: null,
      loading: false,
      data: null,
      error: "",
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setLocalSearch("");
    setSubjectTopics(null);
    navigate("/questions", { replace: true });
  };

  // Copy question text
  const handleCopy = (q) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(q.question_text);
      setCopiedId(q.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const activeFiltersCount = [
    Boolean(selectedSubjectId),
    Boolean(selectedTopicId),
    Boolean(selectedCompanyId),
    Boolean(selectedType),
    Boolean(selectedDifficulty),
    selectedStatus !== "all",
    Boolean(queryParam.trim()),
  ].filter(Boolean).length;

  const totalPublishedCount = overview?.total_questions ?? questionsState.items.length;
  const activeCompanyName = selectedCompanyId ? companyMap[selectedCompanyId]?.name : "";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main
        id="main-content"
        className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6"
      >
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
              <Link to="/" className="hover:text-sky-600">
                Home
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Question Bank</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Placement Question Bank
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Browse, filter, search, and practice published CMRIT placement questions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              Print Practice Sheet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFilterOpen(true)}
              leftIcon={<Filter className="w-3.5 h-3.5" />}
              className="lg:hidden"
            >
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>
        </div>

        {/* Stat Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Published Questions
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {totalPublishedCount.toLocaleString()}
              </h3>
              <p className="text-[11px] text-sky-600 font-medium mt-0.5">
                {overview?.total_subjects ?? subjects.length} subjects ·{" "}
                {overview?.total_companies ?? companies.length} companies
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Practiced & Solved
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
                {completed.size}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {totalPublishedCount > 0
                  ? ((completed.size / totalPublishedCount) * 100).toFixed(1)
                  : 0}
                % completion
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Saved For Revision
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-amber-600 mt-1 tabular-nums">
                {bookmarks.size}
              </h3>
              <button
                type="button"
                onClick={() => updateFilterParams({ status: "bookmarked", bookmarks: "" })}
                className="text-[11px] text-amber-600 font-medium hover:underline mt-0.5 inline-block"
              >
                View bookmarked →
              </button>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bookmark className="w-5 h-5 fill-amber-500/20" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Showing on Page {currentPage}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-indigo-600 mt-1 tabular-nums">
                {loading ? "..." : displayedQuestions.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeFiltersCount > 0
                  ? `${activeFiltersCount} filter${activeFiltersCount > 1 ? "s" : ""} active`
                  : "All published items"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Filter className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search Bar & View Controls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1">
              <SearchBar
                query={localSearch}
                onChange={(val) => {
                  setLocalSearch(val);
                  if (val === "") {
                    updateFilterParams({ q: "" });
                  }
                }}
                onSearchSubmit={(val) => {
                  updateFilterParams({ q: (val || "").trim() });
                }}
                placeholder="Search question text (e.g. normalization, binary search, deadlock)..."
              />
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-sky-600 shadow-xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-white text-sky-600 shadow-xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-medium">Active filters:</span>

              {selectedSubjectId && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Subject: {subjectMap[selectedSubjectId]?.name || selectedSubjectId}
                  <button
                    type="button"
                    aria-label="Clear subject filter"
                    onClick={() => {
                      setSubjectTopics(null);
                      updateFilterParams({ subject_id: "", topic_id: "" });
                    }}
                    className="hover:text-indigo-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedTopicId && (
                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Topic: {topicMap[selectedTopicId]?.name || selectedTopicId}
                  <button
                    type="button"
                    aria-label="Clear topic filter"
                    onClick={() => updateFilterParams({ topic_id: "" })}
                    className="hover:text-purple-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCompanyId && (
                <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Company: {activeCompanyName || selectedCompanyId}
                  <button
                    type="button"
                    aria-label="Clear company filter"
                    onClick={() => updateFilterParams({ company_id: "" })}
                    className="hover:text-sky-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedType && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Type: {formatQuestionType(selectedType)}
                  <button
                    type="button"
                    aria-label="Clear question type filter"
                    onClick={() => updateFilterParams({ question_type: "" })}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedDifficulty && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Difficulty: {formatDifficulty(selectedDifficulty)}
                  <button
                    type="button"
                    aria-label="Clear difficulty filter"
                    onClick={() => updateFilterParams({ difficulty: "" })}
                    className="hover:text-amber-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedStatus !== "all" && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Status: {selectedStatus}
                  <button
                    type="button"
                    aria-label="Clear status filter"
                    onClick={() => updateFilterParams({ status: "all", bookmarks: "" })}
                    className="hover:text-emerald-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {queryParam && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Search: &ldquo;{queryParam}&rdquo;
                  <button
                    type="button"
                    aria-label="Clear search query"
                    onClick={() => {
                      setLocalSearch("");
                      updateFilterParams({ q: "" });
                    }}
                    className="hover:text-slate-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline flex items-center gap-1 ml-auto"
              >
                <RotateCcw className="w-3 h-3" /> Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Metadata Warning Banner (if subjects/topics/companies failed) */}
        {metadataError && (
          <div
            role="alert"
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs text-amber-900"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Some filter lists could not be loaded: {metadataError}</span>
            </div>
            <button
              type="button"
              onClick={() => setRetryTick((t) => t + 1)}
              className="font-semibold text-amber-800 hover:underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content Layout: Sidebar Filters + Question Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-sky-600" /> Filters
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Filter 1: Subject */}
            <div className="space-y-2">
              <label
                htmlFor="filter-subject"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
              >
                Subject
              </label>
              <select
                id="filter-subject"
                value={selectedSubjectId}
                onChange={(e) => {
                  const nextSubject = e.target.value;
                  setSubjectTopics(null);
                  updateFilterParams({ subject_id: nextSubject, topic_id: "" });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">All Subjects ({subjects.length})</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Topic (dependent on Subject) */}
            <div className="space-y-2">
              <label
                htmlFor="filter-topic"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
              >
                Topic
              </label>
              <select
                id="filter-topic"
                value={selectedTopicId}
                onChange={(e) => updateFilterParams({ topic_id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">
                  {selectedSubjectId
                    ? `All Topics in ${subjectMap[selectedSubjectId]?.name || "Subject"} (${availableTopics.length})`
                    : `All Topics (${availableTopics.length})`}
                </option>
                {availableTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Company */}
            <div className="space-y-2">
              <label
                htmlFor="filter-company"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
              >
                Company
              </label>
              <select
                id="filter-company"
                value={selectedCompanyId}
                onChange={(e) => updateFilterParams({ company_id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">All Companies ({companies.length})</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 4: Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Difficulty
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateFilterParams({ difficulty: "" })}
                  className={`py-1.5 text-xs font-medium rounded-xl border text-center transition-all ${
                    !selectedDifficulty
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  All
                </button>
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => updateFilterParams({ difficulty: diff.value })}
                    className={`py-1.5 text-xs font-medium rounded-xl border text-center transition-all ${
                      selectedDifficulty === diff.value
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 5: Question Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Question Type
              </label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => updateFilterParams({ question_type: "" })}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    !selectedType
                      ? "bg-sky-50 text-sky-700 font-semibold border border-sky-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>All Types</span>
                </button>
                {QUESTION_TYPES.map((t) => {
                  const Icon = QUESTION_TYPE_ICONS[t.value] || FileText;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => updateFilterParams({ question_type: t.value })}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        selectedType === t.value
                          ? "bg-sky-50 text-sky-700 font-semibold border border-sky-200"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter 6: Practice Status (client-side on loaded page) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Practice Status
              </label>
              <div className="space-y-1">
                {[
                  { id: "all", label: "All" },
                  { id: "solved", label: "Solved / Practiced" },
                  { id: "unsolved", label: "Unsolved Questions" },
                  { id: "bookmarked", label: "Saved for Revision" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      updateFilterParams({
                        status: s.id,
                        bookmarks: s.id === "bookmarked" ? "true" : "",
                      })
                    }
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      selectedStatus === s.id
                        ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Question Cards Section */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <SkeletonGrid count={6} />
            ) : apiError ? (
              <div
                role="alert"
                className="bg-white rounded-2xl border border-rose-200 p-10 text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Could not load questions
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  {apiError}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setRetryTick((t) => t + 1)}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Retry
                  </Button>
                  {activeFiltersCount > 0 && (
                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                      Reset Filters
                    </Button>
                  )}
                </div>
              </div>
            ) : displayedQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  No published questions found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  {activeFiltersCount > 0
                    ? "No published questions matched your current search or filter selection. Try adjusting or resetting your filters."
                    : "There are no published questions available right now."}
                </p>
                {activeFiltersCount > 0 && (
                  <Button variant="primary" size="sm" onClick={handleClearFilters}>
                    Reset All Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Question Cards Grid / List */}
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                      : "space-y-3"
                  }
                >
                  {displayedQuestions.map((q) => {
                    const bookmarked = bookmarks.has(q.id);
                    const solved = completed.has(q.id);
                    const subjectName = subjectMap[q.subject_id]?.name || "Core Subject";
                    const topicName = topicMap[q.topic_id]?.name || "";
                    const typeKey = String(q.question_type || "theory").toLowerCase();
                    const diffKey = String(q.difficulty || "medium").toLowerCase();
                    const headerLabel = activeCompanyName || subjectName;
                    const domain = activeCompanyName
                      ? COMPANY_DOMAINS[activeCompanyName] ||
                        COMPANY_DOMAINS[activeCompanyName.trim()]
                      : null;

                    return (
                      <div
                        key={q.id}
                        className={`bg-white rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between hover:shadow-md ${
                          solved
                            ? "border-emerald-200 bg-emerald-50/15"
                            : "border-slate-200/80 hover:border-sky-300"
                        }`}
                      >
                        <div>
                          {/* Card Top: Subject / Company & Bookmark */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center p-1 flex-shrink-0">
                                {domain ? (
                                  <img
                                    src={`https://logos.hunter.io/${domain}`}
                                    alt=""
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <span className="text-[10px] font-bold text-sky-700">
                                    {headerLabel.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0">
                                <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                                  {headerLabel}
                                </span>
                                <span className="text-[10px] text-slate-400 block -mt-0.5 truncate">
                                  {activeCompanyName
                                    ? subjectName
                                    : topicName || "Published Question"}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleBookmark(q.id)}
                              aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                bookmarked
                                  ? "bg-amber-50 text-amber-500 border-amber-200 fill-amber-500"
                                  : "text-slate-300 border-transparent hover:border-slate-200 hover:text-slate-600"
                              }`}
                            >
                              <Bookmark
                                className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`}
                              />
                            </button>
                          </div>

                          {/* Question Text */}
                          <button
                            type="button"
                            onClick={() => openQuestionDetail(q.id)}
                            className="text-left w-full group"
                          >
                            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-sky-700 transition-colors leading-snug line-clamp-3 mb-3">
                              {q.question_text}
                            </h3>
                          </button>

                          {/* Pill Badges: Type, Difficulty, Subject & Topic */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-4">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                QUESTION_TYPE_BADGE_CLASSES[typeKey] ||
                                QUESTION_TYPE_BADGE_CLASSES.theory
                              }`}
                            >
                              {formatQuestionType(q.question_type)}
                            </span>

                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                DIFFICULTY_BADGE_CLASSES[diffKey] ||
                                DIFFICULTY_BADGE_CLASSES.medium
                              }`}
                            >
                              {formatDifficulty(q.difficulty)}
                            </span>

                            {topicName && (
                              <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md line-clamp-1">
                                {topicName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Bottom: Actions */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => toggleCompleted(q.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                              solved
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 ${
                                solved ? "text-emerald-600" : "text-slate-400"
                              }`}
                            />
                            <span>{solved ? "Solved" : "Mark Solved"}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopy(q)}
                              title="Copy Question"
                              aria-label="Copy Question"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              {copiedId === q.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => openQuestionDetail(q.id)}
                              title="Quick Peek Answer & Explanation"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-medium transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Quick Peek</span>
                            </button>

                            <Link
                              to={`/question/${q.id}`}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium transition-colors"
                            >
                              <span>Details</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Backend Pagination Controls */}
                {(currentPage > 1 || questionsState.hasNextPage) && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <p className="text-xs text-slate-500">
                      Showing{" "}
                      <span className="font-semibold text-slate-800">
                        {(currentPage - 1) * PAGE_SIZE + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-slate-800">
                        {(currentPage - 1) * PAGE_SIZE + displayedQuestions.length}
                      </span>{" "}
                      · Page{" "}
                      <span className="font-semibold text-slate-800">{currentPage}</span>
                    </p>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1 || loading}
                        onClick={() => goToPage(Math.max(1, currentPage - 1))}
                        leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                      >
                        Previous
                      </Button>

                      <span className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg">
                        Page {currentPage}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!questionsState.hasNextPage || loading}
                        onClick={() => goToPage(currentPage + 1)}
                        rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Question Detail Modal (Fetched by ID from FastAPI) */}
      {modalState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Question detail"
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-xs">
                <Layers className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-slate-900">
                  {modalState.data
                    ? subjectMap[modalState.data.subject_id]?.name || "Question Detail"
                    : "Question Detail"}
                </span>
                {modalState.data && (
                  <span className="text-slate-400">
                    · {formatQuestionType(modalState.data.question_type)}
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={closeQuestionDetail}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {modalState.loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Spinner size="md" />
                  <p className="text-xs font-medium">Loading question details...</p>
                </div>
              ) : modalState.error ? (
                <div className="py-8 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">
                    Failed to load question
                  </p>
                  <p className="text-xs text-slate-500">{modalState.error}</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openQuestionDetail(modalState.questionId)}
                  >
                    Retry
                  </Button>
                </div>
              ) : modalState.data ? (
                <>
                  <h3 className="font-bold text-slate-900 text-lg leading-snug">
                    {modalState.data.question_text}
                  </h3>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {topicMap[modalState.data.topic_id] && (
                      <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg font-semibold">
                        {topicMap[modalState.data.topic_id].name}
                      </span>
                    )}
                    <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-lg font-semibold">
                      {formatQuestionType(modalState.data.question_type)}
                    </span>
                    <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-semibold">
                      Difficulty: {formatDifficulty(modalState.data.difficulty)}
                    </span>
                    {activeCompanyName && (
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {activeCompanyName}
                      </span>
                    )}
                  </div>

                  {/* Answer */}
                  <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-1.5">
                    <p className="font-bold text-sky-900 text-xs uppercase tracking-wider">
                      Answer
                    </p>
                    <p className="whitespace-pre-line">
                      {modalState.data.answer?.trim()
                        ? modalState.data.answer
                        : "No reference answer has been added for this question yet."}
                    </p>
                  </div>

                  {/* Explanation */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-1.5">
                    <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Explanation
                    </p>
                    <p className="whitespace-pre-line">
                      {modalState.data.explanation?.trim()
                        ? modalState.data.explanation
                        : "No detailed explanation has been provided for this question yet."}
                    </p>
                  </div>
                </>
              ) : null}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              {modalState.data ? (
                <button
                  type="button"
                  onClick={() => handleCopy(modalState.data)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>
                    {copiedId === modalState.data.id ? "Copied!" : "Copy Question"}
                  </span>
                </button>
              ) : (
                <div />
              )}

              {modalState.questionId && (
                <Link
                  to={`/question/${modalState.questionId}`}
                  onClick={closeQuestionDetail}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  Open Full Dedicated Page <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filters Slide-over */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/50 backdrop-blur-xs">
          <div className="ml-auto w-full max-w-xs bg-white h-full p-5 overflow-y-auto space-y-5 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-base text-slate-900">Filters</span>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    const nextSubject = e.target.value;
                    setSubjectTopics(null);
                    updateFilterParams({ subject_id: nextSubject, topic_id: "" });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Topic */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Topic
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => updateFilterParams({ topic_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value="">All Topics</option>
                  {availableTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Company */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Company
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => updateFilterParams({ company_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value="">All Companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Difficulty */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => updateFilterParams({ difficulty: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value="">All Difficulties</option>
                  {DIFFICULTIES.map((diff) => (
                    <option key={diff.value} value={diff.value}>
                      {diff.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Question Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Question Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => updateFilterParams({ question_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value="">All Types</option>
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Practice Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    updateFilterParams({
                      status: e.target.value,
                      bookmarks: e.target.value === "bookmarked" ? "true" : "",
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value="all">All</option>
                  <option value="solved">Solved</option>
                  <option value="unsolved">Unsolved</option>
                  <option value="bookmarked">Bookmarked</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setMobileFilterOpen(false)}
              >
                Apply Filters
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-rose-600"
                onClick={() => {
                  handleClearFilters();
                  setMobileFilterOpen(false);
                }}
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
