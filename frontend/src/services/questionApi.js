const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const QUESTION_TYPES = [
  { value: "theory", label: "Theory" },
  { value: "mcq", label: "MCQ" },
  { value: "coding", label: "Coding" },
  { value: "output_based", label: "Output-based" },
  { value: "multiple_select", label: "Multiple-select" },
];

export const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const QUESTION_TYPE_LABELS = Object.fromEntries(
  QUESTION_TYPES.map((t) => [t.value, t.label])
);

const DIFFICULTY_LABELS = Object.fromEntries(
  DIFFICULTIES.map((d) => [d.value, d.label])
);

export function isValidQuestionType(value) {
  return Boolean(value && Object.hasOwn(QUESTION_TYPE_LABELS, String(value).toLowerCase()));
}

export function isValidDifficulty(value) {
  return Boolean(value && Object.hasOwn(DIFFICULTY_LABELS, String(value).toLowerCase()));
}

export function formatQuestionType(value) {
  if (!value) return "Theory";
  const key = String(value).toLowerCase();
  return QUESTION_TYPE_LABELS[key] || value;
}

export function formatDifficulty(value) {
  if (!value) return "Medium";
  const key = String(value).toLowerCase();
  return DIFFICULTY_LABELS[key] || value;
}

async function apiGet(path, { params, signal } = {}) {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });
  }

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (isJson && (data?.detail || data?.message)) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (!isJson) {
    throw new Error(
      "Unexpected response from server. Please ensure the FastAPI backend is running."
    );
  }

  return data;
}

export function fetchPublishedQuestions({
  subject_id,
  topic_id,
  company_id,
  difficulty,
  question_type,
  search,
  skip = 0,
  limit = 20,
  signal,
} = {}) {
  return apiGet("/api/questions/", {
    params: {
      subject_id,
      topic_id,
      company_id,
      difficulty: isValidDifficulty(difficulty) ? String(difficulty).toLowerCase() : undefined,
      question_type: isValidQuestionType(question_type)
        ? String(question_type).toLowerCase()
        : undefined,
      search: search?.trim() || undefined,
      skip,
      limit,
    },
    signal,
  });
}

export function fetchQuestionById(questionId, { signal } = {}) {
  return apiGet(`/api/questions/${encodeURIComponent(questionId)}`, { signal });
}

export function fetchRelatedQuestions(questionId, { limit = 5, signal } = {}) {
  return apiGet(`/api/questions/${encodeURIComponent(questionId)}/related`, {
    params: { limit },
    signal,
  });
}

export function fetchSubjects({ signal } = {}) {
  return apiGet("/api/subjects/", { signal });
}

export function fetchTopics({ subject_id, signal } = {}) {
  return apiGet("/api/topics/", {
    params: { subject_id: subject_id || undefined },
    signal,
  });
}

export function fetchCompanies({ signal } = {}) {
  return apiGet("/api/companies/", { signal });
}

export function fetchStatisticsOverview({ signal } = {}) {
  return apiGet("/api/statistics/overview", { signal });
}
