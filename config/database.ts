import path from "path";

export default ({ env }) => {
  // ✅ В проде по умолчанию postgres (а не sqlite)
  const client = env("DATABASE_CLIENT", env("NODE_ENV") === "production" ? "postgres" : "sqlite");

  const connections: any = {
    postgres: {
      connection: {
        // ✅ НЕ используем DATABASE_URL, чтобы не ловить мусор/старые значения
        host: env("DATABASE_HOST"),
        port: env.int("DATABASE_PORT", 5432),
        database: env("DATABASE_NAME"),
        user: env("DATABASE_USERNAME"),
        password: env("DATABASE_PASSWORD"),
        schema: env("DATABASE_SCHEMA", "public"),
        ssl: env.bool("DATABASE_SSL", true)
          ? {
              rejectUnauthorized: env.bool("DATABASE_SSL_REJECT_UNAUTHORIZED", false),
            }
          : false,
      },
      pool: { min: env.int("DATABASE_POOL_MIN", 2), max: env.int("DATABASE_POOL_MAX", 10) },
    },

    // оставляем sqlite для локалки, если захочешь запускать без postgres
    sqlite: {
      connection: {
        filename: path.join(__dirname, "..", "..", env("DATABASE_FILENAME", "data/data.db")),
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
