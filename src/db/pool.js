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

    // Локальный Postgres (для разработки) обычно вообще без TLS — SSL не включаем.
    // Любой внешний хост (Timeweb и почти все управляемые БД) — включаем TLS, но
    // не проверяем цепочку сертификата: у таких провайдеров сертификат обычно
    // от внутреннего центра сертификации, которому Node.js не доверяет по
    // умолчанию, хотя само соединение всё равно шифруется.
    let isLocalHost = false;
    try {
      const { hostname } = new URL(connectionString);
      isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
    } catch {
      // если URL не распарсился — считаем, что это не локальный хост
    }

    pool = new Pool({
      connectionString,
      ssl: isLocalHost ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}
