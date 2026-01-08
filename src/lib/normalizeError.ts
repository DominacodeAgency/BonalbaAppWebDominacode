/**
 * normalizeError: convierte errores típicos (Error, string, unknown) en mensaje string.
 */
export function normalizeError(
  err: unknown,
  fallback = "Error al cargar datos"
) {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || fallback;

  const anyErr = err as any;
  if (typeof anyErr?.message === "string") return anyErr.message;

  return fallback;
}
