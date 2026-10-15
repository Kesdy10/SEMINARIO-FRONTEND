"use client";

import { useEffect, useState } from "react";
import type { StatusData } from "@/types/api";
import { Activity, AlertCircle, CheckCircle, Clock, Loader, RefreshCw, Zap } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getStatus } from "@/services/status";

function Tile({ label, value, tone }: { label: string; value: number | null | undefined; tone: string }) {
  if (value === null || value === undefined) return null;
  return (
    <div className={`rounded p-2 text-center ${tone.split(" ")[0]}`}>
      <p className="text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${tone.split(" ")[1]}`}>{Math.round(value)}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <p>
      <span className="text-muted-foreground">{label}:</span> {value}
    </p>
  );
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
    } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setError("No se pudo cargar el estado del sistema.");
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStatus();
  }, []);

  const ragStatus = status?.rag?.status?.toLowerCase();
  const isHealthy = ragStatus === "healthy" || ragStatus === "ok";

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
                {/* Estado del RAG y sus dependencias */}
                <div className="rounded border border-border bg-secondary/30 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    {isHealthy ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    )}
                    <h2 className="text-sm font-semibold text-foreground">Estado RAG</h2>
                  </div>
                  {status.rag_error ? (
                    <p className="rounded bg-red-500/10 px-3 py-2 font-mono text-[12px] text-red-400">
                      El RAG no respondió: {status.rag_error}
                    </p>
                  ) : (
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
                          {status.rag?.status || "desconocido"}
                        </span>
                      </p>
                      <Row label="Base de datos" value={status.rag?.database} />
                      <Row label="Almacén vectorial" value={status.rag?.vector_store} />
                      <Row label="Embeddings" value={status.rag?.embedding_service} />
                      <Row
                        label="Modelo de embeddings"
                        value={[status.rag?.embedding_provider, status.rag?.embedding_model]
                          .filter(Boolean)
                          .join(" / ")}
                      />
                      <Row label="LLM" value={status.rag?.llm_service} />
                      <Row
                        label="Modelo LLM"
                        value={[status.rag?.llm_provider, status.rag?.llm_model]
                          .filter(Boolean)
                          .join(" / ")}
                      />
                    </div>
                  )}
                </div>

                {/* Métricas de consultas del RAG */}
                {(status.rag_metrics || status.rag_metrics_error) && (
                  <div className="rounded border border-border bg-secondary/30 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <h2 className="text-sm font-semibold text-foreground">Métricas de consultas</h2>
                    </div>
                    {status.rag_metrics_error ? (
                      <p className="rounded bg-red-500/10 px-3 py-2 font-mono text-[12px] text-red-400">
                        No se pudieron obtener las métricas: {status.rag_metrics_error}
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 font-mono text-[12px] md:grid-cols-4">
                        <Tile label="Total" value={status.rag_metrics?.total_queries} tone="bg-primary/10 text-primary" />
                        <Tile label="Exitosas" value={status.rag_metrics?.successful_queries} tone="bg-emerald-500/10 text-emerald-400" />
                        <Tile label="Fallidas" value={status.rag_metrics?.failed_queries} tone="bg-red-500/10 text-red-400" />
                        <Tile label="Promedio (ms)" value={status.rag_metrics?.average_response_time_ms} tone="bg-purple-500/10 text-purple-400" />
                      </div>
                    )}
                  </div>
                )}

                {/* Estadísticas del backend */}
                <div className="rounded border border-border bg-secondary/30 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Estadísticas backend</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3 font-mono text-[12px] md:grid-cols-5">
                    <Tile label="Usuarios" value={status.backend.total_users} tone="bg-blue-500/10 text-blue-400" />
                    <Tile label="Proyectos" value={status.backend.total_projects} tone="bg-green-500/10 text-green-400" />
                    <Tile label="Conversaciones" value={status.backend.total_conversations} tone="bg-yellow-500/10 text-yellow-400" />
                    <Tile label="Consultas" value={status.backend.total_queries} tone="bg-primary/10 text-primary" />
                    <Tile label="Promedio (ms)" value={status.backend.average_response_time_ms} tone="bg-purple-500/10 text-purple-400" />
                  </div>
                </div>

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
