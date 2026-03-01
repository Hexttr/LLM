import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const DEFAULT_DATABASE_URL = "postgresql://llmproxy:dbpassword9090@127.0.0.1:5432/litellm";

function normalizeDatabaseUrl(): string {
  if (typeof window !== "undefined") return "";
  let url = process.env.DATABASE_URL;
  if (typeof url === "string") {
    // Убираем кавычки (часто попадают из .env на Windows)
    url = url.replace(/^["']|["']$/g, "").trim();
  }
  if (!url) return DEFAULT_DATABASE_URL;
  // Должен быть формат postgresql://user:pass@host:port/db (иначе Prisma выдаст "credentials (not available)")
  const hasScheme = url.includes("://");
  const hasAt = url.includes("@");
  const hasCredentials = hasScheme && hasAt && /:\/\/[^:@]+:[^@]+@/.test(url);
  if (!hasScheme || !hasAt || !hasCredentials) return DEFAULT_DATABASE_URL;
  // Опционально: при запуске портала на хосте (не в Docker) заменить хост "db" на 127.0.0.1
  const useLocalhost = process.env.DATABASE_USE_LOCALHOST === "1";
  if (useLocalhost && url.includes("@db:")) {
    url = url.replace("@db:", "@127.0.0.1:");
  }
  return url;
}

// Подставляем нормализованный URL до создания клиента (Prisma читает process.env.DATABASE_URL)
const resolvedUrl = normalizeDatabaseUrl();
process.env.DATABASE_URL = resolvedUrl;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
