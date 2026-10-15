"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowRight, Loader, Copy, Check } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { compareQueries } from "@/services/chat";
import { listProjects } from "@/services/projects";
import type { Project } from "@/types/api";

function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "No se pudo conectar con el servidor.";
    const detail = err.response.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

export default function ComparePage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [branchA, setBranchA] = useState("");
  const [branchB, setBranchB] = useState("");
  const [question, setQuestion] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((err) => setProjectsError(errorMessage(err, "No se pudo cargar los proyectos.")));
  }, []);

  async function handleCompare() {
    if (!projectId || !repositoryUrl || !branchA || !branchB) {
      setError("Rellena todos los campos requeridos.");
      return;
    }
    if (branchA === branchB) {
      setError("Las ramas deben ser diferentes.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await compareQueries({
        project_id: projectId,
        repository_url: repositoryUrl,
        branch_a: branchA,
        branch_b: branchB,
        question: question || `Compara ${branchA} vs ${branchB}`,
      });
      setResult(response);
    } catch (err) {
      setError(errorMessage(err, "No se pudo comparar las ramas."));
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (result?.answer) {
      navigator.clipboard.writeText(result.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Comparar ramas</h1>
            <p className="text-[13px] text-muted-foreground">
              Análisis inteligente de cambios entre dos ramas usando RAG
            </p>
          </div>

          <div className="rounded border border-border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Proyecto
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={!projects}
                className="w-full rounded border border-border bg-secondary px-3 py-2 text-[12px] text-foreground focus:border-primary/60 focus:outline-none disabled:opacity-50"
              >
                <option value="">Selecciona un proyecto</option>
                {(projects ?? []).map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {projectsError && (
                <p className="font-mono text-[11px] text-red-400">{projectsError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                URL del repositorio
              </label>
              <input
                type="text"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/usuario/repo"
                className="w-full rounded border border-border bg-secondary px-3 py-2 text-[12px] text-foreground placeholder-muted-foreground focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Rama A
                </label>
                <input
                  type="text"
                  value={branchA}
                  onChange={(e) => setBranchA(e.target.value)}
                  placeholder="main"
                  className="w-full rounded border border-border bg-secondary px-3 py-2 text-[12px] text-foreground placeholder-muted-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Rama B
                </label>
                <input
                  type="text"
                  value={branchB}
                  onChange={(e) => setBranchB(e.target.value)}
                  placeholder="develop"
                  className="w-full rounded border border-border bg-secondary px-3 py-2 text-[12px] text-foreground placeholder-muted-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Pregunta personalizada (opcional)
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="¿Cuáles son las diferencias principales entre estas ramas?"
                rows={2}
                className="w-full resize-none rounded border border-border bg-secondary px-3 py-2 text-[12px] text-foreground placeholder-muted-foreground focus:border-primary/60 focus:outline-none"
              />
            </div>

            {error && <p className="font-mono text-[12px] text-red-400">{error}</p>}

            <button
              onClick={handleCompare}
              disabled={loading || !projectId || !repositoryUrl || !branchA || !branchB}
              className="w-full flex items-center justify-center gap-2 rounded bg-primary px-4 py-2.5 font-mono text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                  Comparando...
                </>
              ) : (
                <>
                  <ArrowRight className="h-3.5 w-3.5" />
                  Comparar ramas
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="rounded border border-border bg-card p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-mono text-[13px] uppercase tracking-wider text-muted-foreground">
                    Análisis de cambios
                  </h2>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 rounded border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <div className="rounded border border-border bg-secondary p-3 text-[12px] text-foreground whitespace-pre-wrap overflow-auto max-h-96">
                  {result.answer}
                </div>
              </div>

              {result.changes && result.changes.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Archivos modificados ({result.changes.length})
                  </p>
                  <div className="space-y-1">
                    {result.changes.map((change: unknown, i: number) => (
                      <div
                        key={i}
                        className="rounded border border-border bg-secondary p-2 text-[11px] text-foreground"
                      >
                        <p className="font-mono text-primary">{change.file}</p>
                        {change.type && (
                          <p className="text-muted-foreground">{change.type}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.sources && result.sources.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Fuentes ({result.sources.length})
                  </p>
                  <div className="space-y-1">
                    {result.sources.map((source: unknown, i: number) => (
                      <div key={i} className="rounded border border-border bg-secondary p-2 text-[11px] text-muted-foreground">
                        <p className="truncate">{source.file || source.name}</p>
                        {source.score && (
                          <p className="text-[10px]">Relevancia: {(source.score * 100).toFixed(0)}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.response_time_ms && (
                <div className="flex gap-4 text-[11px] text-muted-foreground font-mono">
                  <span>⏱ {result.response_time_ms.toFixed(0)}ms</span>
                  {result.model && <span>🤖 {result.model}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
