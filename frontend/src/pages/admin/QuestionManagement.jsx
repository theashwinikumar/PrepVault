import { useState, useEffect } from "react";
import ConfirmModal from "../../components/admin/ConfirmModal";
import { Link } from "react-router-dom";
import { useAdminQuestions } from "../../context/AdminQuestionContext";
import toast from "react-hot-toast";

const statusColors = {
  Published: "bg-green-100 text-green-700",
  Draft: "bg-amber-100 text-amber-700",
  Disabled: "bg-red-100 text-red-700",
};

const difficultyColors = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

const inputClass =
  "border border-slate-300 rounded-lg px-3 py-2.5 " +
  "text-sm bg-white text-slate-700 outline-none " +
  "focus:ring-2 focus:ring-blue-400";

export default function QuestionManagement({
  initialStatus = "",
}) {
  const {
    questions,
    subjects,
    topics,
    questionTypes,
    difficulties,
    statuses,
    stats,
    getSubjectName,
    getTopicName,
    publishQuestion,
    disableQuestion,
    bulkUpdateStatus,
  } = useAdminQuestions();

  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [status, setStatus] = useState(initialStatus);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [selectedQuestionId, setSelectedQuestionId] =
    useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const selectedQuestion = questions.find(
    (q) => q.id === selectedQuestionId
  );

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    subjectId,
    topicId,
    difficulty,
    questionType,
    status,
    pageSize,
  ]);

  // Dependent topic filter

  const availableTopics = topics.filter(
    (topic) =>
      !subjectId ||
      topic.subject_id === Number(subjectId)
  );

  // Search and filter questions

  const filteredQuestions = questions.filter((q) => {
    return (
      q.question
        .toLowerCase()
        .includes(search.trim().toLowerCase()) &&

      (!subjectId ||
        q.subject_id === Number(subjectId)) &&

      (!topicId ||
        q.topic_id === Number(topicId)) &&

      (!difficulty ||
        q.difficulty === difficulty) &&

      (!questionType ||
        q.question_type === questionType) &&

      (!status ||
        q.status === status)
    );
  });

  // Pagination

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuestions.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleQuestions = filteredQuestions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset filters

function toggleQuestionSelection(id) {
  setSelectedIds((previous) =>
    previous.includes(id)
      ? previous.filter((item) => item !== id)
      : [...previous, id]
  );
}
function toggleSelectAll() {
  const visibleIds = visibleQuestions.map((q) => q.id);

  setSelectedIds((previous) =>
    visibleIds.every((id) => previous.includes(id))
      ? previous.filter((id) => !visibleIds.includes(id))
      : [...new Set([...previous, ...visibleIds])]
  );
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
    question: `${selectedIds.length} selected questions`,
  });
}

function clearSelection() {
  setSelectedIds([]);
}
   {
    setSearch("");
    setSubjectId("");
    setTopicId("");
    setDifficulty("");
    setQuestionType("");
    setStatus(initialStatus);
    setPage(1);
  }

  // Publish and disable operations

  function handleStatusChange(id, newStatus) {
  setMessage("");
  setError("");

  const question = questions.find(
    (q) => q.id === id
  );

  if (!question) {
    setError("Question not found.");
    return;
  }

  setConfirmAction({
    id,
    newStatus,
    question: question.question,
  });
}

function closeConfirmModal() {
  setConfirmAction(null);
}

