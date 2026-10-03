import axios from "axios";
import { getToken, removeToken } from "./token";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Agrega el token automaticamente a cada peticion
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el backend responde 401, limpia la sesion y redirige a /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
        const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginRequest && typeof window !== "undefined") {
      removeToken();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login?expired=true";
    }
    return Promise.reject(error);
  }
);

export default api;