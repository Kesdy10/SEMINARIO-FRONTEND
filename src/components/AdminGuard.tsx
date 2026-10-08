"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Protege todo lo que cuelga de /admin: solo usuarios con role "admin" pasan.
// Mientras useAuth carga la sesión, o si no hay sesión/rol válido, no se
// renderiza el contenido (evita un parpadeo con datos de administración).
export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.replace("/chat");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-[13px] text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded border border-red-500/30 bg-red-500/10 px-4 py-3">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 text-red-400" />
          <p className="font-mono text-[12px] text-foreground">Esta sección es solo para administradores.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
