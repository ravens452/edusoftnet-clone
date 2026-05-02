import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';
import { randomBytes } from 'node:crypto';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'admin' } });
  const token = randomBytes(48).toString('hex');
  await prisma.session.create({ data: { userId: user!.id, token, expiresAt: new Date(Date.now() + 3600_000) } });

  const a = await prisma.assignment.findFirst();
  const t = await prisma.chatThread.findFirst();
  const s = await prisma.student.findFirst();

  const paths = [
    `/eclass/${a!.id}`,
    `/echat/${t!.id}`,
    `/hijos/${s!.id}`,
    `/comunicados/nuevo`,
    `/notificaciones`,
    `/horario`,
    `/login`,
  ];

  for (const p of paths) {
    const r = await fetch('http://localhost:3000' + p, { headers: { cookie: `edusoftnet_session=${token}` }, redirect: 'manual' });
    console.log(`${r.status} ${p}`);
  }
  await prisma.$disconnect();
}
main();
