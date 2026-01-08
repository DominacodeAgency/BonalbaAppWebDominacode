import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { useAuth } from "@/auth/AuthContext";

export default function App() {
  const { user, loading, login } = useAuth();

  if (loading) return <div className="p-6">Cargando...</div>;

  if (!user) {
    return (
      <Login
        onLogin={async (username, password) => {
          await login(username, password);
        }}
        // si ya NO usas inicialización, deja esto así
        onInit={async () => {}}
        initializing={false}
      />
    );
  }

  return <Dashboard />;
}
