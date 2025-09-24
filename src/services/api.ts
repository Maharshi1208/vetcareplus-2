// src/services/api.ts
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ---- Token helpers ---------------------------------------------------------
const TOKEN_KEYS = ["access", "token", "authToken"] as const;

export function getAccessToken(): string | null {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

export function clearTokens() {
  for (const k of TOKEN_KEYS) localStorage.removeItem(k);
}

export function authHeaders() {
  const tok = getAccessToken();
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

// ---- Error type & guards ---------------------------------------------------
export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, data: any, message?: string) {
    super(message || (data?.error ?? data?.message ?? `HTTP ${status}`));
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function isAuthError(err: unknown): err is ApiError {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

// ---- Core request ----------------------------------------------------------
async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  extraHeaders: Record<string, string> = {}
): Promise<T> {
  const url = `${API_URL}${path}`;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(url, {
    method,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...authHeaders(),
      ...extraHeaders,
    },
    body: body == null ? undefined : (isForm ? (body as any) : JSON.stringify(body)),
  });

  // Try to parse JSON (don’t explode on non-JSON)
  let data: any = null;
  const text = await res.text().catch(() => "");
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    // Optional: clearTokens() on 401/403 if you want to force re-login.
    // if (res.status === 401 || res.status === 403) clearTokens();
    throw new ApiError(res.status, data, data?.error || data?.message);
  }

  return data as T;
}

// ---- Public helpers --------------------------------------------------------
export function apiGet<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>("PATCH", path, body);
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}

// Optional: uploads
export function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  return request<T>("POST", path, formData);
}
