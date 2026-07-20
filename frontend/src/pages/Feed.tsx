import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import BottomNav from "../components/BottomNav";

type Candidate = {
  id: string;
  name: string;
  city: string;
  bio: string | null;
  photoUrl: string | null;
  score: number;
};

export default function Feed() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [index, setIndex] = useState(0);
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/matches/feed")
      .then(setCandidates)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const current = candidates[index];

  async function swipe(status: "LIKE" | "PASS") {
    if (!current) return;
    try {
      const res = await apiFetch("/api/matches/swipe", {
        method: "POST",
        body: JSON.stringify({ toUserId: current.id, status }),
      });
      if (res.matched) setMatchedName(current.name);
    } catch (err) {
      console.error(err);
    }
    setIndex((i) => i + 1);
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-10 max-w-md mx-auto flex flex-col">
      <h1 className="font-display text-2xl font-semibold mb-6">Лента</h1>

      {loading && <p className="text-text-muted text-sm">Загружаем…</p>}
      {error && <p className="text-accent-2 text-sm">{error}</p>}

      {matchedName && (
        <div className="fixed inset-0 bg-bg/95 flex flex-col items-center justify-center z-50 px-6">
          <div className="w-24 h-24 rounded-full border-2 border-accent flex items-center justify-center font-display text-2xl mb-4">
            ✓
          </div>
          <p className="font-display text-xl mb-2">Совпадение с {matchedName}!</p>
          <button className="btn-primary w-full mt-4" onClick={() => setMatchedName(null)}>
            Продолжить
          </button>
        </div>
      )}

      {!loading && !current && (
        <p className="text-text-muted text-sm">
          Пока новых людей нет — загляните позже, или заполните профиль подробнее.
        </p>
      )}

      {current && (
        <div className="bg-panel rounded-card overflow-hidden border border-white/10">
          <div className="h-64 bg-white/5 flex items-center justify-center text-text-muted text-sm relative">
            {current.photoUrl ? (
              <img src={current.photoUrl} alt={current.name} className="w-full h-full object-cover" />
            ) : (
              "фото"
            )}
            <span className="absolute top-3 right-3 bg-accent text-bg font-mono text-sm px-2.5 py-1 rounded-full">
              {current.score}%
            </span>
          </div>
          <div className="p-4">
            <p className="font-display text-lg">{current.name}</p>
            <p className="text-text-muted text-sm">{current.city}</p>
            {current.bio && <p className="text-sm mt-2">{current.bio}</p>}
          </div>
        </div>
      )}

      {current && (
        <div className="flex gap-3 mt-6">
          <button className="btn-secondary flex-1" onClick={() => swipe("PASS")}>
            Пропустить
          </button>
          <button className="btn-primary flex-1" onClick={() => swipe("LIKE")}>
            Нравится
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
