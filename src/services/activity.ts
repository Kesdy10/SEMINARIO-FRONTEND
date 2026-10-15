import api from "./api";
import type { ActivityEvent } from "@/types/api";

// Obtener el feed de actividad reciente del sistema.
// Muestra proyectos creados y documentos/repos indexados.
// Un usuario regular solo ve el tipo de evento; un admin ve detalles completos.
export async function getActivity(since?: Date): Promise<ActivityEvent[]> {
  const params: Record<string, string> = {};
  if (since) {
    params.since = since.toISOString();
  }
  
  const response = await api.get<ActivityEvent[]>("/api/v1/activity", { params });
  return response.data;
}
