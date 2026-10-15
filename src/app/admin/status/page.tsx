"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle, Clock, Loader, RefreshCw, Zap } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getStatus } from "@/services/status";

interface StatusData {
  rag_health?: {
    status: string;
    message?: string;
    last_check?: string;
  };
  metrics?: {
    total_queries?: number;
    avg_response_time_ms?: number;
    successful_queries?: number;
    failed_queries?: number;
  };
  backend_stats?: {
    total_users?: number;
    total_projects?: number;
    total_conversations?: number;
    total_documents?: number;
    total_repositories?: number;
  };
  [key: string]: any;
}

export default function StatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStatus();
      setStatus(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError("No se pudo cargar el estado del sistema.");
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const isHealthy = status?.rag_health?.status === "healthy" || status?.rag_health?.status === "ok";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Estado del sistema</h1>
          </div>
          <button
            onClick={loadStatus}
            disabled={isLoading}
            className="rounded border border-border bg-secondary px-2.5 py-1.5 text-[12px] text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            <RefreshCw className={`inline h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="space-y-4 p-4">
            {error && (
              <div className="rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && status && (
              <>
                {/* RAG Health */}
                <div className="rounded border border-border bg-secondary/30 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    {isHealthy ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    )}
                    <h2 className="text-sm font-semibold text-foreground">Estado RAG</h2>
                  </div>
                  <div className="space-y-2 font-mono text-[12px]">
                    <p>
                      <span className="text-muted-foreground">Estado:</span>{" "}
                      <span
                        className={`inline-block rounded px-2 py-0.5 ${
                          isHealthy
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {status.rag_health?.status || "desconocido"}
                      </span>
                    </p>
                    {status.rag_health?.message && (
                      <p>
                        <span className="text-muted-foreground">Mensaje:</span> {status.rag_health.message}
                      </p>
                    )}
                    {status.rag_health?.last_check && (
                      <p>
                        <span className="text-muted-foreground">Última verificación:</span>{" "}
                        {new Date(status.rag_health.last_check).toLocaleString("es-GT")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Query Metrics */}
                {status.metrics && (
                  <div className="rounded border border-border bg-secondary/30 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <h2 className="text-sm font-semibold text-foreground">Métricas de consultas</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 font-mono text-[12px] md:grid-cols-4">
                      {status.metrics.total_queries !== undefined && (
                        <div className="rounded bg-primary/10 p-2 text-center">
                          <p className="text-muted-foreground">Total</p>
                          <p className="text-lg font-semibold text-primary">
                            {status.metrics.total_queries}
                          </p>
                        </div>
                      )}
                      {status.metrics.successful_queries !== undefined && (
                        <div className="rounded bg-emerald-500/10 p-2 text-center">
                          <p className="text-muted-foreground">Exitosas</p>
                          <p className="text-lg font-semibold text-emerald-400">
                            {status.metrics.successful_queries}
                          </p>
                        </div>
                      )}
                      {status.metrics.failed_queries !== undefined && (
                        <div className="rounded bg-red-500/10 p-2 text-center">
                          <p className="text-muted-foreground">Fallidas</p>
                          <p className="text-lg font-semibold text-red-400">
                            {status.metrics.failed_queries}
                          </p>
                        </div>
                      )}
                      {status.metrics.avg_response_time_ms !== undefined && (
                        <div className="rounded bg-purple-500/10 p-2 text-center">
                          <p className="text-muted-foreground">Promedio (ms)</p>
                          <p className="text-lg font-semibold text-purple-400">
                            {Math.round(status.metrics.avg_response_time_ms)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Backend Stats */}
                {status.backend_stats && (
                  <div className="rounded border border-border bg-secondary/30 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <h2 className="text-sm font-semibold text-foreground">Estadísticas backend</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 font-mono text-[12px] md:grid-cols-5">
                      {status.backend_stats.total_users !== undefined && (
                        <div className="rounded bg-blue-500/10 p-2 text-center">
                          <p className="text-muted-foreground">Usuarios</p>
                          <p className="text-lg font-semibold text-blue-400">
                            {status.backend_stats.total_users}
                          </p>
                        </div>
                      )}
                      {status.backend_stats.total_projects !== undefined && (
                        <div className="rounded bg-green-500/10 p-2 text-center">
                          <p className="text-muted-foreground">Proyectos</p>
                          <p className="text-lg font-semibold text-green-400">
                            {status.backend_stats.total_projects}
                          </p>
                        </div>
                      )}
                      {status.backend_stats.total_conversations !== undefined && (
                        <div className="rounded bg-yellow-500/10 p-2 text-center">
                          <p className="text-muted-foreground">Conversaciones</p>
                          <p className="text-lg font-semibold text-yellow-400">
                            {status.backend_stats.total_conversations}
                          </p>
                        </div>
                      )}
                      {status.backend_stats.total_documents !== undefined && (
                        <div className="rounded bg-purple-500/10 p-2 text-center">
                          <p className="text-muted-foreground">Documentos</p>
                          <p className="text-lg font-semibold text-purple-400">
                            {status.backend_stats.total_documents}
                          </p>
                        </div>
                      )}
                      {status.backend_stats.total_repositories !== undefined && (
                        <div className="rounded bg-pink-500/10 p-2 text-center">
                          <p className="text-muted-foreground">Repos</p>
                          <p className="text-lg font-semibold text-pink-400">
                            {status.backend_stats.total_repositories}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                {lastUpdated && (
                  <div className="flex items-center gap-2 rounded bg-secondary/30 px-3 py-2 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Actualizado: {lastUpdated.toLocaleTimeString("es-GT")}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
