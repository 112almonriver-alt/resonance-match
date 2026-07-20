import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import BottomNav from "../components/BottomNav";

type MatchListItem = {
  matchId: string;
  score: number;
  otherUser: { id: string; name: string; photoUrl: string | null };
};

export default function Matches() {
  const [matches, setMatches] = useState<MatchListItem[]>([]);

  useEffect(() => {
    apiFetch("/api/matches").then(setMatches).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen pb-24 px-6 pt-10 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-6">Мэтчи</h1>

      {matches.length === 0 && (
        <p className="text-text-muted text-sm">Пока нет мэтчей — свайпайте в ленте.</p>
      )}

      <div className="flex flex-col gap-2">
        {matches.map((m) => (
          <Link
            key={m.matchId}
            to={`/chat/${m.matchId}`}
            className="flex items-center gap-3 bg-panel rounded-lg p-3 border border-white/10"
          >
            <div className="w-11 h-11 rounded-full bg-white/10 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm">{m.otherUser.name}</p>
            </div>
            <span className="font-mono text-xs text-accent">{m.score}%</span>
          </Link>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
