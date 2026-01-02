import { useEffect, useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

/**
 * App
 * Controla el estado de autenticación: guarda/lee el token, valida sesión con /auth/me
 * y muestra Login o Dashboard según si el usuario está autenticado.
 */
export default function App() {
  const API_BASE = import.meta.env.VITE_API_BASE as string;

  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    // Si hay token guardado, validamos el usuario con /auth/me
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      setAccessToken(storedToken);
      fetchCurrentUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem("accessToken");
        setAccessToken(null);
      }
    } catch (e) {
      console.error("Error fetching current user:", e);
      localStorage.removeItem("accessToken");
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error al iniciar sesión");
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      localStorage.setItem("accessToken", data.accessToken);

      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
  };

  const initializeDatabase = async () => {
    setInitializing(true);
    try {
      const res = await fetch(`${API_BASE}/init`, { method: "POST" });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Error al inicializar la base de datos");
      }

      alert(
        "Base de datos inicializada correctamente. Ya puedes iniciar sesión."
      );
    } catch (error: any) {
      console.error("Init error:", error);
      alert("Error al inicializar: " + error.message);
    } finally {
      setInitializing(false);
    }
  };

  // Si falta VITE_API_BASE, te lo canta claramente
  if (!API_BASE) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Falta VITE_API_BASE en .env</h2>
        <p>Define VITE_API_BASE y reinicia npm run dev.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
        onInit={initializeDatabase}
        initializing={initializing}
      />
    );
  }

  return (
    <Dashboard user={user} accessToken={accessToken!} onLogout={handleLogout} />
  );
}
