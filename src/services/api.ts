// src/services/api.ts

// === Base URL ===
// If VITE_API_URL is set, use it; otherwise default to http://localhost:4000
const RAW = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/+$/, "");

// Ensure the base ends with "/api" exactly once (idempotent)
export const API_URL = RAW.endsWith("/api") ? RAW : `${RAW}/api`;

// ---- Token helpers ---------------------------------------------------------
const TOKEN_KEYS = ["access", "token", "authToken"] as const;

export function getAccessToken(): string | null {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem("access", token.trim());
  else localStorage.removeItem("access");
}

export function setTokenFromAuthPayload(payload: any): string | null {
  const t =
    payload?.tokens?.access ??
    payload?.accessToken ??
    payload?.token ??
    payload?.jwt ??
    payload?.access_token ??
    payload?.data?.token ??
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
  // ensure path starts with a single leading slash
  const rel = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_URL}${rel}`;

  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  let res: Response;
  try {
    const headers = {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...authHeaders(),
      ...extraHeaders,
    };

    if (import.meta.env.DEV && (headers as any).Authorization) {
      console.log("[API] base:", API_URL, "→", url);
    }

    res = await fetch(url, {
      method,
      headers,
      body: body == null ? undefined : (isForm ? (body as any) : JSON.stringify(body)),
    });
  } catch (e: any) {
    throw new ApiError(0, null, e?.message || "Network error");
  }

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
    throw new ApiError(res.status, data, data?.error || data?.message);
  }

  return data as T;
}

// ---- Generic helpers -------------------------------------------------------
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
export function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  return request<T>("POST", path, formData);
}

// ---- Health module helpers (new) -------------------------------------------
export const HealthAPI = {
  // Lists medications for a specific pet (backend requires ?petId=)
  listMedications(petId: string): Promise<any> {
    return apiGet(`/health/medications?petId=${encodeURIComponent(petId)}`);
  },
  // Lists vaccinations for a specific pet (backend requires ?petId=)
  listVaccinations(petId: string): Promise<any> {
    return apiGet(`/health/vaccinations?petId=${encodeURIComponent(petId)}`);
  },
  // Combined timeline for a pet (meds + vaccines)
  petHealth(petId: string): Promise<any> {
    return apiGet(`/health/pets/${encodeURIComponent(petId)}/health`);
  },
  // Create a medication (requires startAt ISO)
  createMedication(payload: {
    petId: string;
    name: string;
    dosage: string;
    frequency: string;
    startAt: string;         // ISO string
    durationDays: number;
    notes?: string;
  }): Promise<any> {
    return apiPost(`/health/medications`, payload);
  },
  // Create a vaccination (field name may be "date" in your router)
  createVaccination(payload: {
    petId: string;
    vaccine: string;
    date: string;            // ISO string (or whatever your route expects)
    notes?: string;
  }): Promise<any> {
    return apiPost(`/health/vaccinations`, payload);
  },
};
