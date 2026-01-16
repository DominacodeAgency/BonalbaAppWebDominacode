import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api"; // ajusta si tu api.ts está en otra ruta
import { normalizeError } from "@/lib/normalizeError";
import loginBg from "@/app/assets/FondoLoginRegister.png";

type RegisterPayload = {
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  direccion: string;
  password: string;
};

interface RegisterProps {
  onBackToLogin: () => void;
}

function isAllowedEmail(email: string) {
  // Reglas: @gmail o @hotmail + (.com o .es)
  // Ejemplos válidos:
  //   pepe@gmail.com, pepe@gmail.es, pepe@hotmail.com, pepe@hotmail.es
  const re = /^[^\s@]+@(gmail|hotmail)\.(com|es)$/i;
  return re.test(email.trim());
}

function passwordStrengthErrors(pw: string) {
  const errors: string[] = [];
  if (pw.length < 8) errors.push("mínimo 8 caracteres");
  if (!/[a-z]/.test(pw)) errors.push("una minúscula");
  if (!/[A-Z]/.test(pw)) errors.push("una mayúscula");
  if (!/[0-9]/.test(pw)) errors.push("un número");
  if (!/[!@#$%^&*()_\-+={[}\]|\\:;"'<,>.?/`~]/.test(pw))
    errors.push("un carácter especial");
  return errors;
}

export default function Register({ onBackToLogin }: RegisterProps) {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const pwErrors = useMemo(() => passwordStrengthErrors(password), [password]);

  const canSubmit =
    nombre.trim() &&
    apellidos.trim() &&
    direccion.trim() &&
    isAllowedEmail(email) &&
    pwErrors.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    // validaciones front (por si el usuario forza)
    if (!isAllowedEmail(email)) {
      setError("El correo debe ser @gmail.com/.es o @hotmail.com/.es");
      return;
    }
    if (pwErrors.length > 0) {
      setError(`Contraseña insegura: falta ${pwErrors.join(", ")}`);
      return;
    }

    const payload: RegisterPayload = {
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      email: email.trim().toLowerCase(),
      direccion: direccion.trim(),
      password,
      telefono: telefono.trim() ? telefono.trim() : null,
    };

    try {
      setLoading(true);

      // 👇 Ajusta el endpoint a tu backend:
      // ejemplo típico: POST /auth/register
      await apiFetch<{ ok: boolean }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSubmitted(true);
    } catch (err) {
      setError(normalizeError(err, "Error al registrar el usuario"));
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
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Crear cuenta
            </h1>
            <p className="text-muted-foreground">
              Solicitud de alta para Bonalba
            </p>
          </div>

          {submitted ? (
            <div className="space-y-4">
              <div
                role="status"
                className="bg-primary/10 border border-primary/20 rounded-lg p-4"
              >
                <p className="font-medium text-foreground mb-1">
                  ✅ Solicitud enviada
                </p>
                <p className="text-sm text-muted-foreground">
                  Tu cuenta queda <strong>pendiente de aprobación</strong> por
                  administración. Un encargado/admin te asignará el rol y
                  habilitará el acceso.
                </p>
              </div>

              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors
                           font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Volver a iniciar sesión
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nombre
                  </label>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-border bg-background rounded-lg outline-none disabled:opacity-60
                               focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring"
                    placeholder="Rafa"
                    required
                    autoComplete="given-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Apellidos
                  </label>
                  <input
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-border bg-background rounded-lg outline-none disabled:opacity-60
                               focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring"
                    placeholder="Reina Ferrández"
                    required
                    autoComplete="family-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Correo (solo Gmail/Hotmail .com/.es)
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-border bg-background rounded-lg outline-none disabled:opacity-60
                               focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring"
                    placeholder="usuario@gmail.com"
                    required
                    autoComplete="email"
                    inputMode="email"
                  />
                  {email.trim() && !isAllowedEmail(email) && (
                    <p className="mt-2 text-xs text-destructive">
                      Debe ser @gmail.com/.es o @hotmail.com/.es
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Teléfono (opcional)
                  </label>
                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-border bg-background rounded-lg outline-none disabled:opacity-60
                               focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring"
                    placeholder="+34 600 000 000"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Dirección
                  </label>
                  <input
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-border bg-background rounded-lg outline-none disabled:opacity-60
                               focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring"
                    placeholder="C/ Example 123, Elche"
                    required
                    autoComplete="street-address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Contraseña
                  </label>

                  <div className="flex gap-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-2 border border-border bg-background rounded-lg outline-none disabled:opacity-60
                                 focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring"
                      placeholder="********"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={loading}
                      className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      title={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Debe tener: 8+ caracteres, mayúscula, minúscula, número y
                    carácter especial.
                  </div>

                  {password && pwErrors.length > 0 && (
                    <p className="mt-2 text-xs text-destructive">
                      Falta: {pwErrors.join(", ")}
                    </p>
                  )}
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
                  disabled={loading || !canSubmit}
                  className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed font-medium
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {loading ? "Enviando solicitud..." : "Enviar solicitud"}
                </button>
              </form>

              <button
                type="button"
                onClick={onBackToLogin}
                disabled={loading}
                className="mt-4 w-full border border-border bg-background py-2 px-4 rounded-lg hover:bg-muted transition-colors
                           font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Volver
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
