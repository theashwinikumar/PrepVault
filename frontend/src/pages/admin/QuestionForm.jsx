import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAdminQuestions } from "../../context/AdminQuestionContext";

const inputClass =
  "w-full border border-slate-300 rounded-lg px-4 py-3 " +
  "text-sm bg-white text-slate-900 outline-none " +
  "focus:ring-2 focus:ring-blue-400";

const labelClass =
  "block text-sm font-semibold text-slate-700 mb-2";

export default function QuestionForm() {
  const { id } = useParams();

  return <QuestionFormContent key={id || "create"} id={id} />;
}

function QuestionFormContent({ id }) {
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const {
    subjects,
    questionTypes,
    difficulties,
    statuses,
    getTopicsBySubject,
    getSubjectName,
    getTopicName,
    getQuestion,
    createQuestion,
    updateQuestion,
    checkDuplicate,
  } = useAdminQuestions();

  const existingQuestion = isEdit
    ? getQuestion(id)
    : null;

  const [form, setForm] = useState(() => ({
    question: "",
    subject_id: "",
    topic_id: "",
    difficulty: "Medium",
    question_type: "descriptive",
    status: "Draft",
    answer: "",
    explanation: "",
    tags: "",
    ...(existingQuestion || {}),
  }));

  const [duplicates, setDuplicates] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Topics belonging to the selected subject

  const availableTopics = getTopicsBySubject(
    form.subject_id
  );

  // Handle form changes

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "subject_id"
        ? { topic_id: "" }
        : {}),
    }));

    setMessage("");
    setError("");
    setDuplicates([]);
  }

  // Duplicate detection

  function handleDuplicateCheck() {
    setError("");
    setMessage("");

    if (!form.question.trim()) {
      setError("Please enter a question first.");
      return;
    }

    const matches = checkDuplicate(
      form.question,
      id
    );

    setDuplicates(matches);

    if (matches.length === 0) {
      setMessage("No exact duplicate question found.");
    }
  }

  // Create or update question

