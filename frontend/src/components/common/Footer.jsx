
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import {
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  Award,
  Heart,
  Code2
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Column 1: College Information */}
          <div className="space-y-4">

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                <GraduationCap className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-bold text-white text-sm tracking-tight">
                  CMRIT Placements
                </h3>
                <p className="text-[11px] text-sky-400">
                  Centre for Career Guidance
                </p>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Empowering CMRIT engineering students with
              authentic campus drive archives, previous
              years' interview questions, technical
              roadmaps, and placement coaching.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/50 p-2.5 rounded-xl">
              <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />

              <span>
                NAAC A++ Accredited · Ranked 7th in Karnataka
              </span>
            </div>
          </div>

          {/* Column 2: Developers */}
          <div className="space-y-4">

            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-400" />

              <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
                Developed By
              </h4>
            </div>

            <div className="space-y-5">

              {/* Developer 1 */}
              <div className="space-y-1">
                <p className="font-semibold text-white text-sm">
                  Ankit Kumar
                </p>

                <a
                  href="mailto:ankit.ise24@cmrit.ac.in"
                  className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors break-all"
                >
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  ankit.ise24@cmrit.ac.in
                </a>
              </div>

              {/* Developer 2 */}
              <div className="space-y-1">
                <p className="font-semibold text-white text-sm">
                  Ashwini Kumar
                </p>

                <a
                  href="mailto:ashwini.ise24@cmrit.ac.in"
                  className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors break-all"
                >
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  ashwini.ise24@cmrit.ac.in
                </a>
              </div>

            </div>
          </div>

          {/* Column 3: Placement Cell */}
          <div className="space-y-3">

            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
              Placement Cell
            </h4>

            <div className="space-y-3 text-slate-400 text-xs">

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />

                <span>
                  CMR Institute of Technology,
                  132 AECS Layout, ITPL Main Road,
                  Kundalahalli, Bengaluru,
                  Karnataka 560037
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />

                <a
                  href="mailto:placements@cmrit.ac.in"
                  className="hover:text-white transition-colors"
                >
                  placements@cmrit.ac.in
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />

                <span>
                  +91 80 2852 4466
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">

          <div className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} CMR Institute
            of Technology, Bengaluru. All placement
            materials curated for student training.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">

            <Link
              to="/about"
              className="hover:text-slate-400 transition-colors"
            >
              About Placement Cell
            </Link>

            <span>·</span>

            <Link
  to="/questions"
  className="hover:text-slate-400 transition-colors"
>
  Question Archive
</Link>

<Link
  to="/admin/dashboard"
  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors"
>
  <ShieldCheck size={16} />
  Admin Portal
</Link>

            <span>·</span>

            <span className="flex items-center gap-1 text-slate-400">
              Crafted for CMRITians
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            </span>

          </div>
        </div>

      </div>
    </footer>
  );
}
