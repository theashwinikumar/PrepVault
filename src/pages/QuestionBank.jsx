import { useState, useMemo, useEffect, useCallback } from "react";
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
  Cpu,
  Users2,
  HelpCircle,
  Eye,
  X,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import SearchBar from "../components/common/SearchBar";
import Button from "../components/common/Button";
import { SkeletonGrid } from "../components/common/Loader";
import { getAllQuestions } from "../services/questionBankService";
import { useBookmarks } from "../hooks/useBookmarks";
import { useProgress } from "../hooks/useProgress";
import { COMPANY_DOMAINS } from "../utils/companyDomains";
import { slugify } from "../utils/slug";

export default function QuestionBank() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State from URL query parameters
  const queryParam = searchParams.get("q") || "";
  const companyParam = searchParams.get("company") || "all";
  const typeParam = searchParams.get("type") || "all";
  const difficultyParam = searchParams.get("difficulty") || "all";
  const topicParam = searchParams.get("topic") || "all";
  const statusParam = searchParams.get("status") || (searchParams.get("bookmarks") === "true" ? "bookmarked" : "all");
  const isMustReadParam = searchParams.get("mustread") === "true";

  // URL-driven filters (eliminates cascading re-renders)
  const [localSearch, setLocalSearch] = useState(queryParam);
  const searchQuery = localSearch;
  const selectedCompany = companyParam;
  const selectedType = typeParam;
  const selectedDifficulty = difficultyParam;
  const selectedTopic = topicParam;
  const selectedStatus = searchParams.get("bookmarks") === "true" ? "bookmarked" : statusParam;

  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [sortBy, setSortBy] = useState("default"); // "default" | "company" | "difficulty"

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 18;

  // Mobile filter drawer
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Quick Solution Modal
  const [activeModalQuestion, setActiveModalQuestion] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Bookmarks and Progress Hooks
  const { bookmarks, toggle: toggleBookmark } = useBookmarks();
  const { completed, toggleCompleted } = useProgress();

  // Load questions
  const [allQuestions, setAllQuestions] = useState(() => getAllQuestions());
  const [loading] = useState(false);

  // Sync state if custom questions are updated or created by admin
  useEffect(() => {
    const handleRefresh = () => {
      setAllQuestions(getAllQuestions());
    };
    window.addEventListener("cmrit:questions_updated", handleRefresh);
    return () => window.removeEventListener("cmrit:questions_updated", handleRefresh);
  }, []);

  // Update URL helper
  const updateParams = useCallback((newParams) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (!v || v === "all" || v === "") {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Distinct Filter Values
  const filterOptions = useMemo(() => {
    const companies = new Set();
    const topics = new Set();
    const types = new Set(["Technical", "Programming", "HR"]);
    const difficulties = ["Easy", "Medium", "Hard"];

    allQuestions.forEach((q) => {
      if (q.company && q.company !== "General") companies.add(q.company.trim());
      if (q.topic) topics.add(q.topic.trim());
    });

    return {
      companies: Array.from(companies).sort((a, b) => a.localeCompare(b)),
      topics: Array.from(topics).sort((a, b) => a.localeCompare(b)),
      types: Array.from(types),
      difficulties,
    };
  }, [allQuestions]);

  // Filtered & Sorted Questions
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      // Must Read Filter
      if (isMustReadParam && !q.isMustRead) return false;

      // Type Filter
      if (selectedType !== "all" && q.type !== selectedType) return false;

      // Difficulty Filter
      if (selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty) return false;

      // Company Filter
      if (selectedCompany !== "all" && slugify(q.company) !== slugify(selectedCompany)) return false;

      // Topic Filter
      if (selectedTopic !== "all" && q.topic !== selectedTopic) return false;

      // Status Filter
      if (selectedStatus === "bookmarked" && !bookmarks.has(q.id)) return false;
      if (selectedStatus === "solved" && !completed.has(q.id)) return false;
      if (selectedStatus === "unsolved" && completed.has(q.id)) return false;

      // Search Query
      if (searchQuery.trim()) {
        const qLower = searchQuery.toLowerCase().trim();
        const textMatch = q.question.toLowerCase().includes(qLower);
        const compMatch = q.company.toLowerCase().includes(qLower);
        const topicMatch = q.topic?.toLowerCase().includes(qLower);
        const typeMatch = q.type?.toLowerCase().includes(qLower);
        if (!textMatch && !compMatch && !topicMatch && !typeMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "company") return a.company.localeCompare(b.company);
      if (sortBy === "difficulty") {
        const rank = { Easy: 1, Medium: 2, Hard: 3 };
        return (rank[a.difficulty] || 2) - (rank[b.difficulty] || 2);
      }
      return 0; // default order
    });
  }, [
    allQuestions,
    isMustReadParam,
    selectedType,
    selectedDifficulty,
    selectedCompany,
    selectedTopic,
    selectedStatus,
    searchQuery,
    bookmarks,
    completed,
    sortBy,
  ]);

  // Paginated Results
  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Clear all filters
  const handleClearFilters = () => {
    setLocalSearch("");
    setCurrentPage(1);
    navigate("/questions");
  };

  // Copy Question Text
  const handleCopy = (q) => {
    navigator.clipboard.writeText(q.question);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Print Practice Sheet
  const handlePrintSheet = () => {
    window.print();
  };

  // Active filters count
  const activeFiltersCount = [
    selectedCompany !== "all",
    selectedType !== "all",
    selectedDifficulty !== "all",
    selectedTopic !== "all",
    selectedStatus !== "all",
    Boolean(searchQuery.trim()),
    isMustReadParam,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
              <Link to="/" className="hover:text-sky-600">Home</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Question Bank</span>
              {isMustReadParam && (
                <>
                  <span>/</span>
                  <span className="text-amber-600 font-bold">Must-Read Core DSA</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Placement Question Bank
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Browse, filter, practice, and master authentic CMRIT campus interview questions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintSheet}
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

        {/* Dashboard Stat Widgets (Dribbble medical dashboard style) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Questions</p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {allQuestions.length.toLocaleString()}
              </h3>
              <p className="text-[11px] text-sky-600 font-medium mt-0.5">Across 170+ campus drives</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Practiced & Solved</p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
                {completed.size}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {allQuestions.length > 0 ? ((completed.size / allQuestions.length) * 100).toFixed(1) : 0}% completion
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saved For Revision</p>
              <h3 className="text-xl sm:text-2xl font-bold text-amber-600 mt-1 tabular-nums">
                {bookmarks.size}
              </h3>
              <button
                onClick={() => {
                  updateParams({ status: "bookmarked" });
                }}
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Filters Matching</p>
              <h3 className="text-xl sm:text-2xl font-bold text-indigo-600 mt-1 tabular-nums">
                {filteredQuestions.length.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Page {currentPage} of {totalPages}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Filter className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search Bar & Action Controls Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1">
              <SearchBar
                query={localSearch}
                onChange={(val) => {
                  setLocalSearch(val);
                  updateParams({ q: val });
                }}
                placeholder="Search question text, company name, or topic (e.g. DBMS, Cognizant, Trees)..."
              />
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              {/* Sort By */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="text-slate-400 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="default">Default Order</option>
                  <option value="company">Company (A-Z)</option>
                  <option value="difficulty">Difficulty (Easy to Hard)</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "grid" ? "bg-white text-sky-600 shadow-xs" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "list" ? "bg-white text-sky-600 shadow-xs" : "text-slate-400 hover:text-slate-700"
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

              {selectedCompany !== "all" && (
                <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Company: {selectedCompany}
                  <button onClick={() => updateParams({ company: "all" })} className="hover:text-sky-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedType !== "all" && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Type: {selectedType}
                  <button onClick={() => updateParams({ type: "all" })} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedDifficulty !== "all" && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Difficulty: {selectedDifficulty}
                  <button onClick={() => updateParams({ difficulty: "all" })} className="hover:text-amber-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedTopic !== "all" && (
                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Topic: {selectedTopic}
                  <button onClick={() => updateParams({ topic: "all" })} className="hover:text-purple-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedStatus !== "all" && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Status: {selectedStatus}
                  <button onClick={() => updateParams({ status: "all", bookmarks: "" })} className="hover:text-emerald-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {isMustReadParam && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-lg font-semibold">
                  Must Read Benchmark
                  <button onClick={() => updateParams({ mustread: "" })} className="hover:text-amber-950">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-lg font-medium">
                  Query: "{searchQuery}"
                  <button onClick={() => { setSearchQuery(""); updateParams({ q: "" }); }} className="hover:text-slate-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleClearFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline flex items-center gap-1 ml-auto"
              >
                <RotateCcw className="w-3 h-3" /> Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Main Content Layout: Sidebar Filters + Question Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-sky-600" /> Filters
              </span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Filter 1: Round / Question Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Question Type
              </label>
              <div className="space-y-1">
                {[
                  { id: "all", label: "All Questions", icon: HelpCircle },
                  { id: "Technical", label: "Technical Rounds", icon: Cpu },
                  { id: "Programming", label: "Coding & DSA", icon: Code2 },
                  { id: "HR", label: "HR & Behavioral", icon: Users2 },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      updateParams({ type: t.id });
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      selectedType === t.id
                        ? "bg-sky-50 text-sky-700 font-semibold border border-sky-200"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <t.icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 2: Practice Status */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Practice Status
              </label>
              <div className="space-y-1">
                {[
                  { id: "all", label: "All", count: allQuestions.length },
                  { id: "solved", label: "Solved / Practiced", count: completed.size },
                  { id: "unsolved", label: "Unsolved Questions", count: Math.max(0, allQuestions.length - completed.size) },
                  { id: "bookmarked", label: "Saved for Revision", count: bookmarks.size },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      updateParams({ status: s.id, bookmarks: s.id === "bookmarked" ? "true" : "" });
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      selectedStatus === s.id
                        ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{s.label}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full tabular-nums">
                      {s.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 3: Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {["all", "Easy", "Medium", "Hard"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => {
                      updateParams({ difficulty: diff });
                    }}
                    className={`py-1.5 text-xs font-medium rounded-xl border text-center transition-all ${
                      selectedDifficulty === diff
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {diff === "all" ? "All" : diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 4: Company Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Filter by Company
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => {
                  updateParams({ company: e.target.value });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">All Companies ({filterOptions.companies.length})</option>
                {filterOptions.companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 5: Subject / Topic */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Topic / Subject
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => {
                  updateParams({ topic: e.target.value });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">All Topics ({filterOptions.topics.length})</option>
                {filterOptions.topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </aside>

          {/* Right Question Cards Section */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <SkeletonGrid count={6} />
            ) : filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No questions match your filters</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try adjusting your search query, selecting "All" companies or categories, or resetting active filters.
                </p>
                <Button variant="primary" size="sm" onClick={handleClearFilters}>
                  Reset All Filters
                </Button>
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
                  {paginatedQuestions.map((q) => {
                    const bookmarked = bookmarks.has(q.id);
                    const solved = completed.has(q.id);
                    const domain = COMPANY_DOMAINS[q.company] || COMPANY_DOMAINS[q.company.trim()];

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
                          {/* Card Top: Company, Badges, and Bookmark */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              {/* Company Logo or Initial */}
                              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center p-1 flex-shrink-0">
                                {domain ? (
                                  <img
                                    src={`https://logos.hunter.io/${domain}`}
                                    alt=""
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display = "block";
                                    }}
                                  />
                                ) : null}
                                <span
                                  style={{ display: domain ? "none" : "block" }}
                                  className="text-[10px] font-bold text-slate-500"
                                >
                                  {q.company.charAt(0)}
                                </span>
                              </div>

                              <div>
                                <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                                  {q.company}
                                </span>
                                <span className="text-[10px] text-slate-400 block -mt-0.5">
                                  {q.year || "Campus Drive"}
                                </span>
                              </div>
                            </div>

                            {/* Bookmark Toggle */}
                            <button
                              onClick={() => toggleBookmark(q.id)}
                              aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                bookmarked
                                  ? "bg-amber-50 text-amber-500 border-amber-200 fill-amber-500"
                                  : "text-slate-300 border-transparent hover:border-slate-200 hover:text-slate-600"
                              }`}
                            >
                              <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
                            </button>
                          </div>

                          {/* Question Text */}
                          <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-3 mb-3">
                            {q.question}
                          </h3>

                          {/* Pill Badges: Type & Topic & Difficulty */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-4">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                q.type === "Technical"
                                  ? "bg-sky-50 text-sky-700 border border-sky-200/60"
                                  : q.type === "Programming"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                  : "bg-purple-50 text-purple-700 border border-purple-200/60"
                              }`}
                            >
                              {q.type}
                            </span>

                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                q.difficulty === "Easy"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : q.difficulty === "Medium"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                  : "bg-rose-50 text-rose-700 border border-rose-200/60"
                              }`}
                            >
                              {q.difficulty}
                            </span>

                            {q.topic && (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md line-clamp-1">
                                {q.topic}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Bottom: Actions */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                          {/* Mark Solved Toggle */}
                          <button
                            onClick={() => toggleCompleted(q.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                              solved
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${solved ? "text-emerald-600" : "text-slate-400"}`} />
                            <span>{solved ? "Solved" : "Mark Solved"}</span>
                          </button>

                          {/* Quick Peek & Details Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopy(q)}
                              title="Copy Question"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              {copiedId === q.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => setActiveModalQuestion(q)}
                              title="Quick Peek Solution"
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <p className="text-xs text-slate-500">
                      Showing{" "}
                      <span className="font-semibold text-slate-800">
                        {(currentPage - 1) * pageSize + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-slate-800">
                        {Math.min(currentPage * pageSize, filteredQuestions.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-800">
                        {filteredQuestions.length}
                      </span>{" "}
                      questions
                    </p>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage((p) => Math.max(1, p - 1));
                          window.scrollTo({ top: 300, behavior: "smooth" });
                        }}
                        leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                      >
                        Previous
                      </Button>

                      <span className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg">
                        {currentPage} / {totalPages}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => {
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                          window.scrollTo({ top: 300, behavior: "smooth" });
                        }}
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

      {/* Quick Solution Modal */}
      {activeModalQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{activeModalQuestion.company}</span>
                <span className="text-xs text-slate-400">· {activeModalQuestion.type}</span>
              </div>
              <button
                onClick={() => setActiveModalQuestion(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <h3 className="font-bold text-slate-900 text-lg leading-snug">
                {activeModalQuestion.question}
              </h3>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-lg font-semibold">
                  {activeModalQuestion.topic || "Core Topic"}
                </span>
                <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-semibold">
                  Difficulty: {activeModalQuestion.difficulty}
                </span>
              </div>

              {activeModalQuestion.problemStatement && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
                  <p className="font-bold text-slate-900 mb-1">Problem Description:</p>
                  {activeModalQuestion.problemStatement}
                </div>
              )}

              {activeModalQuestion.answer ? (
                <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 text-xs text-slate-800 leading-relaxed space-y-2">
                  <p className="font-bold text-sky-900">Concept & Reference Solution:</p>
                  <p className="whitespace-pre-line">{activeModalQuestion.answer}</p>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                  <p className="font-bold text-slate-800">Placement Preparation Notes:</p>
                  <p>
                    Review core fundamentals of {activeModalQuestion.topic || "this topic"}. When answering in an interview, first state definition, key properties, and practical applications.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => handleCopy(activeModalQuestion)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedId === activeModalQuestion.id ? "Copied!" : "Copy Question"}</span>
              </button>

              <Link
                to={`/question/${activeModalQuestion.id}`}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                Open Full Dedicated Page <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filters Slide-over */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/50 backdrop-blur-xs">
          <div className="ml-auto w-full max-w-xs bg-white h-full p-5 overflow-y-auto space-y-5 shadow-2xl flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-base text-slate-900">Filters</span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Round Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Question Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    updateParams({ type: e.target.value });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value="all">All Types</option>
                  <option value="Technical">Technical</option>
                  <option value="Programming">Programming</option>
                  <option value="HR">HR & Behavioral</option>
                </select>
              </div>

              {/* Practice Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    updateParams({ status: e.target.value });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value="all">All</option>
                  <option value="solved">Solved</option>
                  <option value="unsolved">Unsolved</option>
                  <option value="bookmarked">Bookmarked</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => {
                    updateParams({ difficulty: e.target.value });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value="all">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Company</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => {
                    updateParams({ company: e.target.value });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value="all">All Companies</option>
                  {filterOptions.companies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
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
