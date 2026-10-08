import api from "./api";
import type { AdminUserUpdateRequest, User } from "@/types/api";

// Gestión de usuarios (rol, activar/desactivar, reset de contraseña). Solo admin.
export async function listUsers(): Promise<User[]> {
  const response = await api.get<User[]>("/api/v1/users");
  return response.data;
}

export async function updateUser(userId: string, data: AdminUserUpdateRequest): Promise<User> {
  const response = await api.patch<User>(`/api/v1/users/${encodeURIComponent(userId)}`, data);
  return response.data;
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  await api.post(`/api/v1/users/${encodeURIComponent(userId)}/reset-password`, {
    new_password: newPassword,
  });
}
