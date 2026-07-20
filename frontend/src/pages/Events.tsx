import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import BottomNav from "../components/BottomNav";

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  startsAt: string;
  externalUrl: string | null;
  myStatus: "GOING" | "INTERESTED" | null;
};

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    apiFetch("/api/events").then(setEvents).catch(console.error);
  }, []);

  async function setStatus(id: string, status: "GOING" | "INTERESTED") {
    await apiFetch(`/api/events/${id}/interest`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    setEvents((evs) => evs.map((e) => (e.id === id ? { ...e, myStatus: status } : e)));
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-10 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-6">Мероприятия</h1>

      <div className="flex flex-col gap-3">
        {events.map((e) => (
          <div key={e.id} className="bg-panel rounded-card border border-white/10 p-4">
            <p className="font-display text-base">{e.title}</p>
            <p className="text-text-muted text-xs font-mono mt-0.5">
              {new Date(e.startsAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
              {e.venue ? ` · ${e.venue}` : ""}
            </p>
            {e.description && <p className="text-sm mt-2">{e.description}</p>}

            <div className="flex gap-2 mt-3">
              <button
                className={`chip ${e.myStatus === "INTERESTED" ? "chip-on" : ""}`}
                onClick={() => setStatus(e.id, "INTERESTED")}
              >
                Интересно
              </button>
              <button
                className={`chip ${e.myStatus === "GOING" ? "chip-on" : ""}`}
                onClick={() => setStatus(e.id, "GOING")}
              >
                Иду
              </button>
              {e.externalUrl && (
                <a
                  href={e.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="chip ml-auto"
                >
                  Билеты ↗
                </a>
              )}
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <p className="text-text-muted text-sm">В вашем городе пока нет мероприятий в базе.</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
