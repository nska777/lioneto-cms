// config/server.ts
export default ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),

  // Важно для работы за reverse-proxy (App Platform)
  proxy: true,

  // Публичный URL приложения (то, по чему ты заходишь снаружи)
  url: env("PUBLIC_URL"),

  app: {
    keys: env.array("APP_KEYS"),
  },
});
