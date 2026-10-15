"use client";

import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { Loader, RefreshCw, Lock, Plus } from "lucide-react";
import { listUsers, updateUser, resetUserPassword } from "@/services/adminUsers";
import { register } from "@/services/auth";
import { formatDate } from "@/lib/dates";
import Sidebar from "@/components/Sidebar";
import type { User } from "@/types/api";

function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "No se pudo conectar con el servidor.";
    const detail = err.response.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Crear usuario (el backend siempre lo crea con rol "user"; si se elige
  // admin, se le sube el rol con un segundo paso).
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (_err) {
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadUsers();
    })();
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

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setCreateMessage(null);

    const name = newName.trim();
    const email = newEmail.trim();
    if (name.length < 2) {
      setCreateError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (!email.includes("@")) {
      setCreateError("Ingresa un correo válido.");
      return;
    }
    if (newPassword.length < 8) {
      setCreateError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setCreating(true);
    try {
      const created = await register({ name, email, password: newPassword });
      let message = `Usuario ${created.email} creado.`;
      if (newRole === "admin") {
        try {
          await updateUser(created.id, { role: "admin" });
        } catch {
          message = `Usuario ${created.email} creado, pero no se pudo asignarle el rol admin. Cámbialo desde la tabla.`;
        }
      }
      setCreateMessage(message);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
      setShowCreate(false);
      await loadUsers();
    } catch (err) {
      setCreateError(errorMessage(err, "No se pudo crear el usuario."));
    } finally {
      setCreating(false);
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowCreate((v) => !v);
                setCreateError(null);
              }}
              className="flex items-center gap-1.5 rounded border border-border bg-secondary px-2.5 py-1.5 text-[12px] text-foreground hover:bg-secondary/80"
            >
              <Plus className="h-3 w-3" /> Crear usuario
            </button>
            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded border border-border bg-secondary px-2.5 py-1.5 text-[12px] text-foreground hover:bg-secondary/80 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} /> Actualizar
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {error && <div className="mb-4 rounded bg-red-500/10 px-3 py-2 text-[12px] text-red-400">{error}</div>}

          {createMessage && (
            <div className="mb-4 rounded bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-400">
              {createMessage}
            </div>
          )}

          {showCreate && (
            <form
              onSubmit={handleCreateUser}
              className="mb-4 max-w-xl space-y-3 rounded border border-border bg-card p-4"
            >
              <h2 className="text-sm font-semibold text-foreground">Nuevo usuario</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Nombre
                  </label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    maxLength={120}
                    className="w-full rounded border border-border bg-secondary px-2 py-1.5 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Correo
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded border border-border bg-secondary px-2 py-1.5 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Contraseña (mínimo 8)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    maxLength={128}
                    autoComplete="new-password"
                    className="w-full rounded border border-border bg-secondary px-2 py-1.5 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Rol
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "user" | "admin")}
                    className="w-full rounded border border-border bg-secondary px-2 py-1.5 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {createError && <p className="font-mono text-[11px] text-red-400">{createError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creando…" : "Crear usuario"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={creating}
                  className="rounded border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

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
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          disabled={resettingId === user.id}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[11px] text-amber-400 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Resetear contraseña"
                        >
                          <Lock className="h-3 w-3" /> Resetear contraseña
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
