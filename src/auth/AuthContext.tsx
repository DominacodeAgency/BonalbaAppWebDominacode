import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { apiFetchAuth } from "./apiAuth";
import { clearToken, getToken, saveToken } from "./token";
import { AUTH_ERRORS } from "@/auth/errors";
/**
 * Contexto de auth: expone user, loading y acciones de login/logout.
 * Así cualquier componente puede saber si hay sesión sin pasar props.
 */
type User = {
  id: string;
  email: string;
  username: string;
  role: string;
  area: string | null;
  name: string | null;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const data = await apiFetchAuth<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch (e: any) {
      // Token inválido/expirado o cualquier error → limpiamos sesión
      if (e?.message === AUTH_ERRORS.SESSION_EXPIRED) {
        // ya limpió token en apiFetch(), solo aseguramos estado
      } else {
        // otros errores también dejan fuera
      }
      clearToken();
      setUser(null);
    }
  }
  async function login(username: string, password: string) {
    const data = await apiFetch<{ user: User; accessToken: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }
    );

    saveToken(data.accessToken);
    setUser(data.user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  // Al arrancar la app: si hay token en localStorage, intenta /auth/me
  useEffect(() => {
    (async () => {
      await refreshMe();
      setLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, refreshMe }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook useAuth: acceso simple y seguro al contexto de auth.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
