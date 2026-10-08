"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import {
  Eraser,
  GitBranch,
  GitCommit,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { listBranches, listCommits, ingestCommits, ingestRepository } from "@/services/repositories";
import { ingestDocuments } from "@/services/documents";
import {
  createProject,
  deleteProject,
  deleteProjectIndex,
  getProjectIngestions,
  listProjects,
} from "@/services/projects";
import type { Ingestion, Project, RepositoryCommit } from "@/types/api";

function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "No se pudo conectar con el servidor.";
    const detail = err.response.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

// Panel de administración de proyectos: crear/elegir un proyecto, indexar
// documentos/repos/commits en él, y ver qué se le ha indexado. Funcionalmente
// se basa en lo que ya existe del lado del backend (si-backend: catálogo de
// proyectos, ingestión de documentos/repositorios/commits, solo-admin), pero
// con nuestro propio diseño — no el del backend, que no tiene interfaz propia.
export default function AdminProyectosPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [clearingIndex, setClearingIndex] = useState(false);
  const [clearIndexMessage, setClearIndexMessage] = useState<string | null>(null);
  const [clearIndexError, setClearIndexError] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Cambia cada vez que algo se indexa, para forzar a <ProjectIngestions> a
  // recargar (se le pasa como parte de su `key`, junto al project_id).
  const [reloadToken, setReloadToken] = useState(0);

  function loadProjects() {
    setProjectsError(null);
    listProjects()
      .then(setProjects)
      .catch((err) => setProjectsError(errorMessage(err, "No se pudo cargar el catálogo de proyectos.")));
  }

  useEffect(() => {
    let active = true;
    listProjects()
      .then((data) => {
        if (active) setProjects(data);
      })
      .catch((err) => {
        if (active) setProjectsError(errorMessage(err, "No se pudo cargar el catálogo de proyectos."));
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedProject = useMemo(
    () => (projects ?? []).find((p) => p.project_id === selectedId) ?? null,
    [projects, selectedId]
  );

  async function handleCreateProject(event: FormEvent) {
    event.preventDefault();
    setCreateError(null);
    if (!newName.trim()) {
      setCreateError("El nombre es obligatorio.");
      return;
    }
    setCreating(true);
    try {
      const project = await createProject({
        name: newName.trim(),
        project_id: newId.trim() || undefined,
        description: newDescription.trim() || undefined,
      });
      setProjects((current) => [project, ...(current ?? [])]);
      setSelectedId(project.project_id);
      setShowCreate(false);
      setNewName("");
      setNewId("");
      setNewDescription("");
    } catch (err) {
      setCreateError(errorMessage(err, "No se pudo crear el proyecto."));
    } finally {
      setCreating(false);
    }
  }

  async function handleClearIndex() {
    if (!selectedId) return;
    if (
      !window.confirm(
        `¿Vaciar el índice de "${selectedId}"? Se borran los fragmentos indexados; el proyecto se mantiene en el catálogo.`
      )
    ) {
      return;
    }
    setClearingIndex(true);
    setClearIndexError(null);
    setClearIndexMessage(null);
    try {
      const result = await deleteProjectIndex(selectedId);
      setClearIndexMessage(`Índice vaciado (${result.deleted_chunks} fragmentos eliminados).`);
    } catch (err) {
      setClearIndexError(errorMessage(err, "No se pudo vaciar el índice."));
    } finally {
      setClearingIndex(false);
    }
  }

  async function handleDeleteProject() {
    if (!selectedId) return;
    if (!window.confirm(`¿Eliminar el proyecto "${selectedId}" del catálogo? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingProject(true);
    setDeleteError(null);
    try {
      await deleteProject(selectedId);
      setProjects((current) => (current ?? []).filter((p) => p.project_id !== selectedId));
      setSelectedId("");
    } catch (err) {
      setDeleteError(errorMessage(err, "No se pudo eliminar el proyecto."));
    } finally {
      setDeletingProject(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      {/* Panel de gestión: catálogo, creación e indexación */}
      <aside className="flex w-72 flex-shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar px-3 py-3">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-[13px] font-medium text-foreground">Administración de proyectos</span>
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Proyecto</label>
          <div className="flex items-center gap-1.5">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded border border-border bg-secondary px-2.5 py-2 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
            >
              <option value="">Selecciona un proyecto</option>
              {(projects ?? []).map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadProjects}
              title="Recargar catálogo"
              className="flex-shrink-0 rounded border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          {projectsError && <p className="font-mono text-[11px] text-red-400">{projectsError}</p>}
          {projects === null && !projectsError && (
            <p className="font-mono text-[11px] text-muted-foreground">Cargando…</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-primary transition-colors hover:text-primary/80"
        >
          <Plus className="h-3 w-3" /> Crear proyecto
        </button>

        {showCreate && (
          <form onSubmit={handleCreateProject} className="mt-2 space-y-2 rounded border border-border bg-card p-3">
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Nombre</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded border border-border bg-secondary px-2 py-1.5 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                project_id (opcional)
              </label>
              <input
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="se genera del nombre"
                className="w-full rounded border border-border bg-secondary px-2 py-1.5 text-[12px] text-foreground placeholder-muted-foreground focus:border-primary/60 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Descripción (opcional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                className="w-full resize-none rounded border border-border bg-secondary px-2 py-1.5 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
              />
            </div>
            {createError && <p className="font-mono text-[11px] text-red-400">{createError}</p>}
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded bg-primary py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "Creando…" : "Crear"}
            </button>
          </form>
        )}

        <div className="my-3 border-t border-sidebar-border" />

        {selectedId ? (
          <IndexingPanel
            key={selectedId}
            projectId={selectedId}
            onIndexed={() => setReloadToken((t) => t + 1)}
          />
        ) : (
          <p className="font-mono text-[11px] text-muted-foreground">
            Selecciona o crea un proyecto para indexar documentos, repositorios o commits en él.
          </p>
        )}
      </aside>

      {/* Detalle del proyecto seleccionado */}
      <main className="flex-1 overflow-y-auto p-6">
        {!selectedProject && (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-[13px] text-muted-foreground">
              Selecciona o crea un proyecto para administrar su indexación.
            </p>
          </div>
        )}

        {selectedProject && (
          <div className="max-w-3xl space-y-5">
            <div className="flex items-start justify-between gap-4 rounded border border-border bg-card p-5">
              <div className="min-w-0 space-y-1">
                <h2 className="truncate text-lg font-semibold text-foreground">{selectedProject.name}</h2>
                <p className="font-mono text-[11px] text-primary">{selectedProject.project_id}</p>
                {selectedProject.description && (
                  <p className="text-[13px] text-muted-foreground">{selectedProject.description}</p>
                )}
                <p className="font-mono text-[10px] text-muted-foreground">
                  Creado por {selectedProject.created_by} ·{" "}
                  {new Date(selectedProject.created_at).toLocaleString("es-GT")}
                </p>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                <button
                  type="button"
                  onClick={handleClearIndex}
                  disabled={clearingIndex}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 font-mono text-[11px] text-amber-400 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Eraser className="h-3 w-3" /> {clearingIndex ? "Vaciando…" : "Vaciar índice"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  disabled={deletingProject}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 font-mono text-[11px] text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" /> {deletingProject ? "Eliminando…" : "Eliminar proyecto"}
                </button>
                {clearIndexMessage && (
                  <p className="font-mono text-[10px] text-emerald-400">{clearIndexMessage}</p>
                )}
                {clearIndexError && <p className="font-mono text-[10px] text-red-400">{clearIndexError}</p>}
                {deleteError && <p className="font-mono text-[10px] text-red-400">{deleteError}</p>}
              </div>
            </div>

            <ProjectIngestions key={`${selectedId}:${reloadToken}`} projectId={selectedId} />
          </div>
        )}
      </main>
    </div>
  );
}

// Formularios para indexar documentos, un repositorio (explorando sus ramas
// primero) o commits puntuales, todos sobre `projectId`. Vive como componente
// aparte y se monta con key={projectId} desde el padre: así todo su estado
// (archivos elegidos, ramas/commits encontrados, mensajes) se reinicia solo al
// cambiar de proyecto, sin necesitar un efecto que resetee manualmente.
function IndexingPanel({ projectId, onIndexed }: { projectId: string; onIndexed: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [docsMessage, setDocsMessage] = useState<string | null>(null);
  const [docsError, setDocsError] = useState<string | null>(null);

  const [repoUrl, setRepoUrl] = useState("");
  const [branches, setBranches] = useState<string[] | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [ingestingRepo, setIngestingRepo] = useState(false);
  const [repoMessage, setRepoMessage] = useState<string | null>(null);
  const [repoError, setRepoError] = useState<string | null>(null);

  const [commitsBranch, setCommitsBranch] = useState("");
  const [commits, setCommits] = useState<RepositoryCommit[] | null>(null);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [commitsError, setCommitsError] = useState<string | null>(null);
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
  const [ingestingCommits, setIngestingCommits] = useState(false);
  const [commitsMessage, setCommitsMessage] = useState<string | null>(null);

  async function handleUploadDocuments() {
    if (files.length === 0) return;
    setUploadingDocs(true);
    setDocsError(null);
    setDocsMessage(null);
    try {
      const result = await ingestDocuments(projectId, files);
      setDocsMessage(`Indexado: ${result.total_chunks ?? "listo"} fragmentos.`);
      setFiles([]);
      onIndexed();
    } catch (err) {
      setDocsError(errorMessage(err, "No se pudieron indexar los documentos."));
    } finally {
      setUploadingDocs(false);
    }
  }

  async function handleSearchBranches() {
    if (!repoUrl.trim()) return;
    setBranchesLoading(true);
    setBranchesError(null);
    setBranches(null);
    setSelectedBranches([]);
    try {
      setBranches(await listBranches(repoUrl.trim()));
    } catch (err) {
      setBranchesError(errorMessage(err, "No se pudieron obtener las ramas."));
    } finally {
      setBranchesLoading(false);
    }
  }

  function toggleBranch(branch: string) {
    setSelectedBranches((current) =>
      current.includes(branch) ? current.filter((b) => b !== branch) : [...current, branch]
    );
  }

  async function handleIngestRepo() {
    if (!repoUrl.trim() || selectedBranches.length === 0) return;
    setIngestingRepo(true);
    setRepoError(null);
    setRepoMessage(null);
    try {
      const result = await ingestRepository(projectId, repoUrl.trim(), selectedBranches);
      setRepoMessage(`Indexado: ${result.total_files ?? "?"} archivos, ${result.total_chunks ?? "?"} fragmentos.`);
      onIndexed();
    } catch (err) {
      setRepoError(errorMessage(err, "No se pudo indexar el repositorio."));
    } finally {
      setIngestingRepo(false);
    }
  }

  async function handleSearchCommits() {
    if (!repoUrl.trim()) return;
    setCommitsLoading(true);
    setCommitsError(null);
    setCommits(null);
    setSelectedCommits([]);
    try {
      setCommits(await listCommits(repoUrl.trim(), commitsBranch));
    } catch (err) {
      setCommitsError(errorMessage(err, "No se pudieron obtener los commits."));
    } finally {
      setCommitsLoading(false);
    }
  }

  function toggleCommit(sha: string) {
    setSelectedCommits((current) => {
      if (current.includes(sha)) return current.filter((c) => c !== sha);
      if (current.length >= 10) return current; // el backend acepta máx. 10 por ingesta
      return [...current, sha];
    });
  }

  async function handleIngestCommits() {
    if (!repoUrl.trim() || selectedCommits.length === 0) return;
    setIngestingCommits(true);
    setCommitsError(null);
    setCommitsMessage(null);
    try {
      const result = await ingestCommits(projectId, repoUrl.trim(), selectedCommits);
      setCommitsMessage(`Indexado: ${result.total_files ?? "?"} archivos, ${result.total_chunks ?? "?"} fragmentos.`);
      onIndexed();
    } catch (err) {
      setCommitsError(errorMessage(err, "No se pudieron indexar los commits."));
    } finally {
      setIngestingCommits(false);
    }
  }

  return (
    <>
      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Subir documentos
        </label>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-[11px] text-muted-foreground file:mr-2 file:rounded file:border file:border-border file:bg-secondary file:px-2 file:py-1 file:text-[11px] file:text-foreground"
        />
        <button
          type="button"
          onClick={handleUploadDocuments}
          disabled={files.length === 0 || uploadingDocs}
          className="flex w-full items-center justify-center gap-1.5 rounded border border-primary/20 bg-primary/10 px-2.5 py-1.5 font-mono text-[11px] text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Upload className="h-3 w-3" /> {uploadingDocs ? "Indexando…" : "Indexar documentos"}
        </button>
        {docsMessage && <p className="font-mono text-[11px] text-emerald-400">{docsMessage}</p>}
        {docsError && <p className="font-mono text-[11px] text-red-400">{docsError}</p>}
      </div>

      <div className="my-3 border-t border-sidebar-border" />

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Cargar repositorio (GitHub)
        </label>
        <input
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/usuario/repo"
          className="w-full rounded border border-border bg-secondary px-2.5 py-2 text-[12px] text-foreground placeholder-muted-foreground focus:border-primary/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSearchBranches}
          disabled={!repoUrl.trim() || branchesLoading}
          className="flex w-full items-center justify-center gap-1.5 rounded border border-border bg-secondary px-2.5 py-1.5 font-mono text-[11px] text-foreground transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <GitBranch className="h-3 w-3" /> {branchesLoading ? "Buscando…" : "Buscar ramas"}
        </button>
        {branchesError && <p className="font-mono text-[11px] text-red-400">{branchesError}</p>}
        {branches && branches.length === 0 && (
          <p className="font-mono text-[11px] text-muted-foreground">Sin ramas encontradas.</p>
        )}
        {branches && branches.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {branches.map((b) => {
                const active = selectedBranches.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBranch(b)}
                    className={`rounded border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleIngestRepo}
              disabled={selectedBranches.length === 0 || ingestingRepo}
              className="flex w-full items-center justify-center gap-1.5 rounded bg-primary px-2.5 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ingestingRepo ? "Indexando…" : "Indexar repositorio"}
            </button>
          </div>
        )}
        {repoMessage && <p className="font-mono text-[11px] text-emerald-400">{repoMessage}</p>}
        {repoError && <p className="font-mono text-[11px] text-red-400">{repoError}</p>}
      </div>

      <div className="my-3 border-t border-sidebar-border" />

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Indexar commits puntuales
        </label>
        <input
          value={commitsBranch}
          onChange={(e) => setCommitsBranch(e.target.value)}
          placeholder="rama (opcional, vacío = HEAD)"
          className="w-full rounded border border-border bg-secondary px-2.5 py-2 text-[12px] text-foreground placeholder-muted-foreground focus:border-primary/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSearchCommits}
          disabled={!repoUrl.trim() || commitsLoading}
          className="flex w-full items-center justify-center gap-1.5 rounded border border-border bg-secondary px-2.5 py-1.5 font-mono text-[11px] text-foreground transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <GitCommit className="h-3 w-3" /> {commitsLoading ? "Buscando…" : "Buscar commits"}
        </button>
        {!repoUrl.trim() && (
          <p className="font-mono text-[10px] text-muted-foreground">Usa la URL del repositorio de arriba.</p>
        )}
        {commitsError && <p className="font-mono text-[11px] text-red-400">{commitsError}</p>}
        {commits && commits.length === 0 && (
          <p className="font-mono text-[11px] text-muted-foreground">Sin commits encontrados.</p>
        )}
        {commits && commits.length > 0 && (
          <div className="space-y-1.5">
            <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-border p-1.5">
              {commits.map((c) => {
                const active = selectedCommits.includes(c.sha);
                return (
                  <label
                    key={c.sha}
                    className={`flex cursor-pointer items-start gap-1.5 rounded px-1.5 py-1 text-[11px] transition-colors ${
                      active ? "bg-primary/10" : "hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleCommit(c.sha)}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-primary">{c.sha.slice(0, 7)}</span>
                      <span className="block truncate text-muted-foreground">{c.message}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">{selectedCommits.length}/10 seleccionados</p>
            <button
              type="button"
              onClick={handleIngestCommits}
              disabled={selectedCommits.length === 0 || ingestingCommits}
              className="flex w-full items-center justify-center gap-1.5 rounded bg-primary px-2.5 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ingestingCommits ? "Indexando…" : "Indexar commits"}
            </button>
          </div>
        )}
        {commitsMessage && <p className="font-mono text-[11px] text-emerald-400">{commitsMessage}</p>}
      </div>
    </>
  );
}

// Historial de lo indexado en un proyecto. Se monta con
// key={`${projectId}:${reloadToken}`} desde el padre: cambiar de proyecto o
// terminar una ingesta nueva remonta el componente y dispara una carga fresca,
// sin un efecto que tenga que resetear el estado a mano.
function ProjectIngestions({ projectId }: { projectId: string }) {
  const [ingestions, setIngestions] = useState<Ingestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getProjectIngestions(projectId)
      .then((data) => {
        if (active) setIngestions(data);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err, "No se pudo cargar el historial de indexación."));
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  return (
    <div>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Historial de indexación
      </p>
      {error && <p className="font-mono text-[12px] text-red-400">{error}</p>}
      {!error && ingestions === null && <p className="font-mono text-[12px] text-muted-foreground">Cargando…</p>}
      {ingestions && ingestions.length === 0 && (
        <p className="font-mono text-[12px] text-muted-foreground">Nada indexado todavía.</p>
      )}
      {ingestions && ingestions.length > 0 && (
        <div className="overflow-hidden rounded border border-border bg-card">
          {ingestions.map((ing, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-2.5 font-mono text-[12px] text-muted-foreground last:border-0"
            >
              <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase text-foreground">
                {ing.type}
              </span>
              <span className="min-w-0 flex-1 truncate text-foreground">{ing.source}</span>
              <span>{ing.files_processed ?? "—"} archivos</span>
              <span>{ing.chunks_created ?? "—"} fragmentos</span>
              <span>{new Date(ing.created_at).toLocaleDateString("es-GT")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
