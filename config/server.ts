export default ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),

  proxy: true,

  url: env("PUBLIC_URL", "https://lioneto-cms.ru"),

  app: {
    keys: env.array("APP_KEYS"),
  },
});
