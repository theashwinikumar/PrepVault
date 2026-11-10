import {
  Award,
  Trophy,
  GraduationCap,
  CheckCircle2,
  Users2,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Sparkles,
  Briefcase,
  Target,
  FileCheck,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Button from "../components/common/Button";

export default function About() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Header */}
        <section className="bg-gradient-to-b from-sky-50 via-white to-[#F8FAFC] py-14 sm:py-20 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-sky-200 text-sky-800 text-xs font-semibold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" /> CMR Institute of Technology, Bengaluru
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  <Trophy className="w-3.5 h-3.5 text-amber-600" /> NAAC A++ Accredited
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                About CMRIT Placement Cell
              </h1>
              <p className="text-sm sm:text-lg text-slate-600 leading-relaxed">
                Empowering future-ready engineering leaders through rigorous industry training, verified campus drive question archives, and direct partnerships with 170+ global recruiters.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content: Badges and Campus Showcase */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
            {/* 3 Prominent Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Badge 1: 25 Years & NAAC A++ */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center p-2">
                    <img
                      src="/cmrit/cmrit-logo.png"
                      alt="CMRIT Swan Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    NAAC A++ Accreditation
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    CMRIT has been awarded the prestigious <strong>A++ Grade by NAAC</strong>, recognizing academic rigor, modern research infrastructure, and stellar campus placement records.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 text-xs font-semibold text-sky-700">
                  Celebrating 25 Years of Excellence
                </div>
              </div>

              {/* Badge 2: Ranked 7th in Karnataka */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Ranked #7 in Karnataka
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Ranked 7th among private engineering institutions across Karnataka by <strong>Education World 2024–25 Rankings</strong>, reflecting student industry-readiness.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 text-xs font-semibold text-amber-700">
                  Top Tier Engineering Institution
                </div>
              </div>

              {/* Badge 3: 170+ Recruiting Partners */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    170+ Recruiting Partners
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Hosting top product organizations, Fortune 500 tech consulting leaders, and cutting-edge startups on campus annually.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 text-xs font-semibold text-emerald-700">
                  Highest CTC ₹44.14 LPA
                </div>
              </div>
            </div>

            {/* Campus Visual & Rank Badge Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-slate-200 shadow-md">
                <img
                  src="/cmrit/cmrit-campus.jpg"
                  alt="CMRIT Main Campus Aerial"
                  className="w-full h-80 object-cover object-center"
                />
              </div>

              <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white p-4 flex flex-col items-center justify-center text-center">
                <img
                  src="/cmrit/cmrit-rank7.png"
                  alt="CMRIT Ranked 7th"
                  className="w-full h-72 object-contain"
                />
              </div>
            </div>

            {/* Placement Cell Structure & Roadmap */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs space-y-8">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">
                  Our Mission & Methodology
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  How CMRIT Prepares Students for Placements
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-base">
                      Core Technical Foundations
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Rigorous coursework and placement labs in DBMS, Operating Systems, Computer Networks, and Object-Oriented Software Engineering (Java / C++).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-base">
                      Previous Years' Archive Testing
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Continuous practice on real questions collected from actual CMRIT recruitment drives over the past five seasons.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <Users2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-base">
                      Mock Interviews & Soft Skills
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      One-on-one mock rounds conducted with industry mentors, senior alumni, and training faculty to master technical articulation and HR behavioral questions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-base">
                      100% Free & Open Access
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      All question banks, notes, solutions, and practice tracking features are completely free for all CMRIT engineering students.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Campus Info */}
            <div className="bg-[#0F2B48] text-white rounded-3xl p-8 sm:p-12 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-sky-300 text-xs font-bold uppercase tracking-wider">
                    Get in Touch
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold">
                    Department of Career Guidance & Placement
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Have questions about upcoming placement drives, recruitment schedules, or question contributions? Contact the placement cell office.
                  </p>
                  <div className="space-y-2 text-xs sm:text-sm text-slate-300 pt-2">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      <span>CMRIT Campus, 132 AECS Layout, ITPL Main Road, Kundalahalli, Bengaluru 560037</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      <a href="mailto:placements@cmrit.ac.in" className="hover:text-white underline">
                        placements@cmrit.ac.in
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      <span>+91 80 2852 4466 / 4477</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-4 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
                  <GraduationCap className="w-12 h-12 text-sky-400" />
                  <h4 className="font-bold text-lg">Ready to start practicing?</h4>
                  <p className="text-xs text-slate-300">
                    Dive into over 1,500+ authentic questions and benchmark problems right now.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => window.location.href = "/questions"}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Open Question Bank
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
