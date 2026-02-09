// config/admin.js
module.exports = ({ env }) => {
  const adminSecret =
    env("ADMIN_JWT_SECRET") ||
    env("JWT_SECRET") ||
    env("STRAPI_ADMIN_JWT_SECRET") ||
    env("ADMIN_AUTH_SECRET");

  return {
    auth: {
      secret: adminSecret,
    },
    apiToken: {
      salt: env("API_TOKEN_SALT"),
    },
    transfer: {
      token: {
        salt: env("TRANSFER_TOKEN_SALT"),
      },
    },
    secrets: {
      encryptionKey: env("ENCRYPTION_KEY"),
    },
    flags: {
      nps: env.bool("FLAG_NPS", true),
      promoteEE: env.bool("FLAG_PROMOTE_EE", true),
    },
  };
};
