/**
 * Cliente API: centraliza la URL base (VITE_API_BASE) y el helper fetch.
 * Así no repetimos código y cambiamos el backend en un solo sitio.
 */
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
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), { ...options, headers });

  // Intenta leer JSON incluso si hay error
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}
