import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useOnboarding } from "../context/OnboardingContext";

function Slider({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-7">
      <p className="text-sm mb-2">{label}</p>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      <div className="flex justify-between text-xs text-text-muted font-mono">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export default function OnboardingSliders() {
  const { data, setSliders } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          genreIds: data.genreIds,
          artistIds: data.artistIds,
          energy: data.energy,
          mainstream: data.mainstream,
          era: data.era,
        }),
      });
      navigate("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-md mx-auto flex flex-col">
      <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Шаг 3 из 3</p>
      <h1 className="font-display text-2xl font-semibold mb-6">Твой вкус тоньше жанров</h1>

      <Slider
        label="Энергия"
        leftLabel="тихие вечера"
        rightLabel="клубная энергия"
        value={data.energy}
        onChange={(v) => setSliders({ energy: v })}
      />
      <Slider
        label="Направление"
        leftLabel="андеграунд"
        rightLabel="мейнстрим"
        value={data.mainstream}
        onChange={(v) => setSliders({ mainstream: v })}
      />
      <Slider
        label="Эпоха"
        leftLabel="классика"
        rightLabel="новое"
        value={data.era}
        onChange={(v) => setSliders({ era: v })}
      />

      {error && <p className="text-accent-2 text-sm mb-3">{error}</p>}

      <div className="flex-1" />
      <button className="btn-primary disabled:opacity-40" disabled={saving} onClick={finish}>
        {saving ? "Сохраняем…" : "Готово"}
      </button>
    </div>
  );
}
