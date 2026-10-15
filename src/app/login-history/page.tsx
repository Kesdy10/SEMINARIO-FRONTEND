"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { getLoginHistory, type LoginHistoryEntry } from "@/services/loginHistory";
import { formatDateTime } from "@/lib/dates";

// Convierte el user-agent crudo en algo legible, ej. "Chrome · Windows".
function formatBrowser(userAgent?: string): string {
  if (!userAgent) return "—";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\/|Opera/.test(userAgent)
      ? "Opera"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : null;
  const os = /iPhone|iPad/.test(userAgent)
    ? "iOS"
    : /Android/.test(userAgent)
      ? "Android"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Mac OS X/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : null;
  if (!browser && !os) return userAgent;
  return [browser, os].filter(Boolean).join(" · ");
}

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
      <div className="max-w-4xl space-y-4">
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
          <div className="overflow-x-auto rounded border border-border bg-card">
            <table className="w-full text-left font-mono text-[12px]">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Fecha</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 font-medium">IP</th>
                  <th className="px-4 py-2.5 font-medium">Navegador</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const when = entry.timestamp ?? entry.created_at;
                  const ip = entry.ip_address ?? entry.ip ?? "—";
                  return (
                    <tr
                      key={i}
                      className="border-b border-border text-muted-foreground last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-foreground">
                        {formatDateTime(when)}
                      </td>
                      <td className="px-4 py-2.5">
                        {entry.success === undefined ? (
                          "—"
                        ) : (
                          <span
                            className={
                              entry.success
                                ? "rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400"
                                : "rounded bg-red-500/10 px-2 py-0.5 text-red-400"
                            }
                          >
                            {entry.success ? "éxito" : "fallido"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">{ip}</td>
                      <td className="px-4 py-2.5" title={entry.user_agent}>
                        {formatBrowser(entry.user_agent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
