export default ({ env }) => ({
  auth: {
    // Strapi v5 часто ожидает именно admin.auth.secret
    secret: env("ADMIN_AUTH_SECRET") || env("ADMIN_JWT_SECRET"),
  },
  apiToken: {
    salt: env("API_TOKEN_SALT"),
  },
  transfer: {
    token: {
      salt: env("TRANSFER_TOKEN_SALT"),
    },
  },
});
