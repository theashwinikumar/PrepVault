import {
  QUESTION_TYPES,
  DIFFICULTIES,
  formatQuestionType,
  formatDifficulty,
  fetchSubjects,
  fetchTopics,
  fetchCompanies,
  fetchStatisticsOverview,
  fetchQuestionById,
} from "./questionApi";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const QUESTION_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "disabled", label: "Disabled" },
];

const STATUS_LABELS = Object.fromEntries(
  QUESTION_STATUSES.map((s) => [s.value, s.label])
);

export function formatStatus(value) {
  if (!value) return "Draft";
  return STATUS_LABELS[String(value).toLowerCase()] || value;
}

export {
  QUESTION_TYPES,
  DIFFICULTIES,
  formatQuestionType,
  formatDifficulty,
  fetchSubjects,
  fetchTopics,
  fetchCompanies,
  fetchStatisticsOverview,
};

export async function adminRequest(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (isJson && (data?.detail || data?.message)) ||
      `Request failed (${response.status})`;
    const err = new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
    err.status = response.status;
    throw err;
  }

  if (!isJson) {
    throw new Error(
      "Unexpected response from server. Please ensure the FastAPI backend is running."
    );
  }

  return data;
}

function buildQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      sp.set(key, String(value));
    }
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function fetchAdminQuestions({
  subject_id,
  topic_id,
  difficulty,
  question_type,
  company_id,
  status,
  search,
  skip = 0,
  limit = 20,
  signal,
} = {}) {
  const qs = buildQuery({
    subject_id,
    topic_id,
    difficulty: difficulty ? String(difficulty).toLowerCase() : undefined,
    question_type: question_type ? String(question_type).toLowerCase() : undefined,
    company_id,
    status: status ? String(status).toLowerCase() : undefined,
    search: search?.trim() || undefined,
    skip,
    limit,
  });

  return adminRequest(`/api/questions/manage${qs}`, {
    method: "GET",
    signal,
  });
}

export async function findAdminQuestionById(questionId, { signal } = {}) {
  // Try published detail endpoint first, then fall back to scanning /manage for drafts/disabled
  try {
    return await fetchQuestionById(questionId, { signal });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
  }

  const batchSize = 100;
  let skip = 0;
  while (true) {
    const batch = await fetchAdminQuestions({ skip, limit: batchSize, signal });
    if (!Array.isArray(batch) || batch.length === 0) break;
    const found = batch.find((item) => String(item.id) === String(questionId));
    if (found) return found;
    if (batch.length < batchSize) break;
    skip += batchSize;
  }

  const notFound = new Error("Question not found");
  notFound.status = 404;
  throw notFound;
}

export function createAdminQuestion(payload) {
  return adminRequest("/api/questions/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminQuestion(questionId, payload) {
  return adminRequest(`/api/questions/${encodeURIComponent(questionId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function publishAdminQuestion(questionId) {
  return adminRequest(`/api/questions/${encodeURIComponent(questionId)}/publish`, {
    method: "PATCH",
  });
}

export function disableAdminQuestion(questionId) {
  return adminRequest(`/api/questions/${encodeURIComponent(questionId)}/disable`, {
    method: "PATCH",
  });
}

export function bulkImportQuestions(file) {
  const formData = new FormData();
  formData.append("file", file);
  return adminRequest("/api/imports/questions", {
    method: "POST",
    body: formData,
  });
}

export function fetchImportHistory({ signal } = {}) {
  return adminRequest("/api/imports/", {
    method: "GET",
    signal,
  });
}

export function fetchImportBatchById(batchId, { signal } = {}) {
  return adminRequest(`/api/imports/${encodeURIComponent(batchId)}`, {
    method: "GET",
    signal,
  });
}
