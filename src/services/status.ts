import api from "./api";

// Obtener el estado del sistema: salud del RAG y sus dependencias,
// métricas de consultas del RAG, y estadísticas del backend.
// Incluye información sobre usuarios, proyectos, conversaciones y tiempo de respuesta.
export async function getStatus(): Promise<unknown> {
  const response = await api.get<unknown>("/api/v1/status");
  return response.data;
}
