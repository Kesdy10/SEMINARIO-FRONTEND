import api from "./api";

// Forma defensiva: el backend puede nombrar los campos distinto;
// se muestran los que existan y se ignoran los que no.
export interface LoginHistoryEntry {
  timestamp?: string;
  created_at?: string;
  ip_address?: string;
  ip?: string;
  user_agent?: string;
  success?: boolean;
  [key: string]: unknown;
}

// Consulta el historial de accesos del usuario (auditoría)
export async function getLoginHistory(): Promise<LoginHistoryEntry[]> {
  const response = await api.get<LoginHistoryEntry[]>("/api/v1/auth/login-history");
  return response.data;
}
