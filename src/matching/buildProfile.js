/**
 * Строит музыкальный профиль пользователя из списка треков:
 * взвешенные векторы жанров и артистов на основе частоты встречаемости.
 *
 * @param {Array<{title: string, artist: string, genres: string[]}>} tracks
 * @returns {{genreWeights: Record<string, number>, artistWeights: Record<string, number>, trackCount: number}}
 */
export function buildMusicProfile(tracks) {
  const genreCounts = {};
  const artistCounts = {};

  for (const track of tracks) {
    for (const genre of track.genres ?? []) {
      genreCounts[genre] = (genreCounts[genre] ?? 0) + 1;
    }
    if (track.artist) {
      artistCounts[track.artist] = (artistCounts[track.artist] ?? 0) + 1;
    }
  }

  return {
    genreWeights: normalize(genreCounts),
    artistWeights: normalize(artistCounts),
    trackCount: tracks.length,
  };
}

/** Нормализует счётчики в веса от 0 до 1 (доля от максимального значения) */
function normalize(counts) {
  const max = Math.max(1, ...Object.values(counts));
  const result = {};
  for (const [key, count] of Object.entries(counts)) {
    result[key] = count / max;
  }
  return result;
}
