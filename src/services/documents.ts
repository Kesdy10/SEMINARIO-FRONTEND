import api from "./api";
import type { DocumentIngestResult } from "@/types/api";

// Sube y reenvía documentos al servicio RAG para indexarlos en un proyecto. Solo admin.
export async function ingestDocuments(projectId: string, files: File[]): Promise<DocumentIngestResult> {
  const formData = new FormData();
  formData.append("project_id", projectId);
  files.forEach((file) => formData.append("files", file));

  // Sin Content-Type explícito: el navegador le agrega el boundary del
  // multipart automáticamente. Ponerlo a mano aquí rompería el parseo en el backend.
  const response = await api.post<DocumentIngestResult>("/api/v1/documents/ingest", formData, {
    timeout: 120000,
  });
  return response.data;
}
