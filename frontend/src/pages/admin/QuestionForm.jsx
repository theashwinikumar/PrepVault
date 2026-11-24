import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useAdminQuestions } from "../../context/AdminQuestionContext";
import {
  findAdminQuestionById,
  createAdminQuestion,
  updateAdminQuestion,
  fetchTopics,
} from "../../services/adminApi";

const inputClass =
  "w-full border border-slate-300 rounded-lg px-4 py-3 " +
  "text-sm bg-white text-slate-900 outline-none " +
  "focus:ring-2 focus:ring-blue-400";

const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

const EMPTY_FORM = {
  question_text: "",
  subject_id: "",
  topic_id: "",
  difficulty: "medium",
  question_type: "theory",
  status: "draft",
  answer: "",
  explanation: "",
};

function mapQuestionToForm(q) {
  if (!q) return EMPTY_FORM;
  return {
    question_text: q.question_text || "",
    subject_id: q.subject_id ? String(q.subject_id) : "",
    topic_id: q.topic_id ? String(q.topic_id) : "",
    difficulty: q.difficulty ? String(q.difficulty).toLowerCase() : "medium",
    question_type: q.question_type ? String(q.question_type).toLowerCase() : "theory",
    status: q.status ? String(q.status).toLowerCase() : "draft",
    answer: q.answer || "",
    explanation: q.explanation || "",
  };
}

export default function QuestionForm() {
  const { id } = useParams();
  return <QuestionFormContent key={id || "create"} id={id} />;
}

