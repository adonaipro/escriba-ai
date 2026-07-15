import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDbUrl(): string {
  const raw = process.env.DATABASE_URL || "file:./dev.db";
  if (raw.startsWith("file:") && !raw.startsWith("file://")) {
    const filePath = raw.slice("file:".length);
    const abs = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);
    return "file:" + abs.replace(/\\/g, "/");
  }
  return raw;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaLibSql({ url: resolveDbUrl() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
