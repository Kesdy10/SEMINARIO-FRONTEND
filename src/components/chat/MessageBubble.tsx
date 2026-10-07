import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

// Una burbuja: cian a la derecha para el usuario, tarjeta oscura a la izquierda para el asistente
export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded px-4 py-3 text-[13px] ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-foreground"
        }`}
      >
        <p
          className={`mb-1 font-mono text-[11px] uppercase tracking-wider ${
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {isUser ? "Tú" : "Asistente"}
        </p>
        {message.content}

        {!isUser && (message.provider || message.responseTimeMs != null) && (
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            {message.provider ?? "—"}
            {message.model ? ` · ${message.model}` : ""}
            {message.responseTimeMs != null ? ` · ${Math.round(message.responseTimeMs)} ms` : ""}
          </p>
        )}

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 space-y-1 border-t border-border pt-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Fuentes · {message.sources.length}
            </p>
            {message.sources.map((source, i) => {
              const file = source.document ?? source.file_path ?? source.source ?? "—";
              const pct = source.score != null ? Math.round(source.score * 100) : null;
              return (
                <div key={i} className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                  <span className="truncate text-foreground/80">{file}</span>
                  {source.branch && <span className="text-primary">{source.branch}</span>}
                  {source.line_start != null && (
                    <span>
                      L{source.line_start}
                      {source.line_end != null ? `–${source.line_end}` : ""}
                    </span>
                  )}
                  {pct != null && <span className="ml-auto text-emerald-400">{pct}%</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
