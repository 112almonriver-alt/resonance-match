import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useOnboarding } from "../context/OnboardingContext";

type Artist = { id: string; name: string };

export default function OnboardingArtists() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Artist[]>([]);
  const [selected, setSelected] = useState<Artist[]>([]);
  const { data, setArtistIds } = useOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    const handle = setTimeout(() => {
      apiFetch(`/api/profile/artists?q=${encodeURIComponent(query)}`)
        .then(setResults)
        .catch(console.error);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  function add(artist: Artist) {
    if (selected.find((a) => a.id === artist.id) || selected.length >= 15) return;
    const next = [...selected, artist];
    setSelected(next);
    setArtistIds(next.map((a) => a.id));
  }

  function remove(id: string) {
    const next = selected.filter((a) => a.id !== id);
    setSelected(next);
    setArtistIds(next.map((a) => a.id));
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-md mx-auto flex flex-col">
      <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Шаг 2 из 3</p>
      <h1 className="font-display text-2xl font-semibold mb-1">Любимые артисты</h1>
      <p className="text-text-muted text-sm mb-6">Добавь от 8 до 15 артистов</p>

      <input
        className="input mb-3"
        placeholder="Поиск артиста…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex flex-col gap-1.5 mb-4 max-h-40 overflow-y-auto">
        {results.map((a) => (
          <button
            key={a.id}
            onClick={() => add(a)}
            className="text-left px-3 py-2 rounded-lg bg-panel hover:bg-white/5 text-sm"
          >
            {a.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {selected.map((a) => (
          <span key={a.id} className="chip chip-on" onClick={() => remove(a.id)}>
            {a.name} ✕
          </span>
        ))}
      </div>

      <div className="flex-1" />
      <p className="text-text-muted text-xs font-mono mb-3 text-center">
        {selected.length}/15 добавлено
      </p>
      <button
        className="btn-primary disabled:opacity-40"
        disabled={data.genreIds.length < 1}
        onClick={() => navigate("/onboarding/sliders")}
      >
        Дальше
      </button>
    </div>
  );
}
