import { useState } from "react";
import { normalizeError } from "@/lib/normalizeError";
import loginBg from "@/app/assets/FondoLoginRegister.png";
import imgLogo from "@/app/assets/Logo.png";
import Register from "@/app/components/Register"; // ajusta la ruta si está en otro sitio

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onInit?: () => void;
  initializing?: boolean;
}

// ✅ Icono ojo (mismo estilo que en Register)
function EyeIcon({ off }: { off?: boolean }) {
  return off ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.88 5.1A10.5 10.5 0 0121 12c-.64 1.33-1.5 2.53-2.54 3.52M6.11 6.11A10.55 10.55 0 003 12c1.5 3.11 4.5 6 9 6 1.05 0 2.03-.16 2.94-.46"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function Login({
  onLogin,
  onInit,
  initializing = false,
}: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  // ✅ si está en modo register, renderiza Register
  if (mode === "register") {
    return <Register onBackToLogin={() => setMode("login")} />;
  }

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
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative w-full max-w-md">
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-8">
          <div className="text-center mb-8">
            <img
              src={imgLogo}
              alt="Restaurante Golf Bonalba"
              className="mx-auto mb-4 h-24 w-auto object-contain"
            />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Restaurante Golf Bonalba
            </h1>
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

            {/* ✅ Contraseña con ojo */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Contraseña
              </label>

              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
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

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  title={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
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

            <div className="pt-2 text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  disabled={loading}
                  className="font-medium text-primary hover:underline underline-offset-4
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Crea una nueva
                </button>
              </p>
            </div>
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
