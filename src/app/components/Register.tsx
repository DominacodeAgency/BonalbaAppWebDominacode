import { useMemo, useState } from "react";
import { registerUser, type RegisterPayload } from "@/auth/apiAuth";
import { normalizeError } from "@/lib/normalizeError";
import loginBg from "@/app/assets/FondoLoginRegister.png";

interface RegisterProps {
  onBackToLogin: () => void;
}

function isAllowedEmail(email: string) {
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

// ✅ Normaliza teléfono: deja +34 y solo dígitos después (admite espacios/bloques)
function normalizeEsPhone(input: string) {
  const raw = (input || "").trim();
  if (!raw) return "";

  // Asegura prefijo +34
  const v = raw.startsWith("+34") ? raw : `+34 ${raw}`;

  // Extrae dígitos y conserva +34
  const digits = v.replace(/[^\d]/g, "");
  const rest = digits.startsWith("34") ? digits.slice(2) : digits;

  return rest ? `+34${rest}` : "+34";
}

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

export default function Register({ onBackToLogin }: RegisterProps) {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");

  // ✅ Teléfono empieza siempre por +34
  const [telefono, setTelefono] = useState("+34 ");

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

    if (!isAllowedEmail(email)) {
      setError("El correo debe ser @gmail.com/.es o @hotmail.com/.es");
      return;
    }
    if (pwErrors.length > 0) {
      setError(`Contraseña insegura: falta ${pwErrors.join(", ")}`);
      return;
    }

    const phoneNormalized = normalizeEsPhone(telefono);
    const phoneForPayload =
      phoneNormalized && phoneNormalized !== "+34" ? phoneNormalized : null;

    const payload: RegisterPayload = {
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      email: email.trim().toLowerCase(),
      direccion: direccion.trim(),
      password,
      telefono: phoneForPayload,
    };

    try {
      setLoading(true);
      await registerUser(payload); // ✅ usa la capa auth
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
                    placeholder="Nombre"
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
                    placeholder="Apellidos"
                    required
                    autoComplete="family-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Correo
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
                    onChange={(e) => {
                      const v = e.target.value;

                      // ✅ impide que borren el +34
                      if (!v.startsWith("+34")) {
                        setTelefono("+34 ");
                        return;
                      }
                      if (v === "+34") {
                        setTelefono("+34 ");
                        return;
                      }
                      setTelefono(v);
                    }}
                    onBlur={() => {
                      if (!telefono.startsWith("+34")) setTelefono("+34 ");
                      if (telefono === "+34") setTelefono("+34 ");
                    }}
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
                    placeholder="Dirección"
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
                      <EyeIcon off={showPassword} />
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
