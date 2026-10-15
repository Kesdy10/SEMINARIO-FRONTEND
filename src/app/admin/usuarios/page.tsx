"use client";

import { useEffect, useState } from "react";
import { Loader, RefreshCw, Lock } from "lucide-react";
import { resetUserPassword } from "@/services/adminUsers";
import Sidebar from "@/components/Sidebar";
import type { User, AdminUserUpdateRequest } from "@/types/api";

// Mock API calls - replace with actual service calls
const getUsers = async (): Promise<User[]> => {
  const response = await fetch("/api/v1/users", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
};

const updateUser = async (userId: string, data: AdminUserUpdateRequest): Promise<User> => {
  const response = await fetch(`/api/v1/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update user");
  return response.json();
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (_err) {
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: "user" | "admin") => {
    setUpdatingId(userId);
    setError(null);
    try {
      await updateUser(userId, { role: newRole });
      await loadUsers();
    } catch (_err) {
      setError("Error al actualizar rol del usuario.");
    } finally {
      setUpdatingId(null);
    }
  };


  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt("Ingresa la nueva contraseña temporal para el usuario:");
    if (!newPassword || newPassword.trim() === "") return;

    setResettingId(userId);
    setError(null);
    try {
      await resetUserPassword(userId, newPassword);
      setError(null);
      alert("Contraseña reseteada exitosamente. Nueva contraseña: " + newPassword);
      await loadUsers();
    } catch (_err) {
      setError("Error al resetear la contraseña del usuario.");
    } finally {
      setResettingId(null);
    }
  };

  const handleActiveChange = async (userId: string, active: boolean) => {
    setUpdatingId(userId);
    setError(null);
    try {
      await updateUser(userId, { active });
      await loadUsers();
    } catch (_err) {
      setError("Error al actualizar estado del usuario.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Usuarios</h1>
          </div>
          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="rounded border border-border bg-secondary px-2.5 py-1.5 text-[12px] text-foreground hover:bg-secondary/80 disabled:opacity-50"
          >
            <RefreshCw className={`inline h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {error && <div className="mb-4 rounded bg-red-500/10 px-3 py-2 text-[12px] text-red-400">{error}</div>}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && users.length === 0 && (
            <p className="text-center text-[12px] text-muted-foreground">No hay usuarios.</p>
          )}

          {!isLoading && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-mono text-muted-foreground">Nombre</th>
                    <th className="px-3 py-2 text-left font-mono text-muted-foreground">Email</th>
                    <th className="px-3 py-2 text-left font-mono text-muted-foreground">Rol</th>
                    <th className="px-3 py-2 text-center font-mono text-muted-foreground">Estado</th>
                    <th className="px-3 py-2 text-left font-mono text-muted-foreground">Creado</th>
                    <th className="px-3 py-2 text-right font-mono text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-3 py-2 font-mono text-foreground">{user.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{user.email}</td>
                      <td className="px-3 py-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as "user" | "admin")}
                          disabled={updatingId === user.id}
                          className="rounded border border-border bg-secondary px-2 py-1 text-[11px] text-foreground focus:border-primary/60 focus:outline-none disabled:opacity-50"
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleActiveChange(user.id, !user.active)}
                          disabled={updatingId === user.id}
                          className={`rounded px-2 py-1 text-[11px] font-medium ${
                            user.active
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          } disabled:opacity-50`}
                        >
                          {user.active ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString("es-GT")
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          disabled={resettingId === user.id}
                          className="inline text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
                          title="Resetear contraseña"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
