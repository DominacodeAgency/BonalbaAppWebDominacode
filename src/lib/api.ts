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

function short(text: string, max = 300) {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Si hay body y NO es FormData, pon Content-Type JSON por defecto
  const hasBody = typeof options.body !== "undefined";
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(apiUrl(path), { ...options, headers });

  // 401 → logout global (tu lógica actual)
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    throw new Error(AUTH_ERRORS.SESSION_EXPIRED);
  }

  const requestId = res.headers.get("x-request-id") || "";
  const contentType = res.headers.get("content-type") || "";

  // Lee el body SIEMPRE como texto (sirve para JSON y para texto plano/HTML)
  const text = await res.text();

  // Parse JSON solo si tiene pinta de JSON o content-type indica JSON
  let data: any = null;
  const looksJson =
    contentType.includes("application/json") ||
    text.trim().startsWith("{") ||
    text.trim().startsWith("[");

  if (text && looksJson) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    // Mensaje preferente: error/message del backend
    const backendMsg =
      data?.error ??
      data?.message ??
      data?.details ??
      (typeof data === "string" ? data : null);

    // Si no hay JSON útil, usa texto plano (recortado)
    const plainMsg = text ? short(text, 300) : null;

    const baseMsg =
      backendMsg ?? plainMsg ?? `HTTP ${res.status} ${res.statusText}`;

    // Contexto útil para depurar
    const method = (options.method || "GET").toUpperCase();
    const where = `${method} ${path}`;

    const suffix = requestId ? ` (req: ${requestId})` : "";
    throw new Error(`${baseMsg} — ${where} [${res.status}]${suffix}`);
  }

  // 204 no content
  if (res.status === 204) return undefined as unknown as T;

  // Si vino JSON, devuelve JSON; si no, devuelve texto
  return (data ?? (text as any)) as T;
}
