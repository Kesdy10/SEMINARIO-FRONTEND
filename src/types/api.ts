// Tipos que coinciden con el contrato real del backend (si-backend)

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active?: boolean;
  created_at?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: User;
}

export interface QueryRequest {
  project_id: string;
  question: string;
  branches: string[];
  conversation_id?: string | null;
}

export interface Source {
  chunk_id?: number | null;
  source_type?: string | null;
  source?: string | null;
  repository?: string | null;
  document?: string | null;
  branch?: string | null;
  commit?: string | null;
  file_path?: string | null;
  line_start?: number | null;
  line_end?: number | null;
  page?: number | null;
  tab?: string | null;
  artifact_type?: string | null;
  score?: number | null;
}

export interface QueryResponse {
  conversation_id: string;
  project_id: string;
  question: string;
  answer: string;
  sources: Source[];
  context_chunks_used?: number | null;
  provider?: string | null;
  model?: string | null;
  response_time_ms?: number | null;
}

export interface Message {
  question: string;
  answer: string;
  sources: Source[];
  created_at: string;
}

export interface Conversation {
  conversation_id: string;
  project_id: string;
  created_at: string;
  updated_at: string;
}

// --- Administración: proyectos, indexación y usuarios (solo admin) ---

export interface Project {
  project_id: string;
  name: string;
  description?: string | null;
  created_by: string;
  created_at: string;
}

export interface ProjectCreateRequest {
  project_id?: string;
  name: string;
  description?: string;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
}

export interface ProjectIndexDeleteResult {
  project_id: string;
  deleted_chunks: number;
}

export interface Ingestion {
  type: "document" | "repository" | "commit";
  source: string;
  branches?: string[] | null;
  commits?: string[] | null;
  files_processed?: number | null;
  chunks_created?: number | null;
  created_by: string;
  created_at: string;
}

// El backend reenvía la respuesta del servicio RAG tal cual (sin response_model
// propio en /repositories/branches ni /repositories/ingest), así que se lee de
// forma defensiva: se intentan los nombres esperados y se ignora lo demás.
export interface RepositoryBranchesResult {
  repository?: string;
  branches?: (string | { name: string })[];
  [key: string]: unknown;
}

export interface RepositoryIngestResult {
  total_files?: number;
  total_chunks?: number;
  [key: string]: unknown;
}

export interface RepositoryCommit {
  sha: string;
  message: string;
  authored_at: string;
}

export interface RepositoryCommitsResult {
  repository?: string;
  branch?: string | null;
  commits?: RepositoryCommit[];
  [key: string]: unknown;
}

export interface DocumentIngestResult {
  total_chunks?: number;
  [key: string]: unknown;
}

export interface AdminUserUpdateRequest {
  role?: "user" | "admin";
  active?: boolean;
}