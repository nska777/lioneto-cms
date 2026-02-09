// config/database.ts
import path from "path";

export default ({ env }) => {
  // ✅ В проде по умолчанию postgres (а не sqlite)
  const client = env(
    "DATABASE_CLIENT",
    env("NODE_ENV") === "production" ? "postgres" : "sqlite",
  );

  // ✅ Диагностика: покажет, откуда реально берётся хост (DATABASE_* vs PG*)
  // Пароли не логируем
  console.log("[ENV CHECK]", {
    NODE_ENV: env("NODE_ENV"),
    DATABASE_CLIENT: env("DATABASE_CLIENT"),
    DATABASE_HOST: env("DATABASE_HOST"),
    DATABASE_PORT: env("DATABASE_PORT"),
    DATABASE_NAME: env("DATABASE_NAME"),
    DATABASE_USERNAME: env("DATABASE_USERNAME"),
    has_DATABASE_PASSWORD: !!env("DATABASE_PASSWORD"),
    // системные PG* (часто платформа подставляет их сама)
    PGHOST: process.env.PGHOST,
    PGPORT: process.env.PGPORT,
    PGDATABASE: process.env.PGDATABASE,
    PGUSER: process.env.PGUSER,
    has_PGPASSWORD: !!process.env.PGPASSWORD,
    // на всякий случай
    DATABASE_URL: process.env.DATABASE_URL,
  });

  const connections: any = {
    postgres: {
      connection: {
        // ✅ НЕ используем DATABASE_URL, чтобы не ловить мусор/старые значения
        // ✅ Но ставим дефолты, чтобы pg не “проваливался” в PG* переменные
        host: env("DATABASE_HOST", process.env.PGHOST || "127.0.0.1"),
        port: env.int("DATABASE_PORT", Number(process.env.PGPORT) || 5432),
        database: env("DATABASE_NAME", process.env.PGDATABASE || "strapi"),
        user: env("DATABASE_USERNAME", process.env.PGUSER || "strapi"),
        password: env("DATABASE_PASSWORD", process.env.PGPASSWORD || undefined),
        schema: env("DATABASE_SCHEMA", "public"),
        ssl: env.bool("DATABASE_SSL", true)
          ? {
              rejectUnauthorized: env.bool(
                "DATABASE_SSL_REJECT_UNAUTHORIZED",
                false,
              ),
            }
          : false,
      },
      pool: {
        min: env.int("DATABASE_POOL_MIN", 2),
        max: env.int("DATABASE_POOL_MAX", 10),
      },
    },

    // ✅ sqlite для локалки
    sqlite: {
      connection: {
        filename: path.join(
          __dirname,
          "..",
          "..",
          env("DATABASE_FILENAME", "data/data.db"),
        ),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int("DATABASE_CONNECTION_TIMEOUT", 60000),
    },
  };
};
