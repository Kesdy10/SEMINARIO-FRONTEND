"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Check, Copy, GitBranch, MessageSquare, Plus, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";
import { query } from "@/services/chat";
import { getConversations, getConversationMessages } from "@/services/conversations";
import { listProjects } from "@/services/projects";
import { mockRespuestas } from "@/mocks/queryResponses";
import type { Conversation, Project, QueryResponse } from "@/types/api";
import type { ChatMessage } from "@/types/chat";

// Con mocks activos no hace falta backend real: se simula un único proyecto.
const MOCK_PROJECTS: Project[] = [
  { project_id: "mock-project", name: "Proyecto de prueba (mocks)", created_by: "mock", created_at: new Date().toISOString() },
];
const BRANCHES = ["main", "develop"];
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const SUGGESTIONS = [
  "¿Dónde se implementa el inicio de sesión?",
  "¿Qué tablas contiene el proyecto?",
  "¿Qué diferencias hay entre main y develop?",
  "¿Qué función registra un nuevo usuario?",
];

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function askMock(question: string): Promise<QueryResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const mock = mockRespuestas[Math.floor(Math.random() * mockRespuestas.length)];
  return { ...mock, question };
}

// Agrupa conversaciones por Hoy / Ayer / Esta semana / Anteriores, como en el diseño
function groupByDate(convs: Conversation[]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const yday = new Date(now);
  yday.setDate(yday.getDate() - 1);
  const wk = new Date(now);
  wk.setDate(wk.getDate() - 7);

  const groups: Record<string, Conversation[]> = { Hoy: [], Ayer: [], "Esta semana": [], Anteriores: [] };
  convs.forEach((c) => {
    const d = new Date(c.updated_at);
    d.setHours(0, 0, 0, 0);
    if (d >= now) groups["Hoy"].push(c);
    else if (d >= yday) groups["Ayer"].push(c);
    else if (d >= wk) groups["Esta semana"].push(c);
    else groups["Anteriores"].push(c);
  });
  return Object.entries(groups).filter(([, v]) => v.length);
}

