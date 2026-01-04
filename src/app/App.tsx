import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { useAuth } from "@/auth/AuthContext";

export default function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!user) {
    return (
      <Login
        onLogin={async (username, password) => {
          try {
            await login(username, password);
            return { success: true };
          } catch (e: any) {
            return {
              success: false,
              error: e?.message || "Error al iniciar sesión",
            };
          }
        }}
        onInit={async () => {
          // si ya NO usas inicialización, déjalo vacío
        }}
        initializing={false}
      />
    );
  }

  return <Dashboard user={user} onLogout={logout} />;
}
