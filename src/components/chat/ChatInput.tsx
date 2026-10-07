"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (question: string) => void;
  disabled?: boolean;
}

// Caja para escribir la pregunta: Enter envía, Shift+Enter hace salto de línea
export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");

  function send() {
    const question = value.trim();
    if (!question || disabled) return;
    onSend(question);
    setValue("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border bg-card p-4">
      <label htmlFor="chat-question" className="sr-only">
        Escribe tu pregunta
      </label>
      <textarea
        id="chat-question"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={2}
        placeholder="Escribe tu pregunta… (Enter para enviar, Shift+Enter para nueva línea)"
        className="flex-1 resize-none rounded border border-border bg-secondary px-3 py-2 text-[13px] text-foreground placeholder-muted-foreground transition-colors focus:border-primary/60 focus:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="h-3.5 w-3.5" />
        {disabled ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}
