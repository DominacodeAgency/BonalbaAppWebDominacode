/**
 * Fetch autenticado: envuelve apiFetch añadiendo Authorization automáticamente
 * usando el token actual de localStorage. Si hay 401, limpia sesión y emite logout global.
 */
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "./token";
import { emitLogout } from "./authEvents";

export async function apiFetchAuth<T>(path: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await apiFetch<T>(path, { ...options, headers });
  } catch (e: any) {
    // Si tu apiFetch lanza "HTTP 401" o te devuelve status, ajusta esta condición
    if (String(e?.message).includes("401")) {
      clearToken();
      emitLogout();
    }
    throw e;
  }
}
