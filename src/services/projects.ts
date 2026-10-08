import api from "./api";
import type {
  Ingestion,
  Project,
  ProjectCreateRequest,
  ProjectIndexDeleteResult,
  ProjectUpdateRequest,
} from "@/types/api";

// Catálogo de proyectos: cualquier usuario autenticado puede listarlos,
// el resto de operaciones (crear, editar, borrar, ver ingestas) son solo admin.
export async function listProjects(): Promise<Project[]> {
  const response = await api.get<Project[]>("/api/v1/projects");
  return response.data;
}

export async function createProject(data: ProjectCreateRequest): Promise<Project> {
  const response = await api.post<Project>("/api/v1/projects", data);
  return response.data;
}

export async function updateProject(projectId: string, data: ProjectUpdateRequest): Promise<Project> {
  const response = await api.patch<Project>(`/api/v1/projects/${encodeURIComponent(projectId)}`, data);
  return response.data;
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/api/v1/projects/${encodeURIComponent(projectId)}`);
}

// Vacía el índice del RAG (fragmentos/embeddings) sin borrar el proyecto del catálogo.
export async function deleteProjectIndex(projectId: string): Promise<ProjectIndexDeleteResult> {
  const response = await api.delete<ProjectIndexDeleteResult>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/index`
  );
  return response.data;
}

// Historial de lo que se ha indexado en un proyecto (documentos, repos, commits).
export async function getProjectIngestions(projectId: string): Promise<Ingestion[]> {
  const response = await api.get<Ingestion[]>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/ingestions`
  );
  return response.data;
}
