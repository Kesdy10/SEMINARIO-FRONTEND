"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

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
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-gray-200 bg-white p-4">
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
        className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {disabled ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}