// Smoke test: login as several roles, GET every module route, verify status 200.
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';
import { createHmac } from 'node:crypto';

// Reproducción de lib/auth.ts (HMAC stateless tokens)
const SECRET = process.env.AUTH_SECRET || 'edusoftnet-demo-secret-change-in-prod';
const b64u = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');
function sign(payload: string) {
  return b64u(createHmac('sha256', SECRET).update(payload).digest());
}
function makeToken(userId: string, expMs: number): string {
  const payload = b64u(JSON.stringify({ uid: userId, exp: expMs }));
  return `${payload}.${sign(payload)}`;
}

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

const BASE = 'http://localhost:3000';
const ROUTES_BY_ROLE: Record<string, string[]> = {
  ADMIN: ['/dashboard', '/notas', '/asistencia', '/eclass', '/echat', '/comunicados', '/efamily', '/tesoreria', '/elibrary', '/ecare', '/emonitor', '/edocuments', '/edrive', '/talleres', '/porteria', '/mesa-partes', '/salud', '/entrevistas', '/matriculas', '/admin/usuarios', '/admin/configuracion', '/admin/captura-notas'],
  DIRECTION: ['/dashboard', '/notas', '/asistencia', '/eclass', '/comunicados', '/efamily', '/tesoreria', '/elibrary', '/ecare', '/emonitor', '/edocuments', '/edrive', '/talleres', '/porteria', '/mesa-partes', '/salud', '/entrevistas', '/matriculas', '/admin/captura-notas'],
  TEACHER: ['/dashboard', '/notas', '/asistencia', '/eclass', '/echat', '/comunicados', '/horario', '/emonitor', '/elibrary', '/edrive', '/entrevistas', '/hoja-vida'],
  STUDENT: ['/dashboard', '/notas', '/asistencia', '/eclass', '/echat', '/comunicados', '/horario', '/notificaciones', '/elibrary', '/talleres', '/hoja-vida', '/salud'],
  PARENT: ['/dashboard', '/notas', '/asistencia', '/eclass', '/echat', '/comunicados', '/hijos', '/pagos', '/notificaciones', '/mesa-partes', '/entrevistas'],
  PSYCHOLOGY: ['/dashboard', '/ecare', '/echat', '/comunicados', '/entrevistas', '/hoja-vida'],
  TREASURY: ['/dashboard', '/tesoreria', '/matriculas', '/comunicados'],
  SECRETARY: ['/dashboard', '/mesa-partes', '/efamily', '/matriculas', '/entrevistas', '/echat', '/comunicados', '/edocuments', '/edrive'],
  GATEKEEPER: ['/dashboard', '/porteria'],
};
const USERNAMES: Record<string, string> = {
  ADMIN: 'admin', DIRECTION: 'direccion', TEACHER: '46419291',
  STUDENT: 'alumno', PARENT: 'padre',
  PSYCHOLOGY: 'psicologia', TREASURY: 'tesoreria',
  SECRETARY: 'secretaria', GATEKEEPER: 'porteria',
};

async function loginViaDb(username: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error(`No user ${username}`);
  const token = makeToken(user.id, Date.now() + 1000 * 60 * 60);
  return { token, user };
}

async function probe(token: string, path: string) {
  const res = await fetch(BASE + path, {
    headers: { cookie: `edusoftnet_session=${token}` },
    redirect: 'manual',
  });
  return { status: res.status, location: res.headers.get('location') };
}

async function main() {
  let pass = 0, fail = 0;
  const failures: { role: string; r: string; status: number; location: string | null }[] = [];

  for (const role of Object.keys(ROUTES_BY_ROLE)) {
    const username = USERNAMES[role];
    const { token } = await loginViaDb(username);
    console.log(`\n=== ${role} (${username}) ===`);
    for (const r of ROUTES_BY_ROLE[role]) {
      const { status, location } = await probe(token, r);
      const ok = status === 200 || (status >= 300 && status < 400);
      if (ok) {
        pass++;
        console.log(`  ✓ ${r} → ${status}${location ? ` -> ${location}` : ''}`);
      } else {
        fail++;
        failures.push({ role, r, status, location });
        console.log(`  ✗ ${r} → ${status}`);
      }
    }
  }
  console.log(`\n${pass} pass, ${fail} fail`);
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  ${f.role} ${f.r} → ${f.status}`);
  }
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
