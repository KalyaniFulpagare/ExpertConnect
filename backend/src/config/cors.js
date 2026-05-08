export const createCorsOptions = () => {
  const configuredOrigins = String(process.env.CLIENT_URL || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
      const isRenderDomain = /^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin);
      const isConfigured = configuredOrigins.includes(origin);

      if (isLocalhost || isRenderDomain || isConfigured) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS."));
    }
  };
};
