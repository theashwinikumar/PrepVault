import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAdminQuestions } from "../../context/AdminQuestionContext";
import { fetchAdminQuestions } from "../../services/adminApi";

export default function AdminDashboard() {
  const {
    overview,
    subjects,
    topics,
    companies,
    metadataLoading,
    metadataError,
    refreshMetadata,
  } = useAdminQuestions();

  const [statusCounts, setStatusCounts] = useState({
    loaded: false,
    published: 0,
    draft: 0,
    disabled: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    Promise.all([
      fetchAdminQuestions({ status: "published", limit: 100, signal }).catch(() => []),
      fetchAdminQuestions({ status: "draft", limit: 100, signal }).catch(() => []),
      fetchAdminQuestions({ status: "disabled", limit: 100, signal }).catch(() => []),
    ]).then(([pubRows, draftRows, disabledRows]) => {
      setStatusCounts({
        loaded: true,
        published: Array.isArray(pubRows) ? pubRows.length : 0,
        draft: Array.isArray(draftRows) ? draftRows.length : 0,
        disabled: Array.isArray(disabledRows) ? disabledRows.length : 0,
      });
    });

    return () => controller.abort();
  }, []);

  const publishedTotal = overview?.total_questions ?? statusCounts.published;
  const totalSampled =
    publishedTotal + statusCounts.draft + statusCounts.disabled;

  const questionStats = [
    {
      title: "Published Questions",
      value: metadataLoading ? "..." : publishedTotal,
      color: "text-green-600",
      icon: "✓",
    },
    {
      title: "Draft Questions",
      value: statusCounts.loaded ? statusCounts.draft : "...",
      color: "text-amber-600",
      icon: "✎",
    },
    {
      title: "Disabled Questions",
      value: statusCounts.loaded ? statusCounts.disabled : "...",
      color: "text-red-600",
      icon: "⊘",
    },
    {
      title: "Total Subjects",
      value: metadataLoading ? "..." : (overview?.total_subjects ?? subjects.length),
      color: "text-slate-900",
      icon: "▤",
    },
  ];

  const overviewStats = [
    {
      title: "Total Subjects",
      value: metadataLoading ? "..." : (overview?.total_subjects ?? subjects.length),
      icon: "▤",
    },
    {
      title: "Total Topics",
      value: metadataLoading ? "..." : (overview?.total_topics ?? topics.length),
      icon: "☷",
    },
    {
      title: "Total Companies",
      value: metadataLoading ? "..." : (overview?.total_companies ?? companies.length),
      icon: "▦",
    },
  ];

  const quickActions = [
    {
      title: "Create Question",
      description: "Add a new question to the question bank.",
      path: "/admin/questions/create",
      icon: "+",
    },
    {
      title: "Manage Questions",
      description: "Search, filter, edit, publish, and disable questions.",
      path: "/admin/questions",
      icon: "☷",
    },
    {
      title: "Bulk Import",
      description: "Import questions using CSV or XLSX files.",
      path: "/admin/import",
      icon: "↑",
    },
    {
      title: "Import History",
      description: "Review previous question import batches.",
      path: "/admin/import/history",
      icon: "↺",
    },
  ];

  function percentage(value) {
    if (!totalSampled) return 0;
    return (value / totalSampled) * 100;
  }

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-2">
            Manage and monitor your PrepVault question bank.
          </p>
        </div>

        <Link
          to="/admin/questions/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium"
        >
          + Create Question
        </Link>
      </div>

      {metadataError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center justify-between gap-4"
        >
          <span>{metadataError}</span>
          <button
            type="button"
            onClick={refreshMetadata}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Question Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {questionStats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
              <span className={`text-xl ${stat.color}`}>{stat.icon}</span>
            </div>
            <h2 className={`text-4xl font-bold mt-4 ${stat.color}`}>
              {stat.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Question Bank Overview */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-5">
          Question Bank Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {overviewStats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
                <span className="text-xl text-blue-600">{stat.icon}</span>
              </div>
              <h2 className="text-4xl font-bold text-blue-600 mt-4">
                {stat.value}
              </h2>
            </div>
          ))}
        </div>
      </div>

      {/* Question Status Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Question Status Distribution
        </h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Overview of published, draft and disabled questions.
        </p>

        <div className="flex h-5 w-full rounded-full overflow-hidden bg-slate-100">
          <div
            className="bg-green-500"
            style={{ width: `${percentage(publishedTotal)}%` }}
          />
          <div
            className="bg-amber-500"
            style={{ width: `${percentage(statusCounts.draft)}%` }}
          />
          <div
            className="bg-red-500"
            style={{ width: `${percentage(statusCounts.disabled)}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
          <div>
            <p className="text-sm text-green-600 font-medium">● Published</p>
            <p className="text-xl font-bold text-slate-900 mt-2">
              {publishedTotal} questions
            </p>
            <p className="text-sm text-slate-500">
              {percentage(publishedTotal).toFixed(1)}%
            </p>
          </div>

          <div>
            <p className="text-sm text-amber-600 font-medium">● Drafts</p>
            <p className="text-xl font-bold text-slate-900 mt-2">
              {statusCounts.draft} questions
            </p>
            <p className="text-sm text-slate-500">
              {percentage(statusCounts.draft).toFixed(1)}%
            </p>
          </div>

          <div>
            <p className="text-sm text-red-600 font-medium">● Disabled</p>
            <p className="text-xl font-bold text-slate-900 mt-2">
              {statusCounts.disabled} questions
            </p>
            <p className="text-sm text-slate-500">
              {percentage(statusCounts.disabled).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-5">Quick Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.path}
              className="border border-slate-200 rounded-lg p-5 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl text-blue-600">{action.icon}</span>
                <h3 className="font-semibold text-slate-900">{action.title}</h3>
              </div>
              <p className="text-sm text-slate-500 mt-3">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
