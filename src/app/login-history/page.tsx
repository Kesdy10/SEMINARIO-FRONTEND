"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { getLoginHistory, type LoginHistoryEntry } from "@/services/loginHistory";

export default function LoginHistoryPage() {
  const [entries, setEntries] = useState<LoginHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getLoginHistory()
      .then((data) => {
        if (active) setEntries(data);
      })
      .catch(() => {
        if (active) setError("No se pudo cargar el historial de accesos.");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <MainLayout>
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Historial de accesos</h2>
        </div>

        {error && <p className="font-mono text-[13px] text-red-400">{error}</p>}

        {!error && entries === null && (
          <p className="font-mono text-[13px] text-muted-foreground">Cargando…</p>
        )}

        {entries && entries.length === 0 && (
          <p className="font-mono text-[13px] text-muted-foreground">Sin registros todavía.</p>
        )}

        {entries && entries.length > 0 && (
          <div className="overflow-hidden rounded border border-border bg-card">
            {entries.map((entry, i) => {
              const when = entry.timestamp ?? entry.created_at ?? "—";
              const ip = entry.ip_address ?? entry.ip ?? "—";
              return (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5 font-mono text-[12px] text-muted-foreground last:border-0"
                >
                  <span className="text-foreground">{when}</span>
                  <span>{ip}</span>
                  {entry.success !== undefined && (
                    <span className={entry.success ? "text-emerald-400" : "text-red-400"}>
                      {entry.success ? "exitoso" : "fallido"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
