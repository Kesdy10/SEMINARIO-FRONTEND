import api from "./api";
import type { StatusData } from "@/types/api";

// Obtener el estado del sistema: salud del RAG y sus dependencias,
// métricas de consultas del RAG, y estadísticas del backend.
// Incluye información sobre usuarios, proyectos, conversaciones y tiempo de respuesta.
export async function getStatus(): Promise<StatusData> {
  const response = await api.get<StatusData>("/api/v1/status");
  return response.data;
}
