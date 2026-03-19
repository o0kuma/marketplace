const API_BASE = "/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}

export type ApiOptions = RequestInit & { params?: Record<string, string> };

export async function api<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { params, ...init } = options;
  const pathOnly = path.replace(/^\//, "").split("?")[0];
  const url = new URL(path, window.location.origin);
  url.pathname = `${API_BASE}/${pathOnly}`;
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url.toString(), { ...init, headers });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      clearToken();
      const current = window.location.pathname + window.location.search;
      if (!current.startsWith("/login")) {
        window.location.href = `/login?redirect=${encodeURIComponent(current)}`;
        return new Promise(() => {}) as Promise<T>;
      }
    }
    const body = await res.text();
    let message = `HTTP ${res.status}`;
    let errors: string | null = null;
    let code: string | null = null;
    try {
      const j = JSON.parse(body) as { code?: string; message?: string; errors?: string };
      code = j.code ?? null;
      message = j.message ?? message;
      errors = j.errors ?? null;
    } catch {
      if (body) message = body;
    }
    const err = new Error(message) as Error & { code?: string; errors?: string; status?: number };
    if (code) err.code = code;
    if (errors) err.errors = errors;
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Upload a file; returns { url: string }. */
export async function uploadFile(file: File): Promise<{ url: string }> {
  const pathOnly = "upload";
  const url = new URL(window.location.origin);
  url.pathname = `${API_BASE}/${pathOnly}`;
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(url.toString(), { method: "POST", headers, body: formData });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      clearToken();
      const current = window.location.pathname + window.location.search;
      if (!current.startsWith("/login")) {
        window.location.href = `/login?redirect=${encodeURIComponent(current)}`;
        return new Promise(() => {}) as Promise<{ url: string }>;
      }
    }
    const body = await res.text();
    let message = `HTTP ${res.status}`;
    try {
      const j = JSON.parse(body) as { message?: string };
      message = j.message ?? message;
    } catch {
      if (body) message = body;
    }
    throw new Error(message);
  }
  return res.json() as Promise<{ url: string }>;
}
