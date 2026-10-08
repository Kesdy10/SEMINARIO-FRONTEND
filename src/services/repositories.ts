import api from "./api";
import type {
  RepositoryBranchesResult,
  RepositoryCommit,
  RepositoryCommitsResult,
  RepositoryIngestResult,
} from "@/types/api";

// Indexar un repositorio completo tarda más que una consulta normal; igual para
// explorar commits (requiere clonar). Todo esto es solo-admin en el backend.
const REPO_TIMEOUT_MS = 180000;

// Paso 1 para indexar un repo: explorar sus ramas disponibles.
export async function listBranches(repositoryUrl: string): Promise<string[]> {
  const response = await api.post<RepositoryBranchesResult>("/api/v1/repositories/branches", {
    repository_url: repositoryUrl,
  });
  const raw = response.data.branches ?? [];
  return raw.map((b) => (typeof b === "string" ? b : b.name)).filter(Boolean);
}

// Paso 2: indexar las ramas elegidas.
export async function ingestRepository(
  projectId: string,
  repositoryUrl: string,
  branches: string[]
): Promise<RepositoryIngestResult> {
  const response = await api.post<RepositoryIngestResult>(
    "/api/v1/repositories/ingest",
    { project_id: projectId, repository_url: repositoryUrl, branches },
    { timeout: REPO_TIMEOUT_MS }
  );
  return response.data;
}

// Paso 1 para indexar commits puntuales: listar los commits recientes de una rama.
export async function listCommits(
  repositoryUrl: string,
  branch?: string,
  limit = 20
): Promise<RepositoryCommit[]> {
  const response = await api.post<RepositoryCommitsResult>("/api/v1/repositories/commits", {
    repository_url: repositoryUrl,
    branch: branch?.trim() || undefined,
    limit,
  });
  return response.data.commits ?? [];
}

// Paso 2: indexar hasta 10 commits puntuales (código + metadata + diff).
export async function ingestCommits(
  projectId: string,
  repositoryUrl: string,
  commits: string[]
): Promise<RepositoryIngestResult> {
  const response = await api.post<RepositoryIngestResult>(
    "/api/v1/repositories/commits/ingest",
    { project_id: projectId, repository_url: repositoryUrl, commits },
    { timeout: REPO_TIMEOUT_MS }
  );
  return response.data;
}
