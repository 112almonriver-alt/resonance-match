import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useOnboarding } from "../context/OnboardingContext";

type Genre = { id: string; name: string };

export default function OnboardingGenres() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const { data, setGenreIds } = useOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/profile/genres").then(setGenres).catch(console.error);
  }, []);

  function toggle(id: string) {
    const current = data.genreIds;
    if (current.includes(id)) {
      setGenreIds(current.filter((g) => g !== id));
    } else if (current.length < 5) {
      setGenreIds([...current, id]);
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-md mx-auto flex flex-col">
      <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Шаг 1 из 3</p>
      <h1 className="font-display text-2xl font-semibold mb-1">Выбери жанры</h1>
      <p className="text-text-muted text-sm mb-6">
        Выбери до 5 жанров в порядке важности — первый нажатый станет самым важным
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {genres.map((g) => {
          const rank = data.genreIds.indexOf(g.id);
          return (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              className={`chip ${rank >= 0 ? "chip-on" : ""}`}
            >
              {rank >= 0 && <span className="font-mono text-xs mr-1.5">{rank + 1}</span>}
              {g.name}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />
      <p className="text-text-muted text-xs font-mono mb-3 text-center">
        {data.genreIds.length}/5 выбрано
      </p>
      <button
        className="btn-primary disabled:opacity-40"
        disabled={data.genreIds.length < 1}
        onClick={() => navigate("/onboarding/artists")}
      >
        Дальше
      </button>
    </div>
  );
}
