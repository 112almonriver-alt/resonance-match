// Алгоритм подсчёта % совпадения между двумя музыкальными профилями.
// Формула (см. обсуждение продукта): жанры 40%, артисты 35%, слайдеры 25%.

type ProfileForMatching = {
  energy: number;
  mainstream: number;
  era: number;
  genres: { genreId: string; rank: number }[];
  artists: { artistId: string }[];
};

// Пересечение жанров с учётом ранга: чем выше оба жанра в списках, тем больше вес.
// rank 1 (самый важный) даёт вес 5, rank 5 — вес 1.
function genreScore(a: ProfileForMatching["genres"], b: ProfileForMatching["genres"]): number {
  const weightOf = (rank: number) => Math.max(6 - rank, 1);
  const mapB = new Map(b.map((g) => [g.genreId, g]));

  let overlap = 0;
  let maxPossible = 0;

  for (const genreA of a) {
    const wA = weightOf(genreA.rank);
    maxPossible += wA;
    const genreB = mapB.get(genreA.genreId);
    if (genreB) {
      const wB = weightOf(genreB.rank);
      overlap += Math.min(wA, wB);
    }
  }

  if (maxPossible === 0) return 0;
  return overlap / maxPossible;
}

// Простое пересечение множеств артистов (коэффициент Жаккара).
function artistScore(a: ProfileForMatching["artists"], b: ProfileForMatching["artists"]): number {
  const setA = new Set(a.map((x) => x.artistId));
  const setB = new Set(b.map((x) => x.artistId));
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const id of setA) if (setB.has(id)) intersection++;

  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

// Близость по слайдерам: чем меньше евклидово расстояние, тем выше похожесть.
function sliderScore(a: ProfileForMatching, b: ProfileForMatching): number {
  const maxDistPerAxis = 100;
  const dist = Math.sqrt(
    Math.pow(a.energy - b.energy, 2) +
      Math.pow(a.mainstream - b.mainstream, 2) +
      Math.pow(a.era - b.era, 2)
  );
  const maxDist = Math.sqrt(3 * Math.pow(maxDistPerAxis, 2));
  return 1 - dist / maxDist;
}

// Возвращает совпадение в процентах (0-100).
export function computeMatchScore(a: ProfileForMatching, b: ProfileForMatching): number {
  const g = genreScore(a.genres, b.genres);
  const ar = artistScore(a.artists, b.artists);
  const sl = sliderScore(a, b);

  const total = g * 0.4 + ar * 0.35 + sl * 0.25;
  return Math.round(total * 100);
}
