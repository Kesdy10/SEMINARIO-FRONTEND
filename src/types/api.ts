// Tipos que coinciden con el contrato real del backend (si-backend)

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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