function handleSubmit(e) {
  e.preventDefault();

  setError("");
  setMessage("");

  const selectedStatus =
    e.nativeEvent.submitter?.value ||
    form.status;

  const matches = checkDuplicate(
    form.question,
    id
  );

  if (matches.length > 0) {
    setDuplicates(matches);

    setError(
      "Please resolve the duplicate question."
    );

    toast.error(
      "Duplicate question detected."
    );

    return;
  }

  const questionData = {
    ...form,
    question: form.question.trim(),
    subject_id: Number(form.subject_id),
    topic_id: Number(form.topic_id),
    answer: form.answer.trim(),
    explanation: form.explanation.trim(),
    status: selectedStatus,
  };

  try {
    if (isEdit) {
      updateQuestion(id, questionData);

      toast.success(
        "Question updated successfully!"
      );

    } else {
      createQuestion(questionData);

      if (selectedStatus === "Published") {
        toast.success(
          "Question published successfully!"
        );
      } else {
        toast.success(
          "Draft saved successfully!"
        );
      }
    }

    navigate("/admin/questions");

  } catch (err) {
    const errorMessage =
      err.message || "Unable to save question.";

    setError(errorMessage);

    toast.error(errorMessage);
  }
}

  // Invalid question ID

  if (isEdit && !existingQuestion) {
    return (
      <div className="bg-white border rounded-xl p-8">
        <h2 className="text-xl font-bold text-slate-900">
          Question Not Found
        </h2>

        <Link
          to="/admin/questions"
          className="text-blue-600 inline-block mt-4"
        >
          Back to Question Management
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Breadcrumb */}

      <div className="text-sm text-slate-500">
        <Link
          to="/admin/questions"
          className="hover:text-blue-600"
        >
          Question Management
        </Link>

        {" / "}

        {isEdit ? "Edit Question" : "Create Question"}
      </div>

      {/* Heading */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {isEdit
            ? "Edit Question"
            : "Create New Question"}
        </h1>

        <p className="text-slate-500 mt-2">
          {isEdit
            ? "Update the existing question details."
            : "Add a new question to the PrepVault question bank."}
        </p>
      </div>

      {/* Demo Notice */}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        Frontend preview mode. Questions are saved locally
        in your browser. No backend connection is active.
      </div>

      {/* Main Form */}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl shadow-sm"
      >

        <div className="p-7 space-y-6">

          {/* Question Text */}

          <div>
            <label
              htmlFor="question"
              className={labelClass}
            >
              Question Text *
            </label>

            <textarea
              id="question"
              name="question"
              rows={4}
              required
              placeholder="Enter your question here..."
              value={form.question}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Subject and Topic */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label
                htmlFor="subject_id"
                className={labelClass}
              >
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
                <option value="">
                  Select Subject
                </option>

                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="topic_id"
                className={labelClass}
              >
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
                  {form.subject_id
                    ? "Select Topic"
                    : "Select a subject first"}
                </option>

                {availableTopics.map((topic) => (
                  <option
                    key={topic.id}
                    value={topic.id}
                  >
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Difficulty and Question Type */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label
                htmlFor="difficulty"
                className={labelClass}
              >
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
                  <option
                    key={difficulty}
                    value={difficulty}
                  >
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="question_type"
                className={labelClass}
              >
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
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Answer */}

          <div>
            <label
              htmlFor="answer"
              className={labelClass}
            >
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

            <p className="text-xs text-slate-500 mt-2">
              An answer is required before publishing.
            </p>
          </div>

          {/* Explanation */}

          <div>
            <label
              htmlFor="explanation"
              className={labelClass}
            >
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
            <label
              htmlFor="status"
              className={labelClass}
            >
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
                .filter(
                  (status) =>
                    isEdit || status !== "Disabled"
                )
                .map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
            </select>
          </div>

          {/* Tags */}

          <div>
            <label
              htmlFor="tags"
              className={labelClass}
            >
              Tags (Optional)
            </label>

            <input
              id="tags"
              name="tags"
              placeholder="e.g. java, oops, interview"
              value={form.tags}
              onChange={handleChange}
              className={inputClass}
            />

            <p className="text-xs text-slate-500 mt-2">
              Separate tags using commas.
            </p>
          </div>

          {/* Duplicate Detection Warning */}

          {duplicates.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-4">

              <h3 className="font-bold text-amber-800">
                Duplicate Question Detected
              </h3>

              <p className="text-sm text-amber-700">
                Matching questions already exist in the
                question bank.
              </p>

              {duplicates.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-amber-200 rounded-lg p-4"
                >

                  <p className="font-semibold text-slate-900">
                    {item.question}
                  </p>

                  <p className="text-sm text-slate-500 mt-2">
                    {getSubjectName(item.subject_id)}
                    {" · "}
                    {getTopicName(item.topic_id)}
                    {" · "}
                    {item.status}
                  </p>

                  <Link
                    to={`/admin/questions/${item.id}/edit`}
                    className="text-blue-600 text-sm inline-block mt-3"
                  >
                    Open Existing Question
                  </Link>

                </div>
              ))}

            </div>
          )}

          {/* Error Message */}

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm"
            >
              {error}
            </div>
          )}

          {/* Success Message */}

          {message && (
            <div
              role="status"
              className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-sm"
            >
              {message}
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
              type="button"
              onClick={handleDuplicateCheck}
              className="border border-slate-300 text-slate-700 rounded-lg px-5 py-3 text-sm font-medium hover:bg-slate-100"
            >
              Check Duplicate
            </button>

            <button
              type="submit"
              value="Draft"
              className="border border-blue-600 text-blue-600 rounded-lg px-5 py-3 text-sm font-medium hover:bg-blue-50"
            >
              Save Draft
            </button>

            <button
              type="submit"
              value={isEdit ? form.status : "Published"}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-3 text-sm font-medium"
            >
              {isEdit
                ? "Save Changes"
                : "Publish Question"}
            </button>

          </div>

        </div>

      </form>

    </div>
  );
} 