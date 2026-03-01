import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// На Windows кавычки из .env могут попасть в значение — убираем
if (typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.startsWith('"')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^"|"$/g, "").trim();
}
// Fallback: если переменная пустая (например не подхватилась на Windows), задаём явно
const url = process.env.DATABASE_URL?.trim();
if (!url && typeof window === "undefined") {
  process.env.DATABASE_URL = "postgresql://llmproxy:dbpassword9090@127.0.0.1:5432/litellm";
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
