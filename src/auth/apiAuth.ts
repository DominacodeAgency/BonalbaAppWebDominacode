/**
 * Fetch autenticado: añade Authorization automáticamente usando el token actual.
 * Si el backend responde 401, limpia sesión y fuerza logout global.
 * Si hay otros errores, muestra un toast visual (si usas sonner).
 */
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "./token";
import { AUTH_ERRORS } from "./errors";
import { emitLogout } from "./authEvents";
import { toast } from "sonner";

export async function apiFetchAuth<T>(path: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await apiFetch<T>(path, { ...options, headers });
  } catch (e: any) {
    const msg = String(e?.message || "Error inesperado");

    // 401 (sesión caducada) → logout global
    if (msg === AUTH_ERRORS.SESSION_EXPIRED || msg.includes("401")) {
      clearToken();
      emitLogout();
      throw e;
    }

    // Otros errores → feedback visual
    toast.error(msg);
    throw e;
  }
}
