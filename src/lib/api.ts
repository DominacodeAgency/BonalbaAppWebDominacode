import { clearToken } from "@/auth/token";
import { AUTH_ERRORS } from "@/auth/errors";
import { AUTH_LOGOUT_EVENT } from "@/auth/authEvents";

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

  // 401 → logout global
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    throw new Error(AUTH_ERRORS.SESSION_EXPIRED);
  }

  const text = await res.text();

  // ✅ Parse seguro (puede venir HTML/texto en 404, 500, etc.)
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    // Si viene JSON con {error}, úsalo. Si no, enseña el texto plano.
    const msg =
      data?.error ?? (text ? text.slice(0, 200) : null) ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // Si no es JSON pero fue ok, devuelve el texto (raro pero posible)
  return (data ?? (text as any)) as T;
}
