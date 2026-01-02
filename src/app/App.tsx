import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { useAuth } from "@/auth/AuthContext";

/**
 * App: decide qué pantalla mostrar según si hay sesión iniciada.
 */
export default function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!user) {
    return <Login onLogin={login} />;
  }

  return <Dashboard user={user} onLogout={logout} />;
}
