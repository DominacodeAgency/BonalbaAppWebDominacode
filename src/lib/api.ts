/**
 * Cliente API: centraliza la URL base (VITE_API_BASE) y helpers HTTP.
 * Si el backend devuelve 401, limpia token y dispara logout global.
 */
import { clearToken } from "@/auth/token";
import { AUTH_ERRORS } from "@/auth/errors";
import { emitLogout } from "@/auth/authEvents";

const API_BASE = import.meta.env.VITE_API_BASE as string;

if (!API_BASE) {
  throw new Error("Falta VITE_API_BASE en el archivo .env");
}

export function apiUrl(path: string) {
  const base = API_BASE.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const hasBody = typeof options.body !== "undefined";
  if (hasBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(apiUrl(path), { ...options, headers });

  if (res.status === 401) {
    clearToken();
    emitLogout();
    throw new Error(AUTH_ERRORS.SESSION_EXPIRED);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}
