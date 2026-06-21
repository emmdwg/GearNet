import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  // Vercel/serverless: use DATABASE_URL (Supabase pooler). Local dev: prefer direct connection.
  const connectionString =
    process.env.VERCEL === "1"
      ? (process.env.DATABASE_URL ?? process.env.DIRECT_URL)
      : (process.env.DIRECT_URL ?? process.env.DATABASE_URL);
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL (or DIRECT_URL) for PostgreSQL connection");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
