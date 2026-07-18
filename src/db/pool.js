import pg from "pg";

const { Pool } = pg;

let pool = null;

/** Ленивая инициализация пула — чтобы сервер стартовал, даже если DATABASE_URL ещё не задан */
export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL не задан. Укажите его в .env (см. .env.example) и накатите db/schema.sql"
      );
    }

    // Многие управляемые БД (включая Timeweb Cloud) используют сертификат
    // от внутреннего центра сертификации, которому Node.js не доверяет по
    // умолчанию. Соединение всё равно шифруется (sslmode=require) — мы просто
    // не проверяем цепочку сертификата, как и делает большинство приложений
    // при подключении к таким провайдерам.
    const needsSsl = /sslmode=(require|verify-ca|verify-full)/.test(connectionString);

    pool = new Pool({
      connectionString,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}
