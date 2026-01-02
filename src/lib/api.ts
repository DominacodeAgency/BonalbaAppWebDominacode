/**
 * Cliente API: centraliza la URL base (VITE_API_BASE) y helpers HTTP.
 * Así no repetimos strings y cambiamos el backend en un solo sitio.
 * Ya no recibe token, lo añadirá el cliente autenticado.
 */
const API_BASE = import.meta.env.VITE_API_BASE as string;

if (!API_BASE) {
  throw new Error("Falta VITE_API_BASE en el archivo .env");
}

export function apiUrl(path: string) {
  const base = API_BASE.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Solo ponemos JSON si no te lo han sobrescrito
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(apiUrl(path), { ...options, headers });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      data?.error ?? (typeof data === "string" ? data : `HTTP ${res.status}`);
    throw new Error(msg);
  }

  return data as T;
}
