import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const before = await prisma.session.count();
  // After clicking logout in browser, session count should drop. Just print state.
  console.log('Sessions in DB:', before);
  await prisma.$disconnect();
}
main();
