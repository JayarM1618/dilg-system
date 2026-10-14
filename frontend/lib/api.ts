export const API_URL = "";

class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Sanctum SPA auth requires the CSRF cookie to be fetched once before any
 * "unsafe" request (POST/PATCH/DELETE). GETs don't need this.
 */
async function ensureCsrfCookie() {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: "include" });
}

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : undefined;
}

interface RequestOptions extends RequestInit {
  isFormData?: boolean;
  silent401?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();

  if (method !== "GET") {
    await ensureCsrfCookie();
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  const xsrfToken = getCookie("XSRF-TOKEN");
  if (xsrfToken && method !== "GET") {
    headers["X-XSRF-TOKEN"] = xsrfToken;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 && options.silent401) {
      return null as T;
    }
    if (path === "/api/logout" && (res.status === 401 || res.status === 419)) {
      return undefined as T;
    }
    const body = await res.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[] | string> };
    // Laravel validation errors: show the first concrete reason ("The file must be a PDF...").
    const firstVal = body.errors ? Object.values(body.errors)[0] : undefined;
    const firstError = Array.isArray(firstVal) ? firstVal[0] : typeof firstVal === "string" ? firstVal : undefined;
    throw new ApiError(firstError ?? body.message ?? "Request failed", res.status, body.errors as Record<string, string[]> | undefined);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body: data ? JSON.stringify(data) : undefined }),
  postForm: <T>(path: string, formData: FormData, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body: formData, isFormData: true }),
  patch: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};

/** Absolute URL of a Laravel endpoint (for download links and other plain <a href>s). */
export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export { ApiError };
