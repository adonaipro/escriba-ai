import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  __pgUtcParsers?: boolean;
};

/**
 * Prisma DateTime maps to TIMESTAMP WITHOUT TIME ZONE and stores UTC components.
 * node-pg defaults to parsing those as *server local* time, which shifts slots by
 * the machine offset (e.g. +3h on America/Sao_Paulo) and breaks campaign schedules.
 * Always interpret naive timestamps as UTC.
 */
function installUtcTimestampParsers() {
  if (globalForPrisma.__pgUtcParsers) return;
  globalForPrisma.__pgUtcParsers = true;
  const TIMESTAMP_OID = 1114; // timestamp without time zone
  pg.types.setTypeParser(TIMESTAMP_OID, (value: string) => {
    // "2026-08-02 12:00:00" or with fractional seconds
    const normalized = value.includes("T") ? value : value.replace(" ", "T");
    return new Date(normalized.endsWith("Z") ? normalized : `${normalized}Z`);
  });
}

function createPrismaClient() {
  installUtcTimestampParsers();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definida");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
