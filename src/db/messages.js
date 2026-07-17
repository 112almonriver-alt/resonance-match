import { getPool } from "./pool.js";

export async function createMessage(matchId, senderId, content) {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO messages (match_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, match_id, sender_id, content, created_at`,
    [matchId, senderId, content]
  );
  return rows[0];
}

export async function findMessagesForMatch(matchId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, sender_id, content, created_at FROM messages
     WHERE match_id = $1 ORDER BY created_at ASC`,
    [matchId]
  );
  return rows;
}
