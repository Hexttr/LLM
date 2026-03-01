const required = (key: string, forServer = true): string => {
  const v = process.env[key];
  if (!v && forServer && typeof window === "undefined") {
    throw new Error(`Missing env: ${key}`);
  }
  return v ?? "";
};

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  litellmProxyUrl: () => required("LITELLM_PROXY_URL", false) || "http://localhost:4000",
  litellmMasterKey: () => required("LITELLM_MASTER_KEY"),
  jwtSecret: () => required("JWT_SECRET"),
};
