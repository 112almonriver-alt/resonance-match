/**
 * Считает косинусное сходство между двумя взвешенными векторами
 * (например, genreWeights двух пользователей).
 */
function cosineSimilarity(weightsA, weightsB) {
  const keys = new Set([...Object.keys(weightsA), ...Object.keys(weightsB)]);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const key of keys) {
    const a = weightsA[key] ?? 0;
    const b = weightsB[key] ?? 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Коэффициент Жаккара — доля общих ключей относительно объединения множеств.
 * Хорошо показывает "сколько всего общего", в отличие от косинуса,
 * который больше про схожесть распределения весов.
 */
function jaccardSimilarity(weightsA, weightsB) {
  const keysA = new Set(Object.keys(weightsA));
  const keysB = new Set(Object.keys(weightsB));
  const intersection = [...keysA].filter((k) => keysB.has(k));
  const union = new Set([...keysA, ...keysB]);

  if (union.size === 0) return 0;
  return intersection.length / union.size;
}

/**
 * Итоговый скор совместимости двух музыкальных профилей.
 * Веса метрик — отправная точка для MVP, требуют калибровки на реальных данных
 * (см. "Открытые вопросы" в ТЗ).
 *
 * @param {ReturnType<typeof import('./buildProfile.js').buildMusicProfile>} profileA
 * @param {ReturnType<typeof import('./buildProfile.js').buildMusicProfile>} profileB
 */
export function calculateCompatibility(profileA, profileB) {
  const genreCosine = cosineSimilarity(profileA.genreWeights, profileB.genreWeights);
  const genreJaccard = jaccardSimilarity(profileA.genreWeights, profileB.genreWeights);
  const artistJaccard = jaccardSimilarity(profileA.artistWeights, profileB.artistWeights);

  const sharedGenres = Object.keys(profileA.genreWeights).filter((g) =>
    g in profileB.genreWeights
  );
  const sharedArtists = Object.keys(profileA.artistWeights).filter((a) =>
    a in profileB.artistWeights
  );

  const score =
    genreCosine * 0.5 + genreJaccard * 0.25 + artistJaccard * 0.25;

  return {
    score: Math.round(score * 100), // в процентах, для UI
    breakdown: { genreCosine, genreJaccard, artistJaccard },
    sharedGenres,
    sharedArtists,
  };
}
