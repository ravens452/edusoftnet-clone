// Tests payment flow + SIAGIE exports.
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';
import { randomBytes } from 'node:crypto';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function loginAs(username: string) {
  const u = await prisma.user.findUnique({ where: { username } });
  if (!u) throw new Error(`No user ${username}`);
  const token = randomBytes(48).toString('hex');
  await prisma.session.create({ data: { userId: u.id, token, expiresAt: new Date(Date.now() + 3600_000) } });
  return token;
}

async function main() {
  const token = await loginAs('admin');
  const headers = { cookie: `edusoftnet_session=${token}` };

  console.log('## SIAGIE / UGEL endpoints');
  for (const p of ['/siagie', '/api/siagie/matricula', '/api/siagie/notas', '/api/siagie/asistencia']) {
    const r = await fetch('http://localhost:3000' + p, { headers });
    let extra = '';
    if (p.startsWith('/api/')) {
      const text = await r.text();
      const lines = text.split('\n');
      extra = ` — ${lines.length - 1} filas`;
    }
    console.log(`  ${r.status} ${p}${extra}`);
  }

  console.log('\n## /pagos and /tesoreria');
  for (const p of ['/pagos', '/tesoreria']) {
    const r = await fetch('http://localhost:3000' + p, { headers });
    console.log(`  ${r.status} ${p}`);
  }

  console.log('\n## /pagos/[id]/comprobante');
  const anyPayment = await prisma.payment.findFirst();
  if (anyPayment) {
    const r = await fetch(`http://localhost:3000/pagos/${anyPayment.id}/comprobante`, { headers });
    console.log(`  ${r.status} /pagos/${anyPayment.id}/comprobante`);
  }

  console.log('\n## SIAGIE access denied for non-admin');
  const studentToken = await loginAs('alumno');
  const r = await fetch('http://localhost:3000/siagie', {
    headers: { cookie: `edusoftnet_session=${studentToken}` }, redirect: 'manual',
  });
  console.log(`  ${r.status} /siagie (alumno) — expected 307 redirect`);

  await prisma.$disconnect();
}

main().catch(console.error);
