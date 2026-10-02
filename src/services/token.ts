// Manejo del token de sesión en una cookie.
// Se usa cookie (y no localStorage) para que el middleware.ts de Next.js,
// que corre en el servidor, también pueda leer el token y proteger rutas.

const TOKEN_KEY = "access_token";
// 24 horas: igual a la expiración dura del token en el backend (JWT_EXPIRE_MINUTES = 1440).
// La expiración por inactividad (20 min) la controla el backend con un 401.
const MAX_AGE_SECONDS = 60 * 60 * 24;

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${TOKEN_KEY}=`));
  return cookie ? decodeURIComponent(cookie.substring(TOKEN_KEY.length + 1)) : null;
}

export function setToken(token: string): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function removeToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}