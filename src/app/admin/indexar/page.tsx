"use client";

import { useEffect, useState } from "react";
import { Upload, Loader, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { listProjects } from "@/services/projects";
import { listCommits, ingestCommits } from "@/services/repositories";
import type { Project } from "@/types/api";

interface Commit {
  hash: string;
  id: string;
  message?: string;
  title?: string;
}

export default function IndexarPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Repository state
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);

  // Document state
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  // Commits state
  const [showCommitsTab, setShowCommitsTab] = useState(false);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [commitsForBranch, setCommitsForBranch] = useState("");
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
  const [isFetchingCommits, setIsFetchingCommits] = useState(false);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].project_id);
      }
    } catch (_err) {
      setError("No se pudieron cargar los proyectos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadProjects();
    })();
  }, []);

  const handleFetchBranches = async () => {
    if (!repositoryUrl.trim()) {
      setError("Ingresa una URL de repositorio.");
      return;
    }

    setIsFetchingBranches(true);
    setError(null);
    setBranches([]);
    setSelectedBranches([]);

    try {
      const response = await fetch("/api/v1/repositories/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ repository_url: repositoryUrl }),
      });

      if (!response.ok) throw new Error("Failed to fetch branches");
      const data = await response.json();
      const branchNames = (data.branches || []).map((b: unknown) =>
        typeof b === "string" ? b : (b as { name: string }).name
      );
      setBranches(branchNames);
    } catch (_err) {
      setError("No se pudieron cargar las ramas del repositorio.");
    } finally {
      setIsFetchingBranches(false);
    }
  };

  const handleIngestRepository = async () => {
    if (!selectedProjectId) {
      setError("Selecciona un proyecto.");
      return;
    }
    if (!repositoryUrl.trim()) {
      setError("Ingresa una URL de repositorio.");
      return;
    }
    if (selectedBranches.length === 0) {
      setError("Selecciona al menos una rama.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/v1/repositories/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          project_id: selectedProjectId,
          repository_url: repositoryUrl,
          branches: selectedBranches,
        }),
      });

      if (!response.ok) throw new Error("Failed to ingest repository");
      setSuccess("Repositorio indexado exitosamente.");
      setRepositoryUrl("");
      setBranches([]);
      setSelectedBranches([]);
    } catch (_err) {
      setError("Error al indexar el repositorio.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleFetchCommits = async () => {
    if (!repositoryUrl.trim()) {
      setError("Ingresa una URL de repositorio.");
      return;
    }
    if (!commitsForBranch.trim()) {
      setError("Selecciona una rama.");
      return;
    }

    setIsFetchingCommits(true);
    setError(null);
    setCommits([]);
    setSelectedCommits([]);

    try {
      const response = await fetch("/api/v1/repositories/commits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          repository_url: repositoryUrl,
          branch: commitsForBranch,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch commits");
      const data = await response.json();
      setCommits(data.commits || []);
    } catch (_err) {
      setError("No se pudieron cargar los commits.");
    } finally {
      setIsFetchingCommits(false);
    }
  };

  const handleIngestCommits = async () => {
    if (!selectedProjectId) {
      setError("Selecciona un proyecto.");
      return;
    }
    if (!repositoryUrl.trim()) {
      setError("Ingresa una URL de repositorio.");
      return;
    }
    if (!commitsForBranch.trim()) {
      setError("Selecciona una rama.");
      return;
    }
    if (selectedCommits.length === 0) {
      setError("Selecciona al menos un commit.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/v1/repositories/commits/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          project_id: selectedProjectId,
          repository_url: repositoryUrl,
          branch: commitsForBranch,
          commit_hashes: selectedCommits,
        }),
      });

      if (!response.ok) throw new Error("Failed to ingest commits");
      setSuccess("Commits indexados exitosamente.");
      setRepositoryUrl("");
      setBranches([]);
      setSelectedBranches([]);
      setCommits([]);
      setSelectedCommits([]);
      setCommitsForBranch("");
      setShowCommitsTab(false);
    } catch (_err) {
      setError("Error al indexar los commits.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIngestDocument = async () => {
    if (!selectedProjectId) {
      setError("Selecciona un proyecto.");
      return;
    }
    if (!documentFile) {
      setError("Selecciona un archivo.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("project_id", selectedProjectId);
      formData.append("file", documentFile);

      const response = await fetch("/api/v1/documents/ingest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to ingest document");
      setSuccess("Documento indexado exitosamente.");
      setDocumentFile(null);
    } catch (_err) {
      setError("Error al indexar el documento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground">Indexación</h1>
          <button
            onClick={loadProjects}
            disabled={isLoading}
            className="rounded border border-border bg-secondary px-2.5 py-1.5 text-[12px] text-foreground hover:bg-secondary/80 disabled:opacity-50"
          >
            <RefreshCw className={`inline h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="mb-4 flex gap-2 rounded border border-red-500/20 bg-red-500/10 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 flex gap-2 rounded border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-emerald-400">{success}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-w-2xl space-y-6">
              {/* Project Selector */}
              <div className="rounded border border-border bg-secondary/30 p-4">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  Proyecto
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded border border-border bg-secondary px-3 py-2 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
                >
                  <option value="">Selecciona un proyecto</option>
                  {projects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Repository Section */}
              <div className="rounded border border-border bg-secondary/30 p-4 space-y-3">
                <h2 className="text-sm font-semibold text-foreground">Indexar Repositorio</h2>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    URL del Repositorio
                  </label>
                  <input
                    type="text"
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/usuario/repo"
                    className="w-full rounded border border-border bg-secondary px-3 py-2 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleFetchBranches}
                  disabled={isFetchingBranches}
                  className="w-full rounded border border-border px-3 py-2 text-[12px] text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  {isFetchingBranches ? (
                    <>
                      <Loader className="inline h-3 w-3 animate-spin mr-1" />
                      Cargando ramas...
                    </>
                  ) : (
                    "Cargar Ramas"
                  )}
                </button>

                {branches.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                      Selecciona Ramas
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {branches.map((branch) => (
                        <label key={branch} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBranches.includes(branch)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBranches([...selectedBranches, branch]);
                              } else {
                                setSelectedBranches(
                                  selectedBranches.filter((b) => b !== branch)
                                );
                              }
                            }}
                            className="h-3 w-3"
                          />
                          <span className="text-[12px] text-foreground">{branch}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleIngestRepository}
                  disabled={isSubmitting || branches.length === 0}
                  className="w-full rounded bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="inline h-3 w-3 animate-spin mr-1" />
                      Indexando...
                    </>
                  ) : (
                    "Indexar Repositorio"
                  )}
                </button>
              </div>


              {/* Commits Section */}
              <div className="rounded border border-border bg-secondary/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Indexar Commits Específicos</h2>
                  <button
                    onClick={() => {
                      setShowCommitsTab(!showCommitsTab);
                      setCommits([]);
                      setSelectedCommits([]);
                    }}
                    className="text-[11px] text-primary hover:text-primary/80"
                  >
                    {showCommitsTab ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                {showCommitsTab && (
                  <>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                        URL del Repositorio
                      </label>
                      <input
                        type="text"
                        value={repositoryUrl}
                        onChange={(e) => setRepositoryUrl(e.target.value)}
                        placeholder="https://github.com/usuario/repo"
                        className="w-full rounded border border-border bg-secondary px-3 py-2 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                        Rama
                      </label>
                      <select
                        value={commitsForBranch}
                        onChange={(e) => setCommitsForBranch(e.target.value)}
                        className="w-full rounded border border-border bg-secondary px-3 py-2 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
                      >
                        <option value="">Selecciona una rama</option>
                        {branches.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleFetchCommits}
                      disabled={isFetchingCommits || !commitsForBranch}
                      className="w-full rounded border border-border bg-secondary px-3 py-2 text-[12px] font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                    >
                      {isFetchingCommits ? (
                        <>
                          <Loader className="inline h-3 w-3 animate-spin mr-1" />
                          Cargando commits...
                        </>
                      ) : (
                        "Cargar Commits"
                      )}
                    </button>

                    {commits.length > 0 && (
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                          Selecciona Commits
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {commits.map((commit: Commit) => (
                            <label key={commit.hash || commit.id} className="flex items-start gap-2 cursor-pointer p-2 hover:bg-secondary/50 rounded">
                              <input
                                type="checkbox"
                                checked={selectedCommits.includes(commit.hash || commit.id)}
                                onChange={(e) => {
                                  const hash = commit.hash || commit.id;
                                  if (e.target.checked) {
                                    setSelectedCommits([...selectedCommits, hash]);
                                  } else {
                                    setSelectedCommits(selectedCommits.filter((c) => c !== hash));
                                  }
                                }}
                                className="h-3 w-3 mt-1"
                              />
                              <div className="flex-1">
                                <p className="text-[11px] font-mono text-foreground">{(commit.hash || commit.id).substring(0, 7)}</p>
                                <p className="text-[11px] text-muted-foreground">{commit.message || commit.title || "Sin mensaje"}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleIngestCommits}
                      disabled={isSubmitting || selectedCommits.length === 0}
                      className="w-full rounded bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="inline h-3 w-3 animate-spin mr-1" />
                          Indexando...
                        </>
                      ) : (
                        `Indexar ${selectedCommits.length} Commits`
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Document Section */}
              <div className="rounded border border-border bg-secondary/30 p-4 space-y-3">
                <h2 className="text-sm font-semibold text-foreground">Indexar Documento</h2>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    Selecciona un archivo (PDF, DOCX, TXT)
                  </label>
                  <div className="relative rounded border-2 border-dashed border-border bg-secondary/20 p-6 text-center cursor-pointer hover:border-primary/60 transition-colors">
                    <input
                      type="file"
                      onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-[12px] text-muted-foreground">
                      {documentFile ? documentFile.name : "Haz clic o arrastra un archivo"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleIngestDocument}
                  disabled={isSubmitting || !documentFile}
                  className="w-full rounded bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="inline h-3 w-3 animate-spin mr-1" />
                      Indexando...
                    </>
                  ) : (
                    "Indexar Documento"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
