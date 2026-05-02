import fs from 'node:fs';
import path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Vercel/serverless: filesystem read-only excepto /tmp.
 * Copiamos la DB seed a /tmp en el primer cold start.
 * Datos viven mientras dure el lambda; reset en cada cold start = data fresca para demo.
 */
function resolveDbPath(): string {
  const isServerless = !!process.env.VERCEL;
  if (!isServerless) {
    return process.env.DATABASE_URL || 'file:./dev.db';
  }
  const tmpDb = '/tmp/edusoft-demo.db';
  if (!fs.existsSync(tmpDb)) {
    const seed = path.join(process.cwd(), 'dev.db');
    if (fs.existsSync(seed)) {
      fs.copyFileSync(seed, tmpDb);
    }
  }
  return `file:${tmpDb}`;
}

function createClient() {
  const adapter = new PrismaBetterSqlite3({ url: resolveDbPath() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
