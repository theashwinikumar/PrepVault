import { Link } from "react-router-dom";
import { GraduationCap, Home, BookOpen, Building2 } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Button from "../components/common/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100">
            <GraduationCap className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">
              Error 404
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Page Not Found
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              The placement resource or page you are looking for does not exist or may have been moved.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link to="/">
              <Button variant="college" size="md" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
                Go to Home
              </Button>
            </Link>
            <Link to="/questions">
              <Button variant="outline" size="md" className="w-full" leftIcon={<BookOpen className="w-4 h-4" />}>
                Browse Question Bank
              </Button>
            </Link>
            <Link to="/companies">
              <Button variant="ghost" size="sm" className="w-full" leftIcon={<Building2 className="w-4 h-4" />}>
                Explore Recruiting Companies
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
