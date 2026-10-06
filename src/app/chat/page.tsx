"use client";

import { useState } from "react";
import axios from "axios";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";
import { query } from "@/services/chat";
import { mockRespuestas } from "@/mocks/queryResponses";
import type { QueryResponse } from "@/types/api";
import type { ChatMessage } from "@/types/chat";

// Proyecto de prueba indexado por el equipo RAG (se configura en .env.local)
const PROJECTS = [
  { id: process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID ?? "", name: "Proyecto de prueba (RAG)" },
];

// Lista fija por ahora; después vendrá del backend
const BRANCHES = ["main", "develop"];

// Con NEXT_PUBLIC_USE_MOCKS=true el chat responde con datos de prueba, sin llamar al backend
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function askMock(question: string): Promise<QueryResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const mock = mockRespuestas[Math.floor(Math.random() * mockRespuestas.length)];
  return { ...mock, question };
}

export default function ChatPage() {
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleBranch(branch: string) {
    setSelectedBranches((current) =>
      current.includes(branch) ? current.filter((b) => b !== branch) : [...current, branch]
    );
  }

  async function handleSend(question: string) {
    setError(null);

    if (!USE_MOCKS && !projectId) {
      setError("Falta configurar el proyecto (NEXT_PUBLIC_DEFAULT_PROJECT_ID en .env.local).");
      return;
    }

    setMessages((current) => [...current, { id: createId(), role: "user", content: question }]);
    setIsLoading(true);

    try {
      const response = USE_MOCKS
        ? await askMock(question)
        : await query({
            project_id: projectId,
            question,
            branches: selectedBranches,
            conversation_id: conversationId,
          });

      setConversationId(response.conversation_id);
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: response.answer,
          sources: response.sources,
          responseTimeMs: response.response_time_ms,
          provider: response.provider,
          model: response.model,
        },
      ]);
    } catch (err) {
      if (axios.isAxiosError(err) && err.code === "ECONNABORTED") {
        setError("La respuesta tardó demasiado. Intenta de nuevo.");
      } else if (axios.isAxiosError(err) && !err.response) {
        setError("No se pudo conectar con el servidor.");
      } else {
        setError("Ocurrió un error al consultar. Intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex h-screen flex-col bg-gray-50">
      <header className="flex flex-wrap items-center gap-4 border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Consultas</h1>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          Proyecto
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-gray-900"
          >
            {PROJECTS.map((project) => (
              <option key={project.name} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="flex items-center gap-3 text-sm text-gray-700">
          <legend className="sr-only">Ramas a consultar</legend>
          <span>Ramas:</span>
          {BRANCHES.map((branch) => (
            <label key={branch} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={selectedBranches.includes(branch)}
                onChange={() => toggleBranch(branch)}
              />
              {branch}
            </label>
          ))}
          <span className="text-xs text-gray-500">(ninguna = todas)</span>
        </fieldset>

        {USE_MOCKS && (
          <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
            Modo prueba (mocks)
          </span>
        )}
      </header>

      <MessageList messages={messages} isLoading={isLoading} />

      {error && <p className="px-4 pb-2 text-sm text-red-600">{error}</p>}

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </main>
  );
}