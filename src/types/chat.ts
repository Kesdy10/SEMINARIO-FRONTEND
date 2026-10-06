import type { Source } from "./api";

// Un mensaje tal como se muestra en la pantalla del chat
export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  sources?: Source[];
  responseTimeMs?: number | null;
  provider?: string | null;
  model?: string | null;
}