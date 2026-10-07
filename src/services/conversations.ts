import api from "./api";
import type { Conversation, Message } from "@/types/api";

// Lista las conversaciones guardadas del usuario
export async function getConversations(): Promise<Conversation[]> {
  const response = await api.get<Conversation[]>("/api/v1/conversations");
  return response.data;
}

// Carga los mensajes (preguntas y respuestas) de una conversación guardada
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const response = await api.get<Message[]>(`/api/v1/conversations/${conversationId}/messages`);
  return response.data;
}
