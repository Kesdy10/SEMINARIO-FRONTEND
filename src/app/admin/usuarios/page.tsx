"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { KeyRound, RefreshCw, ShieldCheck, Users as UsersIcon } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { listUsers, resetUserPassword, updateUser } from "@/services/adminUsers";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types/api";

function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "No se pudo conectar con el servidor.";
    const detail = err.response.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

// Gestión de usuarios: rol, activar/desactivar y reseteo de contraseña. Solo admin
// (el backend además bloquea que un admin se desactive o se quite el rol a sí mismo).
export default function AdminUsuariosPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  function loadUsers() {
    setListError(null);
    listUsers()
      .then(setUsers)
      .catch((err) => setListError(errorMessage(err, "No se pudo cargar la lista de usuarios.")));
  }

  useEffect(() => {
    let active = true;
    listUsers()
      .then((data) => {
        if (active) setUsers(data);
      })
      .catch((err) => {
        if (active) setListError(errorMessage(err, "No se pudo cargar la lista de usuarios."));
      });
    return () => {
      active = false;
    };
  }, []);

  function setError(userId: string, message: string | null) {
    setRowError((current) => {
      const next = { ...current };
      if (message) next[userId] = message;
      else delete next[userId];
      return next;
    });
  }

  async function handleToggleActive(target: User) {
    setBusyId(target.id);
    setError(target.id, null);
    try {
      const updated = await updateUser(target.id, { active: !target.active });
      setUsers((current) => (current ?? []).map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(target.id, errorMessage(err, "No se pudo cambiar el estado."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleRole(target: User) {
    const nextRole = target.role === "admin" ? "user" : "admin";
    setBusyId(target.id);
    setError(target.id, null);
    try {
      const updated = await updateUser(target.id, { role: nextRole });
      setUsers((current) => (current ?? []).map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(target.id, errorMessage(err, "No se pudo cambiar el rol."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleResetPassword(userId: string) {
    if (newPassword.length < 8) {
      setError(userId, "La contraseña nueva debe tener al menos 8 caracteres.");
      return;
    }
    setBusyId(userId);
    setError(userId, null);
    try {
      await resetUserPassword(userId, newPassword);
      setResetTargetId(null);
      setNewPassword("");
    } catch (err) {
      setError(userId, errorMessage(err, "No se pudo resetear la contraseña."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Usuarios</h2>
            </div>
            <button
              type="button"
              onClick={loadUsers}
              title="Recargar"
              className="flex-shrink-0 rounded border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {listError && <p className="font-mono text-[13px] text-red-400">{listError}</p>}
          {!listError && users === null && <p className="font-mono text-[13px] text-muted-foreground">Cargando…</p>}

          {users && (
            <div className="overflow-hidden rounded border border-border bg-card">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const busy = busyId === u.id;
                return (
                  <div key={u.id} className="border-b border-border px-4 py-3 last:border-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] text-foreground">{u.name}</span>
                          {u.role === "admin" && (
                            <span className="flex-shrink-0 rounded border border-amber-500/30 bg-amber-500/10 px-1 py-px font-mono text-[9px] uppercase tracking-wider text-amber-400">
                              Admin
                            </span>
                          )}
                          {u.active === false && (
                            <span className="flex-shrink-0 rounded border border-red-500/30 bg-red-500/10 px-1 py-px font-mono text-[9px] uppercase tracking-wider text-red-400">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">{u.email}</p>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleRole(u)}
                          disabled={busy || isSelf}
                          title={isSelf ? "No puedes quitarte el rol de administrador a ti mismo" : undefined}
                          className="flex items-center gap-1 rounded border border-border bg-secondary px-2 py-1 font-mono text-[11px] text-foreground transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          disabled={busy || isSelf}
                          title={isSelf ? "No puedes desactivar tu propia cuenta" : undefined}
                          className={`rounded border px-2 py-1 font-mono text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            u.active === false
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          }`}
                        >
                          {u.active === false ? "Activar" : "Desactivar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetTargetId(resetTargetId === u.id ? null : u.id);
                            setNewPassword("");
                            setError(u.id, null);
                          }}
                          className="flex items-center gap-1 rounded border border-border bg-secondary px-2 py-1 font-mono text-[11px] text-foreground transition-colors hover:border-primary/40"
                        >
                          <KeyRound className="h-3 w-3" /> Reset
                        </button>
                      </div>
                    </div>

                    {resetTargetId === u.id && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Contraseña nueva (mín. 8 caracteres)"
                          className="w-full max-w-xs rounded border border-border bg-secondary px-2.5 py-1.5 text-[12px] text-foreground placeholder-muted-foreground focus:border-primary/60 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u.id)}
                          disabled={busy}
                          className="rounded bg-primary px-3 py-1.5 font-mono text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                      </div>
                    )}

                    {rowError[u.id] && (
                      <p className="mt-1.5 font-mono text-[11px] text-red-400">{rowError[u.id]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