function executeStatusChange() {
  if (!confirmAction) return;

  const { id, newStatus, bulk, ids } = confirmAction;

  try {
    if (bulk) {
      const result = bulkUpdateStatus(ids, newStatus);

      if (result.updated > 0) {
        toast.success(
          `${result.updated} questions ${newStatus.toLowerCase()} successfully!`
        );
      }

      if (result.skipped > 0) {
        toast(
          `${result.skipped} questions skipped because they were not eligible.`,
          { icon: "⚠️" }
        );
      }

      setSelectedIds([]);

    } else if (newStatus === "Published") {
      publishQuestion(id);

      toast.success(
        "Question published successfully!"
      );

    } else if (newStatus === "Disabled") {
      disableQuestion(id);

      toast.success(
        "Question disabled successfully!"
      );
    }

  } catch (err) {
    toast.error(
      err.message || "Unable to update questions."
    );

  } finally {
    setConfirmAction(null);
  }
}

  function getQuestionTypeLabel(value) {
    return (
      questionTypes.find(
        (type) => type.value === value
      )?.label || value
    );
  }

  const statCards = [
    {
      title: "Total Questions",
      value: stats.total,
      color: "text-slate-900",
    },
    {
      title: "Published",
      value: stats.published,
      color: "text-green-600",
    },
    {
      title: "Drafts",
      value: stats.drafts,
      color: "text-amber-600",
    },
    {
      title: "Disabled",
      value: stats.disabled,
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Page Header */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {initialStatus
              ? `${initialStatus} Questions`
              : "Question Management"}
          </h1>

          <p className="text-slate-500 mt-2">
            Create, organize and manage your question bank.
          </p>
        </div>

        <Link
          to="/admin/questions/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium"
        >
          + Create Question
        </Link>

      </div>

      {/* Demo Notice */}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        Frontend preview mode. All questions and changes
        are stored locally in your browser.
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">
              {stat.title}
            </p>

            <h2
              className={`text-3xl font-bold mt-3 ${stat.color}`}
            >
              {stat.value}
            </h2>
          </div>
        ))}

      </div>

      {/* Success and Error Messages */}

      {message && (
        <div
          role="status"
          className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4"
        >
          {error}
        </div>
      )}

      {/* Question Management Panel */}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">

        {/* Search */}

        <div className="p-5 border-b border-slate-200 space-y-4">

          <input
            type="text"
            aria-label="Search questions"
            placeholder="Search by question text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} w-full`}
          />

          {/* Filters */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">

            {/* Subject */}

            <select
              aria-label="Subject"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setTopicId("");
              }}
              className={inputClass}
            >
              <option value="">All Subjects</option>

              {subjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {subject.name}
                </option>
              ))}
            </select>

            {/* Topic */}

            <select
              aria-label="Topic"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className={inputClass}
            >
              <option value="">All Topics</option>

              {availableTopics.map((topic) => (
                <option
                  key={topic.id}
                  value={topic.id}
                >
                  {topic.name}
                </option>
              ))}
            </select>

            {/* Difficulty */}

            <select
              aria-label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className={inputClass}
            >
              <option value="">All Difficulties</option>

              {difficulties.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {/* Question Type */}

            <select
              aria-label="Question type"
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className={inputClass}
            >
              <option value="">All Question Types</option>

              {questionTypes.map((type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </option>
              ))}
            </select>

            {/* Status */}

            <select
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              <option value="">All Statuses</option>

              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {/* Clear Filters */}

            <button
              onClick={clearFilters}
              className="border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Clear Filters
            </button>

          </div>
        </div>

        {/* Question Table */}

        {selectedIds.length > 0 && (
  <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border-b border-blue-200 px-5 py-4">

    <p className="text-sm font-semibold text-blue-700">
      {selectedIds.length} questions selected
    </p>

    <div className="flex flex-wrap items-center gap-3">

      <button
        type="button"
        onClick={() => handleBulkAction("Published")}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
      >
        Publish Selected
      </button>

      <button
        type="button"
        onClick={() => handleBulkAction("Disabled")}
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

        <div className="overflow-x-auto">

          <table className="w-full text-sm text-left">

            <thead className="bg-slate-50 text-slate-600">

              <tr>
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

              {visibleQuestions.map((q) => (
                <tr
                  key={q.id}
                  className="hover:bg-slate-50"
                >
                    <td className="px-4 py-4">
  <input
    type="checkbox"
    aria-label={`Select question ${q.id}`}
    checked={selectedIds.includes(q.id)}
    onChange={() => toggleQuestionSelection(q.id)}
    className="w-4 h-4 accent-blue-600 cursor-pointer"
  />
</td>

                  <td
                    className="px-4 py-4 text-slate-500"
                    title={q.id}
                  >
                    {q.id.slice(0, 8)}
                  </td>

                  <td className="px-4 py-4 min-w-56 font-medium text-slate-900">
                    {q.question}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {getSubjectName(q.subject_id)}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {getTopicName(q.topic_id)}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {getQuestionTypeLabel(q.question_type)}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[q.difficulty]}`}
                    >
                      {q.difficulty}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[q.status]}`}
                    >
                      {q.status}
                    </span>
                  </td>

                  {/* Actions */}

                  <td className="px-4 py-4">

                    <div className="flex flex-wrap gap-3">

                      <button
                        onClick={() =>
                          setSelectedQuestionId(q.id)
                        }
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>

                      <Link
                        to={`/admin/questions/${q.id}/edit`}
                        className="text-slate-600 hover:underline"
                      >
                        Edit
                      </Link>

                      {q.status === "Draft" && (
                        <button
                          onClick={() =>
                            handleStatusChange(
                              q.id,
                              "Published"
                            )
                          }
                          className="text-green-600 hover:underline"
                        >
                          Publish
                        </button>
                      )}

                      {q.status !== "Disabled" && (
                        <button
                          onClick={() =>
                            handleStatusChange(
                              q.id,
                              "Disabled"
                            )
                          }
                          className="text-red-600 hover:underline"
                        >
                          Disable
                        </button>
                      )}

                    </div>

                  </td>

                </tr>
              ))}

              {visibleQuestions.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-16 text-slate-500"
                  >
                    No questions found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>
        </div>

        {/* Pagination */}

        <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-t border-slate-200">

          <p className="text-sm text-slate-500">
            Showing{" "}
            {filteredQuestions.length
              ? (currentPage - 1) * pageSize + 1
              : 0}
            {" "}–{" "}
            {Math.min(
              currentPage * pageSize,
              filteredQuestions.length
            )}
            {" "}of {filteredQuestions.length} questions
          </p>

          <div className="flex items-center gap-3">

            <select
              aria-label="Questions per page"
              value={pageSize}
              onChange={(e) =>
                setPageSize(Number(e.target.value))
              }
              className={inputClass}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <button
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="border rounded-lg px-3 py-2 disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm font-medium">
              {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
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
                aria-label="Close"
                onClick={() => setSelectedQuestionId(null)}
                className="text-2xl text-slate-500"
              >
                ×
              </button>

            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-5">
              {selectedQuestion.question}
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">

              <p>
                Subject:{" "}
                {getSubjectName(
                  selectedQuestion.subject_id
                )}
              </p>

              <p>
                Topic:{" "}
                {getTopicName(
                  selectedQuestion.topic_id
                )}
              </p>

              <p>
                Difficulty: {selectedQuestion.difficulty}
              </p>

              <p>
                Status: {selectedQuestion.status}
              </p>

              <p>
                Type:{" "}
                {getQuestionTypeLabel(
                  selectedQuestion.question_type
                )}
              </p>

            </div>

            <div className="mt-6 bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">
                Answer
              </h4>

              <p className="text-slate-700 whitespace-pre-wrap">
                {selectedQuestion.answer || "No answer provided."}
              </p>
            </div>

            <div className="mt-4 bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">
                Explanation
              </h4>

              <p className="text-slate-700 whitespace-pre-wrap">
                {selectedQuestion.explanation ||
                  "No explanation provided."}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">

              <Link
                to={`/admin/questions/${selectedQuestion.id}/edit`}
                className="border border-slate-300 rounded-lg px-5 py-2 text-slate-700"
              >
                Edit Question
              </Link>

              <button
                onClick={() => setSelectedQuestionId(null)}
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
    ? confirmAction.newStatus === "Disabled"
      ? "Disable selected questions?"
      : "Publish selected questions?"
    : confirmAction?.newStatus === "Disabled"
      ? "Disable this question?"
      : "Publish this question?"
}

description={
  confirmAction?.newStatus === "Disabled"
    ? "Eligible questions will be disabled without being permanently deleted."
    : "Draft questions with an answer will be published. Ineligible questions will be skipped."
}
        question={confirmAction?.question}
        confirmText={
          confirmAction?.newStatus === "Disabled"
            ? "Disable Question"
            : "Publish Question"
        }
        variant={
          confirmAction?.newStatus === "Disabled"
            ? "danger"
            : "success"
        }
        onConfirm={executeStatusChange}
        onCancel={closeConfirmModal}
      />

    </div>
  );
}