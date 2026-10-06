"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

// Lista de mensajes que baja sola al último mensaje
export default function MessageList({ messages, isLoading = false }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-500">
        Haz una pregunta sobre el proyecto para empezar.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && <p className="text-sm text-gray-500">El asistente está escribiendo…</p>}
      <div ref={endRef} />
    </div>
  );
}