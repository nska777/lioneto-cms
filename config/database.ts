import path from "path";

export default ({ env }) => {
  // ✅ выбираем БД явно
  const client = env("DATABASE_CLIENT", "sqlite"); // "postgres" | "sqlite"

  const connections = {
    postgres: {
      connection: {
        host: env("DATABASE_HOST", "127.0.0.1"),
        port: env.int("DATABASE_PORT", 5432),
        database: env("DATABASE_NAME"),
        user: env("DATABASE_USERNAME"),
        password: env("DATABASE_PASSWORD"),
        ssl: env.bool("DATABASE_SSL", false)
          ? { rejectUnauthorized: false }
          : false,
      },
      pool: { min: 2, max: 10 },
    },

    sqlite: {
      connection: {
        filename: path.join(
          __dirname,
          "..",
          "..",
          env("DATABASE_FILENAME", "data/data.db")
        ),
      },
      useNullAsDefault: true,
    },
  };

  return { connection: { client, ...connections[client] } };
};
