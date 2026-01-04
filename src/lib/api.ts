/**
 * Cliente API: centraliza la URL base (VITE_API_BASE) y helpers HTTP.
 * Así no repetimos strings y cambiamos el backend en un solo sitio.
 * Ya no recibe token, lo añadirá el cliente autenticado.
 */
import { clearToken } from "@/auth/token";
import { AUTH_ERRORS } from "@/auth/errors";

const API_BASE = import.meta.env.VITE_API_BASE as string;

if (!API_BASE) {
  throw new Error("Falta VITE_API_BASE en el archivo .env");
}

export function apiUrl(path: string) {
  // Asegura barras correctas
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

  // Si hay body y no han pasado Content-Type, lo ponemos
  const hasBody = typeof options.body !== "undefined";
  if (hasBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(apiUrl(path), { ...options, headers });

  // Si la sesión caduca, limpiamos token y lanzamos un error "con código"
  if (res.status === 401) {
    clearToken();
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