function QuestionFormContent({ id }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const preloadedQuestion = location.state?.question || null;

  const {
    subjects,
    questionTypes,
    difficulties,
    statuses,
    getTopicsBySubject,
    refreshMetadata,
  } = useAdminQuestions();

  const [form, setForm] = useState(() =>
    isEdit && preloadedQuestion ? mapQuestionToForm(preloadedQuestion) : EMPTY_FORM
  );
  const [loadedKey, setLoadedKey] = useState(() =>
    !isEdit || preloadedQuestion ? id || "create" : ""
  );
  const [loadError, setLoadError] = useState("");
  const [subjectTopics, setSubjectTopics] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load question by ID when editing directly without router state
  useEffect(() => {
    if (!isEdit || preloadedQuestion) return undefined;

    const controller = new AbortController();
    findAdminQuestionById(id, { signal: controller.signal })
      .then((question) => {
        setForm(mapQuestionToForm(question));
        setLoadError("");
        setLoadedKey(id);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setLoadError(err.message || "Question not found.");
        setLoadedKey(id);
      });

    return () => controller.abort();
  }, [id, isEdit, preloadedQuestion]);

  // Fetch topics belonging to selected subject from FastAPI
  useEffect(() => {
    if (!form.subject_id) return undefined;

    const controller = new AbortController();
    fetchTopics({ subject_id: form.subject_id, signal: controller.signal })
      .then((rows) => {
        setSubjectTopics(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setSubjectTopics(null);
      });

    return () => controller.abort();
  }, [form.subject_id]);

  const availableTopics =
    form.subject_id && subjectTopics !== null
      ? subjectTopics
      : getTopicsBySubject(form.subject_id);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "subject_id") {
      setSubjectTopics(null);
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "subject_id" ? { topic_id: "" } : {}),
    }));

    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setError("");

    const trimmedQuestion = form.question_text.trim();
    if (!trimmedQuestion) {
      setError("Question text is required.");
      return;
    }

    if (!form.subject_id) {
      setError("Please select a subject.");
      return;
    }

    if (!form.topic_id) {
      setError("Please select a topic for the chosen subject.");
      return;
    }

    const selectedStatus = (
      e.nativeEvent.submitter?.value || form.status || "draft"
    ).toLowerCase();

    const payload = {
      subject_id: form.subject_id,
      topic_id: form.topic_id,
      question_text: trimmedQuestion,
      difficulty: form.difficulty,
      question_type: form.question_type,
      answer: form.answer.trim() || null,
      explanation: form.explanation.trim() || null,
      status: selectedStatus,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateAdminQuestion(id, payload);
        toast.success("Question updated successfully!");
      } else {
        await createAdminQuestion(payload);
        toast.success(
          selectedStatus === "published"
            ? "Question published successfully!"
            : "Draft saved successfully!"
        );
      }

      refreshMetadata();
      navigate("/admin/questions");
    } catch (err) {
      const errorMessage = err.message || "Unable to save question.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  const loadingQuestion = isEdit && loadedKey !== id;

  if (loadingQuestion) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
        Loading question details...
      </div>
    );
  }

  if (isEdit && loadError) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Question Not Found</h2>
        <p className="text-sm text-slate-500">{loadError}</p>
        <Link
          to="/admin/questions"
          className="text-blue-600 inline-block text-sm font-medium hover:underline"
        >
          ← Back to Question Management
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500">
        <Link to="/admin/questions" className="hover:text-blue-600">
          Question Management
        </Link>
        {" / "}
        {isEdit ? "Edit Question" : "Create Question"}
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {isEdit ? "Edit Question" : "Create New Question"}
        </h1>
        <p className="text-slate-500 mt-2">
          {isEdit
            ? "Update the question details in the database."
            : "Add a new question to the PrepVault question bank."}
        </p>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl shadow-sm"
      >
        <div className="p-7 space-y-6">
          {/* Question Text */}
          <div>
            <label htmlFor="question_text" className={labelClass}>
              Question Text *
            </label>
            <textarea
              id="question_text"
              name="question_text"
              rows={4}
              required
              placeholder="Enter your question here..."
              value={form.question_text}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Subject and Topic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="subject_id" className={labelClass}>
                Subject *
              </label>
              <select
                id="subject_id"
                name="subject_id"
                required
                value={form.subject_id}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="topic_id" className={labelClass}>
                Topic *
              </label>
              <select
                id="topic_id"
                name="topic_id"
                required
                disabled={!form.subject_id}
                value={form.topic_id}
                onChange={handleChange}
                className={`${inputClass} disabled:bg-slate-100 disabled:cursor-not-allowed`}
              >
                <option value="">
                  {form.subject_id ? "Select Topic" : "Select a subject first"}
                </option>
                {availableTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty and Question Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="difficulty" className={labelClass}>
                Difficulty *
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={form.difficulty}
                onChange={handleChange}
                className={inputClass}
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="question_type" className={labelClass}>
                Question Type *
              </label>
              <select
                id="question_type"
                name="question_type"
                value={form.question_type}
                onChange={handleChange}
                className={inputClass}
              >
                {questionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Answer */}
          <div>
            <label htmlFor="answer" className={labelClass}>
              Answer
            </label>
            <textarea
              id="answer"
              name="answer"
              rows={4}
              placeholder="Enter the correct answer..."
              value={form.answer}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Explanation */}
          <div>
            <label htmlFor="explanation" className={labelClass}>
              Explanation
            </label>
            <textarea
              id="explanation"
              name="explanation"
              rows={6}
              placeholder="Provide a detailed explanation of the answer..."
              value={form.explanation}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className={labelClass}>
              Question Status
            </label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className={inputClass}
            >
              {statuses
                .filter((s) => isEdit || s.value !== "disabled")
                .map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm"
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-wrap justify-between items-center gap-3 border-t border-slate-200 p-6">
          <Link
            to="/admin/questions"
            className="border border-slate-300 rounded-lg px-5 py-3 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Link>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              value="draft"
              disabled={submitting}
              className="border border-blue-600 text-blue-600 rounded-lg px-5 py-3 text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Draft"}
            </button>

            <button
              type="submit"
              value={isEdit ? form.status : "published"}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-3 text-sm font-medium disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Publish Question"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
