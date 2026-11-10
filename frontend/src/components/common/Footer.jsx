import { Link } from "react-router-dom";
import { GraduationCap, MapPin, Mail, Phone, Award, ShieldCheck, ExternalLink, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: College Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm tracking-tight">CMRIT Placements</h3>
                <p className="text-[11px] text-sky-400">Centre for Career Guidance</p>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Empowering CMRIT engineering students with authentic campus drive archives, previous years' interview questions, technical roadmaps, and placement coaching.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/50 p-2.5 rounded-xl">
              <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>NAAC A++ Accredited · Ranked 7th in Karnataka</span>
            </div>
          </div>

          {/* Col 2: Question Categories */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-slate-200">
              Question Bank
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link to="/questions?type=Technical" className="hover:text-white transition-colors">
                  Technical Round Questions
                </Link>
              </li>
              <li>
                <Link to="/questions?type=Programming" className="hover:text-white transition-colors">
                  Coding & Problem Solving
                </Link>
              </li>
              <li>
                <Link to="/questions?type=HR" className="hover:text-white transition-colors">
                  HR & Behavioral Interviews
                </Link>
              </li>
              <li>
                <Link to="/questions?topic=DBMS" className="hover:text-white transition-colors">
                  Core CS: DBMS, OS & Networks
                </Link>
              </li>
              <li>
                <Link to="/questions?bookmarks=true" className="hover:text-white transition-colors">
                  Your Bookmarked Revision List
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Key Recruiters */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-slate-200">
              Top Recruiters
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link to="/company/deloitte" className="hover:text-white transition-colors">
                  Deloitte Campus Questions
                </Link>
              </li>
              <li>
                <Link to="/company/cognizant" className="hover:text-white transition-colors">
                  Cognizant GenC & Elevate
                </Link>
              </li>
              <li>
                <Link to="/company/capgemini" className="hover:text-white transition-colors">
                  Capgemini Exceller Drive
                </Link>
              </li>
              <li>
                <Link to="/company/accenture" className="hover:text-white transition-colors">
                  Accenture ASE & FSE
                </Link>
              </li>
              <li>
                <Link to="/companies" className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors">
                  View All 170+ Companies <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Campus Contact & Address */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-slate-200">
              Placement Cell
            </h4>
            <div className="space-y-2 text-slate-400 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <span>CMR Institute of Technology, 132 AECS Layout, ITPL Main Road, Kundalahalli, Bengaluru, Karnataka 560037</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <a href="mailto:placements@cmrit.ac.in" className="hover:text-white transition-colors">
                  placements@cmrit.ac.in
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>+91 80 2852 4466</span>
              </div>
              <div className="pt-2">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Admin Access
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} CMR Institute of Technology, Bengaluru. All placement materials curated for student training.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-slate-400 transition-colors">
              About Placement Cell
            </Link>
            <span>·</span>
            <Link to="/questions" className="hover:text-slate-400 transition-colors">
              Question Archive
            </Link>
            <span>·</span>
            <span className="flex items-center gap-1 text-slate-400">
              Crafted for CMRITians <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

