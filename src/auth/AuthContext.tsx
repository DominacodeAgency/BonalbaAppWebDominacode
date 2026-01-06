import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { apiFetchAuth } from "./apiAuth";
import { clearToken, getToken, saveToken } from "./token";
import { AUTH_LOGOUT_EVENT } from "./authEvents";

/**
 * Contexto de auth: expone user, loading y acciones de login/logout.
 * Así cualquier componente puede saber si hay sesión sin pasar props.
 */
export type User = {
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

  /**
   * refreshMe: si hay token guardado, consulta /auth/me para recuperar el user.
   */
  async function refreshMe() {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const data = await apiFetchAuth<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      // apiFetch/apiFetchAuth ya forzarán logout global si es 401.
      // Aquí solo reflejamos el estado en UI.
      setUser(null);
    }
  }

  /**
   * login: obtiene accessToken + user y lo guarda en localStorage.
   */
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

  /**
   * logout: borra token y limpia estado local.
   */
  function logout() {
    clearToken();
    setUser(null);
  }

  // Escucha logout global (por ejemplo cuando api.ts detecta 401)
  useEffect(() => {
    const onLogout = () => {
      clearToken();
      setUser(null);
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, []);

  // Al arrancar: si hay token, intenta recuperar /auth/me
  useEffect(() => {
    (async () => {
      await refreshMe();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
