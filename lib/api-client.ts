import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/errors/api-error";
import { ApiClientError } from "@/lib/errors/api-client-error";

type FetchOptions = RequestInit & {
  params?: Record<string, string | undefined>;
  _retry?: boolean;
  _csrfRetry?: boolean;
};

const STATUS_MESSAGES: Record<number, string> = {
  400: "Bad request. Please check your input and try again.",
  401: "Authentication required. Please sign in again.",
  403: "You do not have permission to access this resource.",
  404: "The requested API endpoint or resource was not found.",
  409: "This action conflicts with existing data.",
  422: "Validation failed. Please correct the highlighted fields.",
  429: "Too many requests. Please slow down and try again.",
  500: "Server error. Please try again later.",
  502: "The server is temporarily unavailable.",
  503: "The service is temporarily unavailable.",
};

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as ApiErrorResponse).success === false &&
    "error" in value &&
    typeof (value as ApiErrorResponse).error?.code === "string" &&
    typeof (value as ApiErrorResponse).error?.message === "string"
  );
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as ApiSuccessResponse<T>).success === true &&
    "data" in value
  );
}

async function readResponseBody(response: Response): Promise<{ parsed: unknown; text: string }> {
  const text = await response.text();
  if (!text.trim()) {
    return { parsed: null, text: "" };
  }
  try {
    return { parsed: JSON.parse(text), text };
  } catch {
    return { parsed: null, text };
  }
}

function extractErrorFromBody(parsed: unknown, response: Response): {
  code: string;
  message: string;
  details?: unknown;
} {
  if (isApiErrorResponse(parsed)) {
    return {
      code: parsed.error.code,
      message: parsed.error.message,
      details: parsed.error.details,
    };
  }

  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.message === "string") {
      return { code: "HTTP_ERROR", message: obj.message };
    }
    if (typeof obj.error === "string") {
      return { code: "HTTP_ERROR", message: obj.error };
    }
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (parsed === null && contentType.includes("text/html")) {
    return {
      code: "INVALID_RESPONSE",
      message:
        "The API endpoint may be incorrect or unavailable. The server returned HTML instead of JSON.",
    };
  }

  if (parsed === null) {
    return {
      code: "PARSE_ERROR",
      message: `Could not read the server response (HTTP ${response.status}).`,
    };
  }

  return {
    code: "HTTP_ERROR",
    message: STATUS_MESSAGES[response.status] ?? `Request failed (HTTP ${response.status}).`,
  };
}

async function handleResponse<T>(response: Response, endpoint: string): Promise<T> {
  const { parsed } = await readResponseBody(response);

  if (!response.ok) {
    const err = extractErrorFromBody(parsed, response);
    throw new ApiClientError(err.code, err.message, response.status, err.details, endpoint);
  }

  if (!isApiSuccessResponse<T>(parsed)) {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      "API returned an unexpected response format. The endpoint may be misconfigured or mapped incorrectly.",
      response.status,
      parsed,
      endpoint
    );
  }

  return parsed.data;
}

function buildUrl(url: string, params?: Record<string, string | undefined>): string {
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "" && value !== "undefined") {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getCsrfFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)talentiq_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/csrf", { credentials: "include" });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.token ?? getCsrfFromCookie();
  } catch {
    return null;
  }
}

async function resolveCsrfToken(method: string, forceRefresh = false): Promise<string | null> {
  if (!MUTATING.has(method)) return null;
  if (!forceRefresh) {
    const cached = getCsrfFromCookie();
    if (cached) return cached;
  }
  return fetchCsrfToken();
}

async function request<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const csrfToken = await resolveCsrfToken(method, options._csrfRetry);
  const finalUrl = buildUrl(url, options.params);

  let response: Response;
  try {
    response = await fetch(finalUrl, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken && { "X-CSRF-Token": csrfToken }),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      "NETWORK_ERROR",
      "Unable to reach the server. Check your connection and try again.",
      0,
      undefined,
      finalUrl
    );
  }

  if (response.status === 403 && !options._csrfRetry && MUTATING.has(method)) {
    const { parsed } = await readResponseBody(response.clone());
    const message =
      isApiErrorResponse(parsed) ? parsed.error.message : "";
    if (message.toLowerCase().includes("csrf")) {
      const freshToken = await fetchCsrfToken();
      if (freshToken) {
        return request<T>(url, { ...options, _csrfRetry: true });
      }
    }
  }

  if (
    response.status === 401 &&
    !options._retry &&
    !url.includes("/api/auth/login") &&
    !url.includes("/api/auth/refresh")
  ) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return request<T>(url, { ...options, _retry: true });
    }
  }

  return handleResponse<T>(response, finalUrl);
}

async function uploadRequest<T>(
  url: string,
  formData: FormData,
  options: FetchOptions = {}
): Promise<T> {
  const method = "POST";
  const csrfToken = await resolveCsrfToken(method, options._csrfRetry);
  const finalUrl = buildUrl(url, options.params);

  let response: Response;
  try {
    response = await fetch(finalUrl, {
      ...options,
      method: "POST",
      credentials: "include",
      headers: {
        ...(csrfToken && { "X-CSRF-Token": csrfToken }),
        ...options.headers,
      },
      body: formData,
    });
  } catch {
    throw new ApiClientError(
      "NETWORK_ERROR",
      "Unable to reach the server. Check your connection and try again.",
      0,
      undefined,
      finalUrl
    );
  }

  if (response.status === 403 && !options._csrfRetry) {
    const { parsed } = await readResponseBody(response.clone());
    const message =
      isApiErrorResponse(parsed) ? parsed.error.message : "";
    if (message.toLowerCase().includes("csrf")) {
      const freshToken = await fetchCsrfToken();
      if (freshToken) {
        return uploadRequest<T>(url, formData, { ...options, _csrfRetry: true });
      }
    }
  }

  if (
    response.status === 401 &&
    !options._retry &&
    !url.includes("/api/auth/login") &&
    !url.includes("/api/auth/refresh")
  ) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return uploadRequest<T>(url, formData, { ...options, _retry: true });
    }
  }

  return handleResponse<T>(response, finalUrl);
}

export const apiClient = {
  get<T>(url: string, options?: FetchOptions) {
    return request<T>(url, { ...options, method: "GET" });
  },

  post<T>(url: string, body?: unknown, options?: FetchOptions) {
    return request<T>(url, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(url: string, body?: unknown, options?: FetchOptions) {
    return request<T>(url, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(url: string, body?: unknown, options?: FetchOptions) {
    return request<T>(url, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(url: string, options?: FetchOptions) {
    return request<T>(url, { ...options, method: "DELETE" });
  },

  upload<T>(url: string, formData: FormData, options?: FetchOptions) {
    return uploadRequest<T>(url, formData, options);
  },
};

export { ApiClientError } from "@/lib/errors/api-client-error";
