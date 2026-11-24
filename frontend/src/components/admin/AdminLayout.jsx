import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, ShieldCheck } from "lucide-react";
import { Toaster } from "react-hot-toast";

import AdminSidebar from "./AdminSidebar";
import { AdminQuestionProvider } from "../../context/AdminQuestionContext";

const pageTitles = {
  "/admin/preview": "Dashboard",
  "/admin/dashboard": "Dashboard",
  "/admin/questions": "Question Management",
  "/admin/questions/create": "Create Question",
  "/admin/questions/published": "Published Questions",
  "/admin/questions/drafts": "Draft Questions",
  "/admin/questions/disabled": "Disabled Questions",
  "/admin/import": "Bulk Import",
  "/admin/import/history": "Import History",
};

export default function AdminLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();

  const pageTitle =
    pageTitles[location.pathname] ||
    (location.pathname.endsWith("/edit")
      ? "Edit Question"
      : "Admin Portal");

  return (
    <AdminQuestionProvider>
        <Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      borderRadius: "12px",
      background: "#ffffff",
      color: "#0f172a",
      border: "1px solid #e2e8f0",
      padding: "14px 18px",
    },
  }}
/>

      <div className="min-h-screen bg-slate-100">

        {/* Mobile Overlay */}

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Responsive Sidebar */}

        <div
          className={`fixed top-0 left-0 z-50 transform transition-transform duration-300 ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <AdminSidebar
            onLogout={onLogout}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main Workspace */}

        <div className="lg:ml-64 min-h-screen flex flex-col min-w-0">

          {/* Header */}

          <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4">

            <div className="flex items-center justify-between gap-4">

              {/* Left Header */}

              <div className="flex items-center gap-4">

                <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                  aria-expanded={sidebarOpen}
                  className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                >
                  <Menu size={23} />
                </button>

                <div>

                  <p className="text-xs text-slate-500">
                    Admin Workspace
                  </p>

                  <h2 className="text-sm sm:text-base font-semibold text-slate-900 mt-1">
                    {pageTitle}
                  </h2>

                </div>

              </div>

              {/* Right Header */}

              <div className="flex items-center gap-4">

                <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg text-xs font-medium">

                  <ShieldCheck size={15} />

                  Live API

                </div>

                <div className="hidden sm:block text-right">

                  <p className="text-sm font-semibold text-slate-900">
                    Administrator
                  </p>

                  <p className="text-xs text-slate-500">
                    Admin Workspace
                  </p>

                </div>

                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold border border-blue-200">
                  A
                </div>

              </div>

            </div>

          </header>

          {/* Page Content */}

          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>

          {/* Footer */}

          <footer className="px-6 py-4 border-t border-slate-200 text-center text-xs text-slate-500">
            PrepVault · Admin Management System
          </footer>

        </div>

      </div>

    </AdminQuestionProvider>
  );
}