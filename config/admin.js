// config/admin.js
module.exports = ({ env }) => {
  const secret =
    env("ADMIN_JWT_SECRET") ||
    env("JWT_SECRET") ||
    env("STRAPI_ADMIN_JWT_SECRET");

  if (!secret) {
    throw new Error("ADMIN JWT SECRET IS MISSING AT RUNTIME");
  }

  return {
    auth: { secret },
    apiToken: { salt: env("API_TOKEN_SALT") },
    transfer: { token: { salt: env("TRANSFER_TOKEN_SALT") } },
    secrets: { encryptionKey: env("ENCRYPTION_KEY") },
  };
};