export default function ChatPage() {
  const [projectId, setProjectId] = useState("");
  // Con mocks, el catálogo es fijo y no depende del backend: se usa como estado
  // inicial directamente, sin pasar por un efecto.
  const [projects, setProjects] = useState<Project[] | null>(() => (USE_MOCKS ? MOCK_PROJECTS : null));
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingConvId, setLoadingConvId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

  // Catálogo real de proyectos (GET /api/v1/projects). Con mocks activos el
  // estado ya arrancó con MOCK_PROJECTS (arriba), así que este efecto no hace nada.
  useEffect(() => {
    if (USE_MOCKS) return;
    let active = true;
    listProjects()
      .then((data) => {
        if (active) setProjects(data);
      })
      .catch(() => {
        if (active) setProjectsError("No se pudo cargar el catálogo de proyectos.");
      });
    return () => {
      active = false;
    };
  }, []);

  // Si no se ha elegido proyecto a mano, se usa el primero del catálogo —
  // derivado en cada render, sin un efecto que tenga que sincronizarlo.
  const effectiveProjectId = projectId || projects?.[0]?.project_id || "";

  function toggleBranch(branch: string) {
    setSelectedBranches((current) =>
      current.includes(branch) ? current.filter((b) => b !== branch) : [...current, branch]
    );
  }

  function handleNewConversation() {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }

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

    if (!USE_MOCKS && !effectiveProjectId) {
      setError("Selecciona un proyecto para preguntar. Si el catálogo está vacío, pídele a un admin que cree uno en /admin/proyectos.");
      return;
    }

    setMessages((current) => [...current, { id: createId(), role: "user", content: question }]);
    setIsLoading(true);

    try {
      const response = USE_MOCKS
        ? await askMock(question)
        : await query({
            project_id: effectiveProjectId,
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

  function copyConvId() {
    if (!conversationId) return;
    navigator.clipboard.writeText(conversationId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const filteredConvs = useMemo(
    () => (conversations ?? []).filter((c) => c.conversation_id.toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  );
  const groups = useMemo(() => groupByDate(filteredConvs), [filteredConvs]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      {/* Panel de conversaciones */}
      <aside className="flex w-56 flex-shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar">
        <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-2.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Conversaciones
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">{conversations?.length ?? "…"}</span>
        </div>

        <div className="space-y-1.5 px-2 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="w-full rounded border border-border bg-secondary py-1.5 pl-7 pr-2 text-[11px] text-foreground placeholder-muted-foreground transition-colors focus:border-primary/50 focus:outline-none"
            />
          </div>
          <button
            onClick={handleNewConversation}
            className="flex w-full items-center gap-2 rounded border border-primary/20 bg-primary/10 px-2.5 py-1.5 font-mono text-[11px] text-primary transition-colors hover:bg-primary/20"
          >
            <Plus className="h-3 w-3" /> Nueva conversación
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-2 pb-3">
          {historyError && <p className="px-1 py-2 font-mono text-[11px] text-muted-foreground">{historyError}</p>}
          {!historyError && conversations === null && (
            <p className="px-1 py-2 font-mono text-[11px] text-muted-foreground">Cargando…</p>
          )}
          {groups.length === 0 && conversations !== null && !historyError && (
            <p className="px-1 py-2 font-mono text-[11px] text-muted-foreground">Sin conversaciones.</p>
          )}
          {groups.map(([label, items]) => (
            <div key={label}>
              <div className="mb-1 px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {label}
              </div>
              <div className="space-y-0.5">
                {items.map((conv) => {
                  const active = conv.conversation_id === conversationId;
                  return (
                    <button
                      key={conv.conversation_id}
                      onClick={() => openConversation(conv)}
                      disabled={loadingConvId === conv.conversation_id}
                      className={`w-full rounded px-2.5 py-2 text-left transition-colors ${
                        active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <div className="truncate font-mono text-[11px] text-foreground">{conv.conversation_id}</div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                        <GitBranch className="h-2.5 w-2.5" />
                        {new Date(conv.updated_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat principal */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-[13px] font-medium text-foreground">Consulta RAG</span>
          </div>

          {projects && projects.length > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <select
                value={effectiveProjectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="rounded border border-border bg-secondary px-2 py-1 font-mono text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </>
          )}
          {projects !== null && projects.length === 0 && !projectsError && (
            <span className="font-mono text-[11px] text-amber-400">Sin proyectos indexados todavía.</span>
          )}
          {projectsError && <span className="font-mono text-[11px] text-red-400">{projectsError}</span>}

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
          </fieldset>

          {conversationId && (
            <div className="flex items-center gap-1 rounded border border-border bg-secondary px-2 py-1">
              <span className="font-mono text-[10px] text-muted-foreground">conv:</span>
              <span className="font-mono text-[11px] text-primary">{conversationId}</span>
              <button onClick={copyConvId} className="text-muted-foreground transition-colors hover:text-foreground">
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {USE_MOCKS && (
              <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-400">
                Modo prueba (mocks)
              </span>
            )}
            {!USE_MOCKS && effectiveProjectId && (
              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400">
                indexado
              </span>
            )}
          </div>
        </header>

        {messages.length === 0 && !isLoading && (
          <div className="border-b border-border px-6 pt-4">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Consultas sugeridas
            </p>
            <div className="flex flex-wrap gap-2 pb-4">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded border border-border bg-secondary px-3 py-1.5 text-left text-[12px] text-foreground transition-colors hover:border-primary/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <MessageList messages={messages} isLoading={isLoading} />

        {error && (
          <p className="border-t border-red-500/20 bg-red-500/5 px-4 py-2 text-[12px] text-red-400">{error}</p>
        )}

        <ChatInput onSend={handleSend} disabled={isLoading} />
      </main>
    </div>
  );
}
