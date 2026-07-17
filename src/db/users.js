import { getPool } from "./pool.js";

export async function createUser({ email, passwordHash, name, age }) {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, name, age)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, age, city, bio, created_at`,
    [email, passwordHash, name, age ?? null]
  );
  return rows[0];
}

export async function findUserByEmail(email) {
  const pool = getPool();
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return rows[0] ?? null;
}

export async function findUserById(id) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, email, name, age, city, bio, music_profile, created_at FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function saveMusicProfile(userId, musicProfile) {
  const pool = getPool();
  await pool.query(`UPDATE users SET music_profile = $1 WHERE id = $2`, [
    JSON.stringify(musicProfile),
    userId,
  ]);
}
