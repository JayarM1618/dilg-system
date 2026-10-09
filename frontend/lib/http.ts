import { apiUrl, request } from "@/lib/api";

export { apiUrl };

type Method = "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * Sends JSON or a FormData upload to Laravel (CSRF cookie, session cookie and
 * error handling all live in lib/api.ts). Throws ApiError with Laravel's message.
 */
export function apiSend<T = unknown>(path: string, method: Method, body?: unknown): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  return request<T>(path, {
    method,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    isFormData,
  });
}
