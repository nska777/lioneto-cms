export default ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 3000),

  proxy: true,

  url: env("PUBLIC_URL", ""),

  app: {
    keys: env.array("APP_KEYS"),
  },
});
