// eslint-disable-next-line @typescript-eslint/no-require-imports
import type { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    // Dynamic require avoids loading native query engine at module evaluation time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient: PC } = require("@prisma/client");
    globalForPrisma.prisma = new PC({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma!;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
