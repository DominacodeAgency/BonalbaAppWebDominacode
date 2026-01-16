// /**
//  * Fetch autenticado: añade Authorization automáticamente usando el token actual.
//  * Si el backend responde 401, limpia sesión y fuerza logout global.
//  * Si hay otros errores, muestra un toast visual (si usas sonner).
//  */
// import { apiFetch } from "@/lib/api";
// import { clearToken, getToken } from "./token";
// import { AUTH_ERRORS } from "./errors";
// import { emitLogout } from "./authEvents";
// import { toast } from "sonner";

// export async function apiFetchAuth<T>(path: string, options: RequestInit = {}) {
//   const token = getToken();

//   const headers: Record<string, string> = {
//     ...(options.headers as Record<string, string> | undefined),
//   };

//   if (token) headers.Authorization = `Bearer ${token}`;

//   try {
//     return await apiFetch<T>(path, { ...options, headers });
//   } catch (e: any) {
//     const msg = String(e?.message || "Error inesperado");

//     // 401 (sesión caducada) → logout global
//     if (msg === AUTH_ERRORS.SESSION_EXPIRED || msg.includes("401")) {
//       clearToken();
//       emitLogout();
//       throw e;
//     }

//     // Otros errores → feedback visual
//     toast.error(msg);
//     throw e;
//   }
// }
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

/* =========================================================
   ✅ REGISTRO (NO autenticado)
   ========================================================= */

export type RegisterPayload = {
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  direccion: string;
  password: string;
};
export async function registerUser(payload: RegisterPayload) {
  const body = {
    email: payload.email,
    password: payload.password,
    full_name: `${payload.nombre} ${payload.apellidos}`.trim(),
    phone: payload.telefono ?? null,
    address: payload.direccion,
    username: payload.email.split("@")[0], // simple: antes del @
  };

  return apiFetch<{ ok: boolean }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export type PendingProfile = {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: "admin" | "encargado" | "empleado" | null;
  area: "cocina" | "sala" | null;
  active: boolean;
  created_at: string;
  phone?: string | null;
  address?: string | null;
};

export async function fetchPendingUsers() {
  return apiFetchAuth<{ ok: boolean; data: PendingProfile[] }>(
    "/admin/pending-users",
    { method: "GET" }
  );
}

export async function approveUser(payload: {
  profileId: string;
  role: "admin" | "encargado" | "empleado";
  area?: "cocina" | "sala" | null;
}) {
  return apiFetchAuth<{ ok: boolean }>("/admin/approve-user", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
