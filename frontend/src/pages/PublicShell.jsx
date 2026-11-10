import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

/**
 * PublicShell provides a unified, college-branded layout for public subpages.
 */
export default function PublicShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-slate-800">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
