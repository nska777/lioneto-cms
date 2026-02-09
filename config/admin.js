// config/admin.js
export default ({ env }) => {
  const secret = env("ADMIN_JWT_SECRET");

  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET is missing");
  }

  return {
    auth: { secret },
    apiToken: { salt: env("API_TOKEN_SALT") },
    transfer: { token: { salt: env("TRANSFER_TOKEN_SALT") } },
    secrets: { encryptionKey: env("ENCRYPTION_KEY") },
  };
};
