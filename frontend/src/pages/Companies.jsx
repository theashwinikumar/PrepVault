import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  Trophy,
  Briefcase,
  
  CheckCircle2,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useQuestionData } from "../hooks/useQuestionData";
import { COMPANY_DOMAINS } from "../utils/companyDomains";

function CompanyCard({ company }) {
  const [imgError, setImgError] = useState(false);
  const domain =
    COMPANY_DOMAINS[company.name] ||
    company.variants.map((v) => COMPANY_DOMAINS[v]).find(Boolean);

  return (
    <Link
      to={`/company/${company.slug}`}
      className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform flex-shrink-0">
            {domain && !imgError ? (
              <img
                src={`https://logos.hunter.io/${domain}`}
                alt={company.name}
                onError={() => setImgError(true)}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="font-bold text-slate-400 text-sm">
                {company.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 tabular-nums">
            {company.totalCount} Qs
          </span>
        </div>

        <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors line-clamp-1">
          {company.name}
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {company.years.length
            ? `${company.years.length} Drive Season${company.years.length === 1 ? "" : "s"}`
            : "Campus Recruiter"}
        </p>
      </div>

      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-sky-600">
        <span>Practice Round</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

export default function Companies() {
  const { companies, totals, loading } = useQuestionData(null);
  const [filter, setFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const shown = useMemo(() => {
    let list = companies;

    if (tierFilter === "top") {
      list = list.filter((c) => c.totalCount >= 40);
    } else if (tierFilter === "product") {
      const productKeywords = ["amazon", "google", "phonepe", "oracle", "sap", "epicor", "ellucian", "thermo"];
      list = list.filter((c) => productKeywords.some((pk) => c.name.toLowerCase().includes(pk)));
    } else if (tierFilter === "services") {
      const serviceKeywords = ["deloitte", "accenture", "cognizant", "infosys", "capgemini", "tcs", "wipro"];
      list = list.filter((c) => serviceKeywords.some((sk) => c.name.toLowerCase().includes(sk)));
    }

    const q = filter.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    return list;
  }, [companies, filter, tierFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#0F2B48] via-slate-900 to-sky-950 text-white rounded-3xl p-6 sm:p-10 shadow-md relative overflow-hidden">
          <div className="max-w-2xl space-y-3 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-xs font-semibold border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" /> CMRIT Campus Drives Archive
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
                <Trophy className="w-3.5 h-3.5 text-amber-300" /> NAAC A++ · Ranked 7th
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Recruiting Companies at CMRIT
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore 170+ multinational technology giants, product companies, and consulting firms that recruit from CMR Institute of Technology, complete with their previous year technical, coding, and HR questions.
            </p>

            <div className="flex items-center gap-6 pt-2 text-xs sm:text-sm text-sky-200">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-sky-400" />
                <span><strong>170+</strong> Recruiters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span><strong>{totals.total.toLocaleString()}</strong> Questions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span><strong>100%</strong> Free Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Tier Pills Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search companies by name (e.g. Deloitte, Amazon, Cognizant)..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Quick Tier Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All Companies" },
                { id: "top", label: "Top Volume (>40 Qs)" },
                { id: "product", label: "Product Giants" },
                { id: "services", label: "IT Services" },
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setTierFilter(tier.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${tierFilter === tier.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Company Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">No companies found</h3>
            <p className="text-xs text-slate-500">
              No company matched "{filter}". Try clearing your search term.
            </p>
            <button
              onClick={() => {
                setFilter("");
                setTierFilter("all");
              }}
              className="text-xs font-semibold text-sky-600 hover:underline"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {shown.map((c) => (
              <CompanyCard key={c.slug} company={c} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
