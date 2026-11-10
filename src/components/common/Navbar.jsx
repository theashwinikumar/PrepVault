import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Building2,
  Bookmark,
  Shield,
  Menu,
  X,
  Info,
  CheckCircle2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useBookmarks } from "../../hooks/useBookmarks";
import { useProgress } from "../../hooks/useProgress";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { bookmarks } = useBookmarks();
  const { completed } = useProgress();

  const navLinks = [
    { label: "Home", path: "/", icon: GraduationCap },
    { label: "Question Bank", path: "/questions", icon: BookOpen },
    { label: "Companies", path: "/companies", icon: Building2 },
    { label: "About CMRIT", path: "/about", icon: Info },
  ];

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      {/* Top micro announcement bar */}
      <div className="bg-[#0F2B48] text-white text-[11px] py-1 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-amber-400/30">
          <Sparkles className="w-3 h-3 text-amber-300" /> NAAC A++ ACCREDITED
        </span>
        <span className="hidden sm:inline text-slate-200">
          CMR Institute of Technology, Bengaluru · Ranked 7th Across Karnataka
        </span>
        <span className="text-sky-300 font-semibold underline decoration-sky-400/50 cursor-pointer" onClick={() => navigate("/questions")}>
          1,500+ Placement Questions
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none flex-shrink-0">
          <div className="relative flex items-center">
            <img
              src="/cmrit/cmrit-logo.png"
              alt="CMRIT Logo"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight group-hover:text-sky-600 transition-colors">
                CMRIT <span className="text-sky-600 font-semibold">Placement Hub</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide hidden sm:block">
              Department of Training & Placement · Bangalore
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  active
                    ? "bg-sky-50 text-sky-700 shadow-xs ring-1 ring-sky-200/70"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-sky-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Widgets */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Bookmarks Button */}
          <Link
            to="/questions?bookmarks=true"
            title="Saved Questions"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-medium transition-all shadow-2xs"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            <span className="hidden sm:inline">Saved</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
              {bookmarks.size}
            </span>
          </Link>

          {/* Quick Solved / Practiced Indicator */}
          <Link
            to="/questions?status=solved"
            title="Practiced Questions"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/60 text-xs font-medium transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Solved</span>
            <span className="bg-emerald-200/80 text-emerald-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
              {completed.size}
            </span>
          </Link>

          {/* Admin Access Button */}
          <Link
            to="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 active:scale-95 transition-all shadow-xs"
          >
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Admin Portal</span>
            <span className="sm:hidden">Admin</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-fadeIn shadow-lg">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-sky-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>CMRIT Placement & Training</span>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sky-600 font-medium hover:underline flex items-center gap-1"
            >
              <Shield className="w-3 h-3" /> Admin Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

