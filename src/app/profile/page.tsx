"use client";

import { Mail, Shield, User as UserIcon } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  return (
    <MainLayout>
      <div className="max-w-lg space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Perfil</h2>

        {isLoading && <p className="font-mono text-[13px] text-muted-foreground">Cargando…</p>}

        {!isLoading && user && (
          <div className="space-y-3 rounded border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded border border-primary/30 bg-primary/10">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-foreground">{user.name}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{user.id}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                {user.role}
              </div>
            </div>
          </div>
        )}

        {!isLoading && !user && (
          <p className="font-mono text-[13px] text-muted-foreground">No se pudo cargar el perfil.</p>
        )}
      </div>
    </MainLayout>
  );
}
