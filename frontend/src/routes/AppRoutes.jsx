import QuestionForm from "../pages/admin/QuestionForm.jsx";
import BulkImport from "../pages/admin/BulkImport.jsx";
import ImportHistory from "../pages/admin/ImportHistory.jsx";

import QuestionManagement from "../pages/admin/QuestionManagement.jsx";
import AdminLayout from "../components/admin/AdminLayout.jsx";
import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home.jsx";
import QuestionBank from "../pages/QuestionBank.jsx";
import QuestionDetails from "../pages/QuestionDetails.jsx";
import About from "../pages/About.jsx";
import Companies from "../pages/Companies.jsx";
import CompanyPage from "../pages/CompanyPage.jsx";
import Admin from "../pages/admin/AdminImport.jsx";
import NotFound from "../pages/NotFound.jsx";

// New Placement Experience Form
import PlacementFeedback from "../pages/PlacementFeedback.jsx";

/**
 * CMRIT Placement Hub - Application Routes
 * Public placement preparation and feedback pages.
 * Existing admin functionality remains unchanged.
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

      {/* NEW: Public Placement Experience Form */}
      <Route
        path="/share-experience"
        element={<PlacementFeedback />}
      />

      {/* Admin Portal - Existing Functionality Preserved */}
      <Route path="/admin" element={<Admin />} />
     <Route element={<AdminLayout />}>

  <Route
    path="/admin/preview"
    element={<AdminDashboard />}
  />

  <Route
    path="/admin/dashboard"
    element={<AdminDashboard />}
  />

  <Route
    path="/admin/questions"
    element={<QuestionManagement />}
  />

  <Route
  path="/admin/import"
  element={<BulkImport />}
/>

<Route
  path="/admin/import/history"
  element={<ImportHistory />}
/>


  <Route
  path="/admin/questions/create"
  element={<QuestionForm key="create" />}
/>

<Route
  path="/admin/questions/:id/edit"
  element={<QuestionForm key="edit" />}
/>

  <Route
    path="/admin/questions/published"
    element={
      <QuestionManagement initialStatus="published" />
    }
  />

  <Route
    path="/admin/questions/drafts"
    element={
      <QuestionManagement initialStatus="draft" />
    }
  />

  <Route
    path="/admin/questions/disabled"
    element={
      <QuestionManagement initialStatus="disabled" />
    }
  />

</Route>
      <Route path="/login" element={<Admin />} />


      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
