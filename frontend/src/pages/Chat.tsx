import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

type Message = { id: string; senderId: string; text: string; createdAt: string };

export default function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId) return;
    const load = () => apiFetch(`/api/chat/${matchId}/messages`).then(setMessages).catch(console.error);
    load();
    // Простой polling каждые 3 секунды — достаточно для MVP.
    // Вебсокеты — логичный апгрейд, когда чат станет активнее использоваться.
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim() || !matchId) return;
    const message = await apiFetch(`/api/chat/${matchId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    setMessages((m) => [...m, message]);
    setText("");
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-4 flex flex-col gap-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
              m.senderId === user?.id
                ? "self-end bg-accent text-bg"
                : "self-start bg-panel border border-white/10"
            }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 p-4 border-t border-white/10">
        <input
          className="input flex-1"
          placeholder="Написать сообщение…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn-primary px-4" onClick={send}>
          →
        </button>
      </div>
    </div>
  );
}
