"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Layers, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-[13px] text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-primary/30 bg-primary/10">
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-[14px] font-semibold text-foreground">Plataforma RAG</h1>
            {user && (
              <p className="font-mono text-[11px] text-muted-foreground">Bienvenido, {user.name}</p>
            )}
          </div>
        </div>

        {user && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded border border-border bg-secondary px-3 py-1.5 font-mono text-[12px] text-foreground transition-colors hover:border-red-500/40 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
          </button>
        )}
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}
