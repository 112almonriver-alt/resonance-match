import { getPool } from "./pool.js";

// Кэш считается свежим 24 часа — потом список треков перезапросим у провайдера заново
// (плейлист мог обновиться, плюс не хотим хранить бесконечно устаревшие данные)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Возвращает закэшированные треки, если запись есть и не устарела. Иначе — null.
 */
export async function getCachedTracks(provider, playlistUrl) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT tracks, fetched_at FROM playlist_cache WHERE provider = $1 AND playlist_url = $2`,
    [provider, playlistUrl]
  );

  if (rows.length === 0) return null;

  const { tracks, fetched_at } = rows[0];
  const isFresh = Date.now() - new Date(fetched_at).getTime() < CACHE_TTL_MS;
  return isFresh ? tracks : null;
}

/**
 * Сохраняет (или обновляет) список треков для данной ссылки на плейлист.
 */
export async function saveTracksToCache(provider, playlistUrl, tracks) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO playlist_cache (provider, playlist_url, tracks, fetched_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (provider, playlist_url)
     DO UPDATE SET tracks = EXCLUDED.tracks, fetched_at = now()`,
    [provider, playlistUrl, JSON.stringify(tracks)]
  );
}
