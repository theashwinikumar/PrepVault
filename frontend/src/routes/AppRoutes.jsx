import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home.jsx";
import QuestionBank from "../pages/QuestionBank.jsx";
import QuestionDetails from "../pages/QuestionDetails.jsx";
import About from "../pages/About.jsx";
import Companies from "../pages/Companies.jsx";
import CompanyPage from "../pages/CompanyPage.jsx";
import Admin from "../pages/admin/AdminImport.jsx";
import NotFound from "../pages/NotFound.jsx";

/**
 * Clean multi-page application routing table.
 * All payment & paywall features removed in favor of 100% free CMRIT placement access.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Home Page */}
      <Route path="/" element={<Home />} />

      {/* Question Bank Routes */}
      <Route path="/questions" element={<QuestionBank />} />
      <Route path="/question-bank" element={<QuestionBank />} />
      <Route path="/question/:id" element={<QuestionDetails />} />

      {/* College About & Placement Cell */}
      <Route path="/about" element={<About />} />

      {/* Company Pages */}
      <Route path="/companies" element={<Companies />} />
      <Route path="/company/:slug" element={<CompanyPage />} />
      <Route path="/company/:slug/:year" element={<CompanyPage />} />

      {/* Admin Portal */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/login" element={<Admin />} />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
