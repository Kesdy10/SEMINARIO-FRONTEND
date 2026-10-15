import api from "./api";
import type { QueryRequest, QueryResponse } from "@/types/api";

// El RAG puede tardar en generar la respuesta, así que se da más tiempo que a otras peticiones
const QUERY_TIMEOUT_MS = 60000;

// Envía una pregunta al backend y devuelve la respuesta del RAG con sus fuentes.
// Para continuar una conversación, se envía el conversation_id de la respuesta anterior.
export async function query(data: QueryRequest): Promise<QueryResponse> {
  const response = await api.post<QueryResponse>("/api/v1/query", data, {
    timeout: QUERY_TIMEOUT_MS,
  });
  return response.data;
}

// Compara dos ramas de un repositorio y devuelve el análisis de cambios.
// El RAG explica los cambios con evidencia de los archivos modificados.
export async function compareQueries(data: {
  project_id: string;
  repository_url: string;
  branch_a: string;
  branch_b: string;
  question: string;
}): Promise<unknown> {
  const response = await api.post<unknown>("/api/v1/compare", data, {
    timeout: QUERY_TIMEOUT_MS,
  });
  return response.data;
}
