import { getPool } from "./pool.js";

/**
 * Находит кандидатов для текущего пользователя: с заполненным музыкальным профилем,
 * не самого себя, не тех, кого уже лайкнул. Фильтры по городу и возрасту — опциональны.
 */
export async function findCandidates(userId, { city, minAge, maxAge, excludeIds = [] } = {}) {
  const pool = getPool();
  const conditions = [`id != $1`, `music_profile IS NOT NULL`];
  const params = [userId];

  if (city) {
    params.push(city);
    conditions.push(`city ILIKE $${params.length}`);
  }
  if (minAge) {
    params.push(minAge);
    conditions.push(`age >= $${params.length}`);
  }
  if (maxAge) {
    params.push(maxAge);
    conditions.push(`age <= $${params.length}`);
  }
  if (excludeIds.length > 0) {
    params.push(excludeIds);
    conditions.push(`id != ALL($${params.length})`);
  }

  const { rows } = await pool.query(
    `SELECT id, name, age, city, bio, music_profile
     FROM users
     WHERE ${conditions.join(" AND ")}`,
    params
  );
  return rows;
}
