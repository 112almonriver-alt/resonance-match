import pg from "pg";

const { Pool } = pg;

let pool = null;

/**
 * Убирает параметры sslmode/ssl из строки подключения. У библиотеки pg есть
 * готча: если такие параметры остаются в connectionString, она может сама
 * распарсить их в SSL-настройки и это способно конфликтовать с тем, что мы
 * задаём явно ниже — поэтому SSL настраиваем только через отдельный объект.
 */
function stripSslParams(connectionString) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("ssl");
    return url.toString();
  } catch {
    return connectionString;
  }
}

/** Ленивая инициализация пула — чтобы сервер стартовал, даже если DATABASE_URL ещё не задан */
export function getPool() {
  if (!pool) {
    const rawConnectionString = process.env.DATABASE_URL;
    if (!rawConnectionString) {
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
      const { hostname } = new URL(rawConnectionString);
      isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
    } catch {
      // если URL не распарсился — считаем, что это не локальный хост
    }

    pool = new Pool({
      connectionString: stripSslParams(rawConnectionString),
      ssl: isLocalHost ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}
