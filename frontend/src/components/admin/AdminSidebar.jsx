import { NavLink, Link } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Layers,
  PlusCircle,
  CheckCircle,
  FilePenLine,
  Ban,
  UploadCloud,
  History,
  ArrowLeft,
  LogOut,
  X,
} from "lucide-react";

const menuGroups = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        path: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "QUESTION BANK",
    items: [
      {
        label: "All Questions",
        path: "/admin/questions",
        icon: Layers,
      },
      {
        label: "Create Question",
        path: "/admin/questions/create",
        icon: PlusCircle,
      },
      {
        label: "Published Questions",
        path: "/admin/questions/published",
        icon: CheckCircle,
      },
      {
        label: "Draft Questions",
        path: "/admin/questions/drafts",
        icon: FilePenLine,
      },
      {
        label: "Disabled Questions",
        path: "/admin/questions/disabled",
        icon: Ban,
      },
    ],
  },
  {
    title: "DATA MANAGEMENT",
    items: [
      {
        label: "Bulk Import",
        path: "/admin/import",
        icon: UploadCloud,
      },
      {
        label: "Import History",
        path: "/admin/import/history",
        icon: History,
      },
    ],
  },
];

export default function AdminSidebar({
  onLogout,
  onClose,
}) {
  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col border-r border-slate-800">

      {/* Logo */}

      <div className="flex items-center gap-3 p-6 border-b border-slate-800">

        <div className="bg-blue-600 p-2.5 rounded-xl">
          <GraduationCap size={25} />
        </div>

        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">
            Prep<span className="text-blue-400">Vault</span>
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Admin Workspace
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        )}

      </div>

      {/* Navigation */}

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-7">

        {menuGroups.map((group) => (
          <div key={group.title}>

            <p className="px-3 mb-3 text-[10px] font-bold tracking-widest text-slate-500">
              {group.title}
            </p>

            <div className="space-y-1">

              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`
                    }
                  >

                    <Icon size={18} />

                    <span>{item.label}</span>

                  </NavLink>
                );
              })}

            </div>

          </div>
        ))}

      </nav>

      {/* Bottom Section */}

      <div className="border-t border-slate-800 p-4 space-y-2">

        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to Website
        </Link>

        <button
          onClick={onLogout}
          disabled={!onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LogOut size={18} />
          Log Out
        </button>

        <p className="text-xs text-center text-slate-600 pt-3">
          PrepVault Admin Portal
        </p>

      </div>

    </aside>
  );
}