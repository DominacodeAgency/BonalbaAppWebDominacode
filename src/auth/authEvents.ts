/**
 * authEvents: canal simple para notificar eventos de auth (logout global).
 * Así apiFetchAuth puede avisar a AuthProvider sin dependencias circulares.
 */
export const AUTH_LOGOUT_EVENT = "bonalba:auth:logout";

export function emitLogout() {
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}
