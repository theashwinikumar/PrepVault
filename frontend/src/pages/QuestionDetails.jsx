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
  Building2,
  Code2,
  ChevronRight,
  Flame,
  Clock,
  Layers,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Button from "../components/common/Button";
import { getQuestionById, getAllQuestions } from "../services/questionBankService";
import { useBookmarks } from "../hooks/useBookmarks";
import { useProgress } from "../hooks/useProgress";
import { COMPANY_DOMAINS } from "../utils/companyDomains";
import { useGroq } from "../hooks/useGroq";

export default function QuestionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const question = useMemo(() => getQuestionById(id), [id]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("solution"); // "solution" | "code" | "ai"
  const [codeLanguage, setCodeLanguage] = useState("java");

  // Groq AI Coach integration
  const { chat } = useGroq();
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const { bookmarks, toggle: toggleBookmark } = useBookmarks();
  const { completed, toggleCompleted } = useProgress();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const allQuestions = useMemo(() => getAllQuestions(), []);

  // Related questions from same company
  const relatedCompanyQuestions = useMemo(() => {
    if (!question) return [];
    return allQuestions
      .filter((q) => q.company === question.company && q.id !== question.id)
      .slice(0, 5);
  }, [allQuestions, question]);

  // Related questions in same topic
  const relatedTopicQuestions = useMemo(() => {
    if (!question) return [];
    return allQuestions
      .filter((q) => q.topic === question.topic && q.id !== question.id)
      .slice(0, 5);
  }, [allQuestions, question]);

  // Next and Previous Questions in catalogue
  const { prevQ, nextQ } = useMemo(() => {
    if (!question) return { prevQ: null, nextQ: null };
    const idx = allQuestions.findIndex((q) => q.id === question.id);
    return {
      prevQ: idx > 0 ? allQuestions[idx - 1] : null,
      nextQ: idx >= 0 && idx < allQuestions.length - 1 ? allQuestions[idx + 1] : null,
    };
  }, [allQuestions, question]);

  if (!question) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Question Not Found</h2>
          <p className="text-sm text-slate-500">
            The question you requested could not be located in the CMRIT Placement Question Bank.
          </p>
          <Button variant="primary" onClick={() => navigate("/questions")}>
            Back to Question Bank
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isBookmarked = bookmarks.has(question.id);
  const isSolved = completed.has(question.id);
  const domain = COMPANY_DOMAINS[question.company] || COMPANY_DOMAINS[question.company.trim()];

  const handleCopy = () => {
    navigator.clipboard.writeText(question.question);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: question.question,
        text: `Check out this interview question asked at ${question.company} on CMRIT Placement Portal:`,
        url: window.location.href,
      });
    } else {
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
    setAiLoading(true);
    setAiError("");
    setAiAnswer("");

    try {
      await chat(
        [
          {
            role: "system",
            content:
              "You are an expert technical interview coach at CMRIT Bengaluru. Give structured, student-friendly interview answers. Include key definitions, optimal approach, sample code/pseudocode, time/space complexity, and common follow-up questions.",
          },
          {
            role: "user",
            content: `Interview question for campus placements (${question.type} Round at ${question.company}):\n\n"${question.question}"\n\nPlease provide a complete interview-ready answer.`,
          },
        ],
        (_, full) => {
          setAiAnswer(full);
        }
      );
    } catch (err) {
      setAiError(err.message || "Could not generate AI answer. Please verify your Groq API key.");
    } finally {
      setAiLoading(false);
    }
  };

  // Generate clean default code snippet if none exists
  const displayCode =
    question.code ||
    (question.type === "Programming"
      ? `// Solution for: ${question.question}
// Language: Java
public class Solution {
    public static void solve() {
        // Implementation approach
        System.out.println("Optimal approach implemented here");
    }

    public static void main(String[] args) {
        solve();
    }
}`
      : `// Core logic / pseudocode:
// 1. Initialize variables & data structures
// 2. Traverse input collection
// 3. Apply algorithm logic
// 4. Return result`);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link to="/" className="hover:text-sky-600">Home</Link>
            <span>/</span>
            <Link to="/questions" className="hover:text-sky-600">Question Bank</Link>
            <span>/</span>
            <Link to={`/company/${encodeURIComponent(question.company)}`} className="hover:text-sky-600 font-medium">
              {question.company}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-bold truncate max-w-[200px]">{question.type}</span>
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
            {/* Company Badge with Domain Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 flex-shrink-0">
                {domain ? (
                  <img
                    src={`https://logos.hunter.io/${domain}`}
                    alt={question.company}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                ) : null}
                <span
                  style={{ display: domain ? "none" : "block" }}
                  className="text-xs font-bold text-slate-500"
                >
                  {question.company.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {question.company}
                </h3>
                <p className="text-xs text-slate-400">
                  {question.year ? `${question.year} Placement Season` : "Campus Recruitment Drive"}
                </p>
              </div>
            </div>

            {/* Badges & Actions */}
            <div className="flex items-center gap-2">
              {/* Solved Toggle */}
              <button
                onClick={() => toggleCompleted(question.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSolved
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isSolved ? "text-emerald-600" : "text-slate-400"}`} />
                <span>{isSolved ? "Practiced" : "Mark Practiced"}</span>
              </button>

              {/* Bookmark Toggle */}
              <button
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

              {/* Share */}
              <button
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
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {question.question}
            </h1>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="bg-sky-50 text-sky-700 font-semibold px-2.5 py-1 rounded-lg border border-sky-200/60">
                {question.type} Round
              </span>
              <span
                className={`font-semibold px-2.5 py-1 rounded-lg border ${
                  question.difficulty === "Easy"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : question.difficulty === "Medium"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {question.difficulty}
              </span>
              <span className="bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded-lg border border-purple-200">
                {question.topic}
              </span>
              {question.isMustRead && (
                <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" /> Must-Read DSA Benchmark
                </span>
              )}
            </div>
          </div>

          {/* Optional Problem Statement Detail / Constraints */}
          {question.problemStatement && (
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
              <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                Problem Description & Constraints:
              </span>
              <p className="whitespace-pre-line">{question.problemStatement}</p>
            </div>
          )}
        </div>

        {/* Solution Tabs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            {/* Tab Switcher */}
            <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center gap-1">
              <button
                onClick={() => setActiveTab("solution")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "solution"
                    ? "bg-sky-50 text-sky-700 shadow-xs border border-sky-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Concept & Solution
              </button>

              <button
                onClick={() => setActiveTab("code")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "code"
                    ? "bg-blue-50 text-blue-700 shadow-xs border border-blue-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Code & Complexity
              </button>

              <button
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

            {/* Tab 1: Solution Content */}
            {activeTab === "solution" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky-600" /> Recommended Interview Approach
                  </h3>
                  <button
                    onClick={handleCopy}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {question.answer ? (
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-3">
                    {question.answer}
                  </div>
                ) : (
                  <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <p>
                      This question is a high-frequency benchmark asked in the{" "}
                      <span className="font-semibold text-slate-900">{question.type} round</span> for candidates at{" "}
                      <span className="font-semibold text-slate-900">{question.company}</span>.
                    </p>

                    <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-100 space-y-2">
                      <h4 className="font-bold text-sky-950 text-xs uppercase tracking-wider">
                        How to structure your answer:
                      </h4>
                      <ol className="list-decimal pl-5 space-y-1.5 text-xs text-sky-900">
                        <li>
                          <strong>Direct definition:</strong> State what it is in one concise sentence.
                        </li>
                        <li>
                          <strong>Core concept & principles:</strong> Break down the internal mechanism or algorithm.
                        </li>
                        <li>
                          <strong>Real-world engineering example:</strong> Connect it to real database tables, operating system kernels, or microservices.
                        </li>
                        <li>
                          <strong>Trade-offs & alternatives:</strong> Discuss time vs. space complexity, lock contention, or caching overhead.
                        </li>
                      </ol>
                    </div>

                    <p className="text-slate-500 text-xs">
                      Want an instant full answer? Click on the <strong>AI Coach</strong> tab above to generate an in-depth breakdown with examples!
                    </p>
                  </div>
                )}

                {/* Test case if present */}
                {question.testCase && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider block">
                      Sample Test Case:
                    </span>
                    <div className="font-mono bg-white p-2.5 rounded-xl border border-slate-200/70">
                      <div>Input: {question.testCase.input}</div>
                      <div>Output: {question.testCase.output}</div>
                    </div>
                    {question.testCase.explanation && (
                      <p className="text-slate-600">{question.testCase.explanation}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Code & Complexity */}
            {activeTab === "code" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-blue-600" /> Reference Implementation
                  </h3>
                  <div className="flex items-center gap-2">
                    {["java", "python", "cpp"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLanguage(lang)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg uppercase ${
                          codeLanguage === lang
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Block */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm p-4 sm:p-5 border border-slate-800">
                  <pre className="overflow-x-auto leading-relaxed">
                    <code>{displayCode}</code>
                  </pre>
                </div>

                {/* Complexity Analysis Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        Time Complexity
                      </h4>
                      <p className="text-sm font-semibold text-blue-600 mt-0.5">
                        {question.timeComplexity || "O(N) - Linear Time"}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Single pass traversal</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        Space Complexity
                      </h4>
                      <p className="text-sm font-semibold text-emerald-600 mt-0.5">
                        {question.spaceComplexity || "O(1) - Constant Space"}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">No auxiliary data structures</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: AI Placement Coach */}
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

            {/* Previous & Next Navigation Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              {prevQ ? (
                <Link
                  to={`/question/${prevQ.id}`}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px] sm:max-w-xs">{prevQ.question}</span>
                </Link>
              ) : (
                <div />
              )}

              {nextQ ? (
                <Link
                  to={`/question/${nextQ.id}`}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors ml-auto"
                >
                  <span className="truncate max-w-[150px] sm:max-w-xs">{nextQ.question}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>

          {/* Right Sidebar: Company & Topic Insights */}
          <div className="space-y-6">
            {/* Company Info Box */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Company Drive Profile
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 flex-shrink-0">
                  {domain ? (
                    <img
                      src={`https://logos.hunter.io/${domain}`}
                      alt={question.company}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{question.company}</h4>
                  <Link
                    to={`/company/${encodeURIComponent(question.company)}`}
                    className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    View all questions <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-2">
                <p>
                  CMRIT campus recruitment frequently features 3 primary rounds: Online Technical Assessment, Technical Interview, and HR / Cultural Fit.
                </p>
              </div>
            </div>

            {/* Related Questions from Same Company */}
            {relatedCompanyQuestions.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  More from {question.company}
                </h4>
                <div className="space-y-2">
                  {relatedCompanyQuestions.map((rq) => (
                    <Link
                      key={rq.id}
                      to={`/question/${rq.id}`}
                      className="block p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/60 hover:border-sky-200 transition-colors"
                    >
                      <p className="text-xs font-medium text-slate-800 line-clamp-2">
                        {rq.question}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {rq.type} · {rq.difficulty}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Questions in Same Topic */}
            {relatedTopicQuestions.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Related in {question.topic}
                </h4>
                <div className="space-y-2">
                  {relatedTopicQuestions.map((rq) => (
                    <Link
                      key={rq.id}
                      to={`/question/${rq.id}`}
                      className="block p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/60 hover:border-sky-200 transition-colors"
                    >
                      <p className="text-xs font-medium text-slate-800 line-clamp-2">
                        {rq.question}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {rq.company} · {rq.difficulty}
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
