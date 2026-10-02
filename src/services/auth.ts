import api from "./api";
import { setToken, removeToken } from "./token";
import type { LoginRequest, LoginResponse, RegisterRequest, User } from "@/types/api";

// Registrar un usuario nuevo
export async function register(data: RegisterRequest): Promise<User> {
  const response = await api.post<User>("/api/v1/users", data);
  return response.data;
}

// Iniciar sesión: si es correcto, guarda el token en la cookie
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/api/v1/auth/login", data);
  setToken(response.data.access_token);
  return response.data;
}

// Cerrar sesión: avisa al backend y borra el token aunque el backend falle
export async function logout(): Promise<void> {
  try {
    await api.post("/api/v1/auth/logout");
  } finally {
    removeToken();
  }
}

// Obtener los datos del usuario que tiene la sesión activa
export async function getMe(): Promise<User> {
  const response = await api.get<User>("/api/v1/users/me");
  return response.data;
}