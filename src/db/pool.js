import pg from "pg";

const { Pool } = pg;

let pool = null;

/** Ленивая инициализация пула — чтобы сервер стартовал, даже если DATABASE_URL ещё не задан */
export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL не задан. Укажите его в .env (см. .env.example) и накатите db/schema.sql"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}
