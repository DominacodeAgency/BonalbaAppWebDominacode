/**
 * Helpers de token: centralizan cómo guardamos/recuperamos el accessToken.
 * Así evitamos copiar/pegar localStorage por toda la app.
 */
const LS_KEY = "bonalba_access_token";

export function getToken() {
  return localStorage.getItem(LS_KEY);
}

export function saveToken(token: string) {
  localStorage.setItem(LS_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(LS_KEY);
}
