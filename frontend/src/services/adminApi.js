const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

export async function adminRequest(
  endpoint,
  options = {}
) {
  const isFormData =
    options.body instanceof FormData;

  const headers = new Headers(options.headers);

  if (options.body && !isFormData) {
    if (!headers.has("Content-Type")) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, "")}${endpoint}`,
    {
      ...options,
      credentials: "include",
      headers,
    }
  );

  const contentType =
    response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.detail ||
      `Request failed (${response.status})`
    );
  }

  return data;
}