import { useState } from "react";
import { normalizeError } from "@/lib/normalizeError";
import loginBg from "@/app/assets/FondoLoginRegister.png";

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onInit?: () => void;
  initializing?: boolean;
}

export default function Login({
  onLogin,
  onInit,
  initializing = false,
}: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      await onLogin(username, password);
    } catch (err) {
      setError(normalizeError(err, "Error al iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat px-4 flex items-center justify-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Overlay para legibilidad (opcional) */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Contenido */}
      <div className="relative w-full max-w-md">
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Bonalba</h1>
            <p className="text-muted-foreground">
              Sistema de Gestión Operativa
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Usuario
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-border bg-background rounded-lg outline-none disabled:opacity-60
                           focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring"
                placeholder="admin"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-border bg-background rounded-lg outline-none disabled:opacity-60
                           focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring"
                placeholder="123456"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed font-medium
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          {onInit && (
            <div className="mt-8 pt-6 border-t border-border">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-foreground font-medium mb-2">
                  Primera vez usando la aplicación:
                </p>
                <button
                  onClick={() => {
                    if (!initializing) onInit();
                  }}
                  disabled={initializing}
                  className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors
                             disabled:opacity-50 text-sm font-medium
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {initializing
                    ? "Inicializando..."
                    : "Inicializar base de datos"}
                </button>
              </div>

              <div className="text-xs text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">
                  Usuarios de prueba:
                </p>
                <div className="space-y-1">
                  <p>
                    • <strong className="text-foreground">admin</strong> /
                    123456 (Administrador)
                  </p>
                  <p>
                    • <strong className="text-foreground">empleado</strong> /
                    123456 (Personal de sala)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
