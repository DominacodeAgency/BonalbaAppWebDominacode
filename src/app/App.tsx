import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Error404 from "./components/Error404"; // tu pantalla centrada

export default function App() {
  const { user, loading, login } = useAuth();

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <Routes>
      {/* públicas */}
      <Route
        path="/login"
        element={
          !user ? (
            <Login
              onLogin={login}
              onInit={async () => {}}
              initializing={false}
            />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* privadas */}
      <Route
        path="/"
        element={user ? <Dashboard /> : <Navigate to="/login" />}
      />

      {/* 404 */}
      <Route path="*" element={<Error404 />} />
    </Routes>
  );
}
