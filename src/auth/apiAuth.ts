/**
 * Fetch autenticado: envuelve apiFetch añadiendo Authorization automáticamente
 * usando el token actual de localStorage.
 */
import { apiFetch } from "@/lib/api";
import { getToken } from "./token";

export async function apiFetchAuth<T>(path: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  return apiFetch<T>(path, { ...options, headers });
}
