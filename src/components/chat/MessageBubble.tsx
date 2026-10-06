import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

// Una burbuja: azul a la derecha para el usuario, blanca a la izquierda para el asistente
export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "rounded-br-sm bg-blue-600 text-white"
            : "rounded-bl-sm border border-gray-200 bg-white text-gray-900"
        }`}
      >
        <p className={`mb-1 text-xs font-medium ${isUser ? "text-blue-100" : "text-gray-500"}`}>
          {isUser ? "Tú" : "Asistente"}
        </p>
        {message.content}
      </div>
    </div>
  );
}