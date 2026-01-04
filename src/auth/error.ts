/**
 * Errores de auth: códigos estándar para detectar sesión caducada (401)
 *
 */
export const AUTH_ERRORS = {
  SESSION_EXPIRED: "SESSION_EXPIRED",
} as const;

export type AuthErrorCode = (typeof AUTH_ERRORS)[keyof typeof AUTH_ERRORS];
