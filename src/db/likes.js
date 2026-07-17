import { getPool } from "./pool.js";

/** Создаёт лайк; если такой уже есть — тихо игнорирует (ON CONFLICT DO NOTHING) */
export async function createLike(fromUserId, toUserId) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO likes (from_user_id, to_user_id) VALUES ($1, $2)
     ON CONFLICT (from_user_id, to_user_id) DO NOTHING`,
    [fromUserId, toUserId]
  );
}

/** Проверяет, лайкнул ли toUserId в ответ fromUserId (то есть встречный лайк) */
export async function hasReciprocalLike(fromUserId, toUserId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT 1 FROM likes WHERE from_user_id = $1 AND to_user_id = $2`,
    [toUserId, fromUserId]
  );
  return rows.length > 0;
}

/** ID всех пользователей, которых currentUserId уже лайкнул — чтобы не показывать их снова в кандидатах */
export async function getLikedUserIds(currentUserId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT to_user_id FROM likes WHERE from_user_id = $1`,
    [currentUserId]
  );
  return rows.map((r) => r.to_user_id);
}
