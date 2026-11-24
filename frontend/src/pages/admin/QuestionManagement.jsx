import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/admin/ConfirmModal";
import { useAdminQuestions } from "../../context/AdminQuestionContext";
import {
  fetchAdminQuestions,
  fetchTopics,
  publishAdminQuestion,
  disableAdminQuestion,
  formatQuestionType,
  formatDifficulty,
  formatStatus,
} from "../../services/adminApi";

const statusColors = {
  published: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
  disabled: "bg-red-100 text-red-700",
};

const difficultyColors = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

const inputClass =
  "border border-slate-300 rounded-lg px-3 py-2.5 " +
  "text-sm bg-white text-slate-700 outline-none " +
  "focus:ring-2 focus:ring-blue-400";

export default function QuestionManagement({ initialStatus = "" }) {
  const normalizedInitialStatus = initialStatus
    ? String(initialStatus).toLowerCase()
    : "";

  const {
    subjects,
    topics: allTopics,
    overview,
    questionTypes,
    difficulties,
    statuses,
    getSubjectName,
    getTopicName,
    refreshMetadata,
  } = useAdminQuestions();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [status, setStatus] = useState(normalizedInitialStatus);
  const [prevInitialStatus, setPrevInitialStatus] = useState(normalizedInitialStatus);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reloadTick, setReloadTick] = useState(0);

  // Sync status when navigating between /admin/questions, /published, /drafts, /disabled
  if (normalizedInitialStatus !== prevInitialStatus) {
    setPrevInitialStatus(normalizedInitialStatus);
    setStatus(normalizedInitialStatus);
    setPage(1);
  }

  // Subject-dependent topics fetched from FastAPI
  const [subjectTopics, setSubjectTopics] = useState(null);

  // Question list state keyed by requestKey
  const [listState, setListState] = useState({
    key: "",
    items: [],
    hasNextPage: false,
    error: "",
  });

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Debounce search input
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === debouncedSearch) return undefined;

    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, debouncedSearch]);

  // Fetch topics belonging to selected subject
  useEffect(() => {
    if (!subjectId) return undefined;

    const controller = new AbortController();
    fetchTopics({ subject_id: subjectId, signal: controller.signal })
      .then((rows) => {
        setSubjectTopics(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setSubjectTopics([]);
      });

    return () => controller.abort();
  }, [subjectId]);

  const availableTopics = useMemo(() => {
    if (!subjectId) return allTopics;
    if (subjectTopics !== null) return subjectTopics;
    return allTopics.filter((t) => String(t.subject_id) === String(subjectId));
  }, [subjectId, subjectTopics, allTopics]);

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        subject_id: subjectId || undefined,
        topic_id: topicId || undefined,
        difficulty: difficulty || undefined,
        question_type: questionType || undefined,
        status: status || undefined,
        search: debouncedSearch || undefined,
        skip: (page - 1) * pageSize,
        limit: pageSize + 1,
        reloadTick,
      }),
    [
      subjectId,
      topicId,
      difficulty,
      questionType,
      status,
      debouncedSearch,
      page,
      pageSize,
      reloadTick,
    ]
  );

  // Fetch questions from /api/questions/manage
  useEffect(() => {
    const controller = new AbortController();

    fetchAdminQuestions({
      subject_id: subjectId || undefined,
      topic_id: topicId || undefined,
      difficulty: difficulty || undefined,
      question_type: questionType || undefined,
      status: status || undefined,
      search: debouncedSearch || undefined,
      skip: (page - 1) * pageSize,
      limit: pageSize + 1,
      signal: controller.signal,
    })
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        setListState({
          key: requestKey,
          items: list.slice(0, pageSize),
          hasNextPage: list.length > pageSize,
          error: "",
        });
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setListState({
          key: requestKey,
          items: [],
          hasNextPage: false,
          error: err.message || "Failed to load questions from FastAPI.",
        });
      });

    return () => controller.abort();
  }, [
    requestKey,
    subjectId,
    topicId,
    difficulty,
    questionType,
    status,
    debouncedSearch,
    page,
    pageSize,
  ]);

  const loading = listState.key !== requestKey;
  const visibleQuestions = listState.items;
  const apiError = listState.key === requestKey ? listState.error : "";

  function clearFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setSubjectId("");
    setTopicId("");
    setSubjectTopics(null);
    setDifficulty("");
    setQuestionType("");
    setStatus(normalizedInitialStatus);
    setPage(1);
    setSelectedIds([]);
  }

  function toggleQuestionSelection(id) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function toggleSelectAll() {
    const visibleIds = visibleQuestions.map((q) => q.id);
    if (visibleIds.length === 0) return;

    setSelectedIds((previous) =>
      visibleIds.every((id) => previous.includes(id))
        ? previous.filter((id) => !visibleIds.includes(id))
        : [...new Set([...previous, ...visibleIds])]
    );
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function handleBulkAction(newStatus) {
    if (selectedIds.length === 0) {
      toast.error("Please select questions first.");
      return;
    }

    setConfirmAction({
      bulk: true,
      ids: [...selectedIds],
      newStatus,
      question: `${selectedIds.length} selected question(s)`,
    });
  }

  function handleStatusChange(question, newStatus) {
    setConfirmAction({
      id: question.id,
      newStatus,
      question: question.question_text,
    });
  }

  function closeConfirmModal() {
    if (actionLoading) return;
    setConfirmAction(null);
  }

  async function executeStatusChange() {
    if (!confirmAction || actionLoading) return;

    const { id, newStatus, bulk, ids } = confirmAction;
    setActionLoading(true);

    try {
      if (bulk) {
        const eligible = visibleQuestions.filter((q) => {
          if (!ids.includes(q.id)) return false;
          if (newStatus === "published") return q.status !== "published";
          return q.status !== "disabled";
        });

        if (eligible.length === 0) {
          toast("No selected questions are eligible for this action.");
          setConfirmAction(null);
          return;
        }

        const results = await Promise.allSettled(
          eligible.map((q) =>
            newStatus === "published"
              ? publishAdminQuestion(q.id)
              : disableAdminQuestion(q.id)
          )
        );

        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.length - succeeded;

        if (succeeded > 0) {
          toast.success(
            `${succeeded} question(s) ${newStatus === "published" ? "published" : "disabled"} successfully.`
          );
        }
        if (failed > 0) {
          toast.error(`${failed} question(s) failed to update.`);
        }

        setSelectedIds([]);
      } else if (newStatus === "published") {
        await publishAdminQuestion(id);
        toast.success("Question published successfully!");
      } else if (newStatus === "disabled") {
        await disableAdminQuestion(id);
        toast.success("Question disabled successfully!");
      }

      setConfirmAction(null);
      setReloadTick((t) => t + 1);
      refreshMetadata();
    } catch (err) {
      toast.error(err.message || "Unable to update question status.");
    } finally {
      setActionLoading(false);
    }
  }

  const statCards = [
    {
      title: "Published Questions",
      value: overview?.total_questions ?? "—",
      color: "text-green-600",
    },
    {
      title: "Total Subjects",
      value: overview?.total_subjects ?? subjects.length,
      color: "text-slate-900",
    },
    {
      title: "Total Topics",
      value: overview?.total_topics ?? allTopics.length,
      color: "text-blue-600",
    },
    {
      title: "Total Companies",
      value: overview?.total_companies ?? "—",
      color: "text-indigo-600",
    },
  ];

  const allVisibleSelected =
    visibleQuestions.length > 0 &&
    visibleQuestions.every((q) => selectedIds.includes(q.id));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {normalizedInitialStatus
              ? `${formatStatus(normalizedInitialStatus)} Questions`
              : "Question Management"}
          </h1>
          <p className="text-slate-500 mt-2">
            Create, search, filter, publish, and disable questions stored in the database.
          </p>
        </div>

        <Link
          to="/admin/questions/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium"
        >
          + Create Question
        </Link>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.title}</p>
            <h2 className={`text-3xl font-bold mt-3 ${stat.color}`}>
              {stat.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Question Management Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Search & Filters */}
        <div className="p-5 border-b border-slate-200 space-y-4">
          <input
            type="text"
            aria-label="Search questions"
            placeholder="Search by question text..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`${inputClass} w-full`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
            {/* Subject */}
            <select
              aria-label="Subject"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setTopicId("");
                setSubjectTopics(null);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            {/* Topic (dependent on Subject) */}
            <select
              aria-label="Topic"
              value={topicId}
              onChange={(e) => {
                setTopicId(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">
                {subjectId ? "All Subject Topics" : "All Topics"}
              </option>
              {availableTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>

            {/* Difficulty */}
            <select
              aria-label="Difficulty"
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All Difficulties</option>
              {difficulties.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* Question Type */}
            <select
              aria-label="Question type"
              value={questionType}
              onChange={(e) => {
                setQuestionType(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All Question Types</option>
              {questionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              aria-label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All Statuses</option>
              {statuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              type="button"
              onClick={clearFilters}
              className="border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border-b border-blue-200 px-5 py-4">
            <p className="text-sm font-semibold text-blue-700">
              {selectedIds.length} question(s) selected
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleBulkAction("published")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Publish Selected
              </button>

              <button
                type="button"
                onClick={() => handleBulkAction("disabled")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Disable Selected
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="text-blue-600 hover:underline text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* API Error Banner */}
        {apiError && !loading && (
          <div
            role="alert"
            className="m-5 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <span>{apiError}</span>
            <button
              type="button"
              onClick={() => setReloadTick((t) => t + 1)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Question Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-4">
                  <input
                    type="checkbox"
                    aria-label="Select all visible questions"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </th>
                {[
                  "ID",
                  "Question",
                  "Subject",
                  "Topic",
                  "Type",
                  "Difficulty",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-4 font-semibold whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-500">
                    Loading questions...
                  </td>
                </tr>
              ) : visibleQuestions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-500">
                    No questions found matching your filters.
                  </td>
                </tr>
              ) : (
                visibleQuestions.map((q) => {
                  const statusKey = String(q.status || "draft").toLowerCase();
                  const diffKey = String(q.difficulty || "medium").toLowerCase();

                  return (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          aria-label={`Select question ${q.id}`}
                          checked={selectedIds.includes(q.id)}
                          onChange={() => toggleQuestionSelection(q.id)}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-4 text-slate-500 font-mono text-xs" title={q.id}>
                        {String(q.id).slice(0, 8)}
                      </td>

                      <td className="px-4 py-4 min-w-56 max-w-md font-medium text-slate-900">
                        <p className="line-clamp-2">{q.question_text}</p>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {getSubjectName(q.subject_id)}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {getTopicName(q.topic_id)}
                      </td>

                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                        {formatQuestionType(q.question_type)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            difficultyColors[diffKey] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {formatDifficulty(q.difficulty)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusColors[statusKey] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {formatStatus(q.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedQuestion(q)}
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </button>

                          <Link
                            to={`/admin/questions/${q.id}/edit`}
                            state={{ question: q }}
                            className="text-slate-600 hover:underline"
                          >
                            Edit
                          </Link>

                          {statusKey !== "published" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(q, "published")}
                              className="text-green-600 hover:underline"
                            >
                              Publish
                            </button>
                          )}

                          {statusKey !== "disabled" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(q, "disabled")}
                              className="text-red-600 hover:underline"
                            >
                              Disable
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            {visibleQuestions.length > 0
              ? `Showing ${(page - 1) * pageSize + 1} – ${(page - 1) * pageSize + visibleQuestions.length} (Page ${page})`
              : `Page ${page}`}
          </p>

          <div className="flex items-center gap-3">
            <select
              aria-label="Questions per page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className={inputClass}
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            <button
              type="button"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border rounded-lg px-3 py-2 disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm font-medium">Page {page}</span>

            <button
              type="button"
              disabled={!listState.hasNextPage || loading}
              onClick={() => setPage((p) => p + 1)}
              className="border rounded-lg px-3 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Question Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Question details"
            className="bg-white rounded-xl p-7 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Question Details
              </h2>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelectedQuestion(null)}
                className="text-2xl text-slate-500"
              >
                ×
              </button>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-5 whitespace-pre-wrap">
              {selectedQuestion.question_text}
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <p>Subject: {getSubjectName(selectedQuestion.subject_id)}</p>
              <p>Topic: {getTopicName(selectedQuestion.topic_id)}</p>
              <p>Difficulty: {formatDifficulty(selectedQuestion.difficulty)}</p>
              <p>Status: {formatStatus(selectedQuestion.status)}</p>
              <p>Type: {formatQuestionType(selectedQuestion.question_type)}</p>
            </div>

            <div className="mt-6 bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Answer</h4>
              <p className="text-slate-700 whitespace-pre-wrap">
                {selectedQuestion.answer || "No answer provided."}
              </p>
            </div>

            <div className="mt-4 bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Explanation</h4>
              <p className="text-slate-700 whitespace-pre-wrap">
                {selectedQuestion.explanation || "No explanation provided."}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Link
                to={`/admin/questions/${selectedQuestion.id}/edit`}
                state={{ question: selectedQuestion }}
                className="border border-slate-300 rounded-lg px-5 py-2 text-slate-700"
              >
                Edit Question
              </Link>

              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                className="bg-blue-600 text-white rounded-lg px-5 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={
          confirmAction?.bulk
            ? confirmAction.newStatus === "disabled"
              ? "Disable selected questions?"
              : "Publish selected questions?"
            : confirmAction?.newStatus === "disabled"
              ? "Disable this question?"
              : "Publish this question?"
        }
        description={
          confirmAction?.newStatus === "disabled"
            ? "Disabled questions are hidden from the student Question Bank without being permanently deleted."
            : "Publishing makes the question visible in the student Question Bank."
        }
        question={confirmAction?.question}
        confirmText={
          confirmAction?.newStatus === "disabled"
            ? "Disable Question"
            : "Publish Question"
        }
        variant={confirmAction?.newStatus === "disabled" ? "danger" : "success"}
        loading={actionLoading}
        onConfirm={executeStatusChange}
        onCancel={closeConfirmModal}
      />
    </div>
  );
}
