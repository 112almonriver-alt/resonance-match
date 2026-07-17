import { getPool } from "./pool.js";

/** Создаёт мэтч между двумя пользователями (порядок id нормализуем, чтобы UNIQUE работал в обе стороны) */
export async function createMatch(userAId, userBId) {
  const pool = getPool();
  const [a, b] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
  const { rows } = await pool.query(
    `INSERT INTO matches (user_a_id, user_b_id) VALUES ($1, $2)
     ON CONFLICT (user_a_id, user_b_id) DO UPDATE SET user_a_id = EXCLUDED.user_a_id
     RETURNING id, user_a_id, user_b_id, created_at`,
    [a, b]
  );
  return rows[0];
}

/** Список мэтчей текущего пользователя с базовой информацией о собеседнике */
export async function findMatchesForUser(userId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT m.id, m.created_at,
            u.id AS other_user_id, u.name AS other_name, u.age AS other_age
     FROM matches m
     JOIN users u ON u.id = (CASE WHEN m.user_a_id = $1 THEN m.user_b_id ELSE m.user_a_id END)
     WHERE m.user_a_id = $1 OR m.user_b_id = $1
     ORDER BY m.created_at DESC`,
    [userId]
  );
  return rows;
}

/** Возвращает мэтч, только если userId — один из его участников (проверка доступа) */
export async function findMatchForUser(matchId, userId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM matches WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)`,
    [matchId, userId]
  );
  return rows[0] ?? null;
}
