"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Clock, GitBranch, MessageSquare, Plus } from "lucide-react";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";
import { query } from "@/services/chat";
import { getConversations, getConversationMessages } from "@/services/conversations";
import { mockRespuestas } from "@/mocks/queryResponses";
import type { Conversation, QueryResponse } from "@/types/api";
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

  // Historial de conversaciones guardadas (GET /conversations)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingConvId, setLoadingConvId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getConversations()
      .then((data) => {
        if (active) setConversations(data);
      })
      .catch(() => {
        if (active) setHistoryError("No se pudo cargar el historial.");
      });
    return () => {
      active = false;
    };
  }, []);

  function toggleBranch(branch: string) {
    setSelectedBranches((current) =>
      current.includes(branch) ? current.filter((b) => b !== branch) : [...current, branch]
    );
  }

  // Reinicia el chat: borra los mensajes en pantalla y el conversation_id,
  // para que la siguiente pregunta empiece una conversacion nueva en el backend.
  function handleNewConversation() {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }

  // Carga los mensajes de una conversación guardada y continúa desde ahí
  async function openConversation(conv: Conversation) {
    setLoadingConvId(conv.conversation_id);
    setError(null);
    try {
      const msgs = await getConversationMessages(conv.conversation_id);
      const asChatMessages: ChatMessage[] = msgs.flatMap((m) => [
        { id: createId(), role: "user", content: m.question } as ChatMessage,
        { id: createId(), role: "assistant", content: m.answer, sources: m.sources } as ChatMessage,
      ]);
      setMessages(asChatMessages);
      setConversationId(conv.conversation_id);
      if (conv.project_id) setProjectId(conv.project_id);
    } catch {
      setError("No se pudieron cargar los mensajes de esa conversación.");
    } finally {
      setLoadingConvId(null);
    }
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

      // La conversación recién usada sube al tope del historial una vez recargado
      if (!USE_MOCKS) {
        getConversations()
          .then(setConversations)
          .catch(() => {});
      }
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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar de historial */}
      <aside
        className={`flex-shrink-0 overflow-hidden border-r border-border bg-card transition-all duration-200 ${
          sidebarOpen ? "w-60" : "w-0 border-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Conversaciones
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {conversations?.length ?? "…"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {historyError && (
            <p className="px-1 py-2 font-mono text-[11px] text-muted-foreground">{historyError}</p>
          )}
          {!historyError && conversations === null && (
            <p className="px-1 py-2 font-mono text-[11px] text-muted-foreground">Cargando…</p>
          )}
          {conversations && conversations.length === 0 && (
            <p className="px-1 py-2 font-mono text-[11px] text-muted-foreground">
              Todavía no hay conversaciones guardadas.
            </p>
          )}
          {conversations?.map((conv) => (
            <button
              key={conv.conversation_id}
              onClick={() => openConversation(conv)}
              disabled={loadingConvId === conv.conversation_id}
              className={`w-full rounded px-2.5 py-2 text-left transition-colors hover:bg-secondary ${
                conv.conversation_id === conversationId ? "bg-secondary" : ""
              }`}
            >
              <div className="truncate font-mono text-[11px] text-foreground">
                {conv.conversation_id}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                {new Date(conv.updated_at).toLocaleString("es-GT")}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat principal */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2.5">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-muted-foreground transition-colors hover:text-foreground"
            title="Historial"
          >
            <Clock className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h1 className="text-[13px] font-medium text-foreground">Consultas</h1>
          </div>

          <div className="h-4 w-px bg-border" />

          <label className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
            Proyecto
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded border border-border bg-secondary px-2 py-1 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
            >
              {PROJECTS.map((project) => (
                <option key={project.name} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
            <legend className="sr-only">Ramas a consultar</legend>
            <GitBranch className="h-3 w-3" />
            {BRANCHES.map((branch) => {
              const active = selectedBranches.includes(branch);
              return (
                <button
                  key={branch}
                  type="button"
                  onClick={() => toggleBranch(branch)}
                  className={`rounded border px-2 py-0.5 text-[11px] transition-colors ${
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {branch}
                </button>
              );
            })}
            <span className="text-[10px]">(ninguna = todas)</span>
          </fieldset>

          {USE_MOCKS && (
            <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-400">
              Modo prueba (mocks)
            </span>
          )}

          <button
            type="button"
            onClick={handleNewConversation}
            disabled={messages.length === 0}
            className="ml-auto flex items-center gap-1.5 rounded border border-border bg-secondary px-3 py-1.5 font-mono text-[11px] text-foreground transition-colors hover:border-primary/40 disabled:opacity-40"
          >
            <Plus className="h-3 w-3" /> Nueva conversación
          </button>
        </header>

        <MessageList messages={messages} isLoading={isLoading} />

        {error && (
          <p className="border-t border-red-500/20 bg-red-500/5 px-4 py-2 text-[12px] text-red-400">
            {error}
          </p>
        )}

        <ChatInput onSend={handleSend} disabled={isLoading} />
      </main>
    </div>
  );
}
