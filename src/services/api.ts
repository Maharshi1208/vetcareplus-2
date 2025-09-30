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

// NEW: set/clear the primary token key ("access") without changing old readers
export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem("access", token.trim());
  else localStorage.removeItem("access");
}

// NEW: convenience to pull token from common auth payload shapes
export function setTokenFromAuthPayload(payload: any): string | null {
  const t =
    payload?.tokens?.access ??       // { tokens: { access: "..." } }
    payload?.accessToken ??          // { accessToken: "..." }
    payload?.token ??                // { token: "..." }
    payload?.jwt ??                  // { jwt: "..." }
    payload?.access_token ??         // { access_token: "..." }
    payload?.data?.token ??          // { data: { token: "..." } }
    null;

  setAccessToken(t ?? null);
  return t ?? null;
}

export function clearTokens() {
  for (const k of TOKEN_KEYS) localStorage.removeItem(k);
}

export function authHeaders() {
  const tok = getAccessToken();
  if (!tok) return {};
  // ✅ remove any newline or carriage return characters, then trim
  const clean = tok.replace(/\r?\n|\r/g, "").trim();
  return { Authorization: `Bearer ${clean}` };
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

  let res: Response;
  try {
    const headers = {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...authHeaders(),
      ...extraHeaders,
    };

    // Dev-only log of Authorization header
    if (import.meta.env.DEV && headers.Authorization) {
      console.log("[API] Sending Authorization:", headers.Authorization);
    }

    res = await fetch(url, {
      method,
      headers,
      body: body == null ? undefined : (isForm ? (body as any) : JSON.stringify(body)),
    });
  } catch (e: any) {
    // Network/connection error
    throw new ApiError(0, null, e?.message || "Network error");
  }

  // Try to parse JSON (won’t explode on non-JSON or empty body)
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
