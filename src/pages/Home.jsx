import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Code2,
  Cpu,
  Users2,
  ArrowRight,
  Sparkles,
  Trophy,
  CheckCircle,
  ExternalLink,
  Flame,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import SearchBar from "../components/common/SearchBar";
import Button from "../components/common/Button";
import { getAllQuestions } from "../services/questionBankService";
import { COMPANY_DOMAINS } from "../utils/companyDomains";
import { slugify } from "../utils/slug";

export default function Home() {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState("");

  const allQuestions = useMemo(() => getAllQuestions(), []);

  // Compute stats
  const stats = useMemo(() => {
    const companies = new Set(allQuestions.map((q) => q.company).filter(Boolean));
    const technical = allQuestions.filter((q) => q.type === "Technical").length;
    const programming = allQuestions.filter((q) => q.type === "Programming").length;
    const hr = allQuestions.filter((q) => q.type === "HR").length;

    return {
      total: allQuestions.length,
      companiesCount: companies.size,
      technical,
      programming,
      hr,
    };
  }, [allQuestions]);

  // Top recruiting companies by question count
  const topCompanies = useMemo(() => {
    const counts = {};
    allQuestions.forEach((q) => {
      const c = (q.company || "").trim();
      if (!c || c === "General" || c.includes("Top Product")) return;
      counts[c] = (counts[c] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({
        name,
        slug: slugify(name),
        count,
        domain: COMPANY_DOMAINS[name] || COMPANY_DOMAINS[name.trim()] || null,
      }));
  }, [allQuestions]);

  // Featured Must Read questions
  const mustReadSpotlight = useMemo(() => {
    return allQuestions.filter((q) => q.isMustRead).slice(0, 4);
  }, [allQuestions]);

  const handleHeroSearch = (query) => {
    if (query && query.trim()) {
      navigate(`/questions?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate("/questions");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section with College Branding */}
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-[#F8FAFC] pt-10 pb-16 sm:pb-24 border-b border-slate-200/60">
          {/* Subtle geometric pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            {/* College Badges Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-sky-200 shadow-xs text-sky-800 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" /> CMR Institute of Technology, Bengaluru
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <Trophy className="w-3.5 h-3.5 text-amber-600" /> NAAC A++ Grade · 25th Year Legacy
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> 100% Free Academic Access
              </span>
            </div>

            {/* Main Title & Description */}
            <div className="text-center max-w-4xl mx-auto space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Placement Question Bank <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 bg-clip-text text-transparent">
                  For CMRIT Students
                </span>
              </h1>
              <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Prepare with authentic interview questions, technical rounds, coding problems, and HR insights collected directly from CMRIT campus recruitment drives.
              </p>

              {/* Main Search Bar Box */}
              <div className="pt-3 max-w-2xl mx-auto">
                <SearchBar
                  query={heroSearch}
                  onChange={setHeroSearch}
                  onSearchSubmit={handleHeroSearch}
                  placeholder="Search 1,500+ questions (e.g. DBMS Normalization, Cognizant, Two Sum)..."
                  className="shadow-md"
                />

                {/* Popular Tags */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-400">Popular:</span>
                  {["Cognizant", "Deloitte", "Capgemini", "Amazon", "DBMS", "OOPs", "HR Round"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => navigate(`/questions?q=${encodeURIComponent(tag)}`)}
                      className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200/80 hover:border-sky-300 hover:text-sky-600 transition-colors shadow-2xs"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Button
                  size="lg"
                  variant="college"
                  onClick={() => navigate("/questions")}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Explore Question Bank
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/companies")}
                  leftIcon={<Building2 className="w-4 h-4 text-slate-500" />}
                >
                  Browse 170+ Companies
                </Button>
              </div>
            </div>

            {/* Metrics & College Dashboard Stats Bar */}
            <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs text-center hover:border-sky-200 transition-all">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                  {stats.total.toLocaleString()}+
                </div>
                <div className="text-xs font-semibold text-sky-600 mt-1 uppercase tracking-wider">
                  Campus Questions
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Real interview archives</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs text-center hover:border-sky-200 transition-all">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                  170+
                </div>
                <div className="text-xs font-semibold text-blue-600 mt-1 uppercase tracking-wider">
                  Recruiting Companies
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">MNCs, Startups & Product giants</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs text-center hover:border-sky-200 transition-all">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                  ₹44.14 <span className="text-base font-bold text-slate-500">LPA</span>
                </div>
                <div className="text-xs font-semibold text-emerald-600 mt-1 uppercase tracking-wider">
                  Highest Package
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Top-tier product offers</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs text-center hover:border-sky-200 transition-all">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                  Ranked #7
                </div>
                <div className="text-xs font-semibold text-amber-600 mt-1 uppercase tracking-wider">
                  In Karnataka
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Education World Rankings</div>
              </div>
            </div>

            {/* College Campus Photo Showcase */}
            <div className="mt-12 rounded-3xl overflow-hidden border border-slate-200 shadow-md relative bg-slate-900 group">
              <img
                src="/cmrit/cmrit-campus.jpg"
                alt="CMRIT Campus Aerial View"
                className="w-full h-56 sm:h-80 object-cover object-center group-hover:scale-[1.01] transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-sky-300 text-xs font-bold uppercase tracking-wider">
                      CMR Institute of Technology · AECS Layout, ITPL Main Road, Bengaluru
                    </span>
                    <h3 className="text-lg sm:text-2xl font-bold mt-1">
                      Department of Career Guidance & Placement Cell
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
                      Preparing next-generation engineers for global IT careers with rigorous interview drills, mock assessments, and exhaustive question banks.
                    </p>
                  </div>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/30 transition-all"
                  >
                    About CMRIT Placement <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Core Placement Preparation Tracks */}
        <section className="py-16 bg-white border-b border-slate-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">
                Structured Campus Curriculum
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Explore Placement Categories
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Focused tracks designed to prepare students for each specific round of campus recruitment drives.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Track 1: Technical Rounds */}
              <div
                onClick={() => navigate("/questions?type=Technical")}
                className="group bg-gradient-to-b from-sky-50/50 to-white rounded-2xl p-6 border border-sky-100 hover:border-sky-300 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-sky-600 transition-colors">
                    Technical Rounds
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Over 800+ questions on DBMS, SQL queries, OOPs principles, Operating Systems, Computer Networks, and System Design.
                  </p>
                </div>
                <div className="pt-6 flex items-center justify-between text-xs font-semibold text-sky-600">
                  <span>{stats.technical} Questions</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Track 2: Coding & DSA */}
              <div
                onClick={() => navigate("/questions?type=Programming")}
                className="group bg-gradient-to-b from-blue-50/50 to-white rounded-2xl p-6 border border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                    Coding & DSA
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Programming challenges asked in online assessment tests: Arrays, Linked Lists, Trees, Graphs, DP, and String algorithms.
                  </p>
                </div>
                <div className="pt-6 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>{stats.programming} Questions</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Track 3: HR & Behavioral */}
              <div
                onClick={() => navigate("/questions?type=HR")}
                className="group bg-gradient-to-b from-purple-50/50 to-white rounded-2xl p-6 border border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-purple-600 transition-colors">
                    HR & Behavioral
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Master the STAR methodology for behavioral questions, leadership scenarios, strengths, weaknesses, and company-specific culture checks.
                  </p>
                </div>
                <div className="pt-6 flex items-center justify-between text-xs font-semibold text-purple-600">
                  <span>{stats.hr} Questions</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Track 4: Must-Read Core DSA Benchmark */}
              <div
                onClick={() => navigate("/questions?mustread=true")}
                className="group bg-gradient-to-b from-amber-50/50 to-white rounded-2xl p-6 border border-amber-200 hover:border-amber-300 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                    MUST READ
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-amber-600 transition-colors">
                    Core DSA Benchmark
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Hand-curated list of 29 essential LeetCode interview patterns with test cases, reference Java solutions, and complexity analysis.
                  </p>
                </div>
                <div className="pt-6 flex items-center justify-between text-xs font-semibold text-amber-600">
                  <span>29 Curated Problems</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top Recruiting Companies Grid */}
        <section className="py-16 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">
                  Campus Drive Archives
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  Top Recruiting Companies at CMRIT
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Explore question banks sorted by leading recruiters visiting CMRIT campus.
                </p>
              </div>
              <Link
                to="/companies"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3.5 py-2 rounded-xl border border-sky-200 transition-colors"
              >
                View All 170+ Companies <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {topCompanies.map((comp) => (
                <div
                  key={comp.name}
                  onClick={() => navigate(`/company/${comp.slug}`)}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 mb-3 group-hover:scale-105 transition-transform">
                    {comp.domain ? (
                      <img
                        src={`https://logos.hunter.io/${comp.domain}`}
                        alt={comp.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <span
                      style={{ display: comp.domain ? "none" : "flex" }}
                      className="w-full h-full items-center justify-center font-bold text-slate-400 text-sm"
                    >
                      {comp.name.charAt(0)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-1 group-hover:text-sky-600 transition-colors">
                    {comp.name}
                  </h4>
                  <span className="text-[11px] text-slate-400 mt-1 font-medium tabular-nums">
                    {comp.count} questions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Must Read DSA Questions Spotlight */}
        <section className="py-16 bg-white border-t border-slate-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                  High Frequency Problems
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  Must-Read Core DSA Questions
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Master these recurring LeetCode patterns frequently tested by Tier-1 recruiters at CMRIT.
                </p>
              </div>
              <Link
                to="/questions?mustread=true"
                className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl border border-amber-200 transition-colors"
              >
                View All 29 Benchmark Problems →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mustReadSpotlight.map((q) => (
                <div
                  key={q.id}
                  onClick={() => navigate(`/question/${q.id}`)}
                  className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 hover:border-amber-300 hover:bg-white hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-block bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {q.topic}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          q.difficulty === "Easy"
                            ? "bg-emerald-100 text-emerald-800"
                            : q.difficulty === "Medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base hover:text-sky-600 transition-colors">
                      {q.question}
                    </h4>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {q.problemStatement || q.answer}
                    </p>
                  </div>
                  <div className="pt-4 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-400">Reference Java solution included</span>
                    <span className="text-sky-600 font-semibold flex items-center gap-1">
                      Read Solution <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ready to Practice Callout */}
        <section className="py-16 bg-[#0F2B48] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-400/20 text-sky-300 text-xs font-semibold border border-sky-400/30">
              <Sparkles className="w-3.5 h-3.5" /> Department of Career Guidance
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Start Your Placement Journey Today
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Every question in this bank was asked to a senior in their actual interview at CMRIT. Study smarter, practice consistently, and secure your dream offer.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                size="lg"
                variant="primary"
                onClick={() => navigate("/questions")}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Go to Question Bank
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                onClick={() => navigate("/about")}
              >
                CMRIT Placement Info
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
