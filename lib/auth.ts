import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from './db';
import type { Role } from './generated/prisma/enums';

const COOKIE_NAME = 'edusoftnet_session';
const SESSION_DAYS = 30;
// Para una demo. En producción usar AUTH_SECRET via env.
const SECRET = process.env.AUTH_SECRET || 'edusoftnet-demo-secret-change-in-prod';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/**
 * Sesiones stateless: firmamos {userId, exp} con HMAC-SHA256.
 * Sin tabla de sesiones, sobrevive a cold starts de Vercel.
 */
function b64u(buf: Buffer | string) {
  return Buffer.from(buf).toString('base64url');
}
function fromB64u(s: string) {
  return Buffer.from(s, 'base64url');
}
function sign(payload: string) {
  return b64u(createHmac('sha256', SECRET).update(payload).digest());
}

function makeToken(userId: string, expMs: number): string {
  const payload = b64u(JSON.stringify({ uid: userId, exp: expMs }));
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { uid: string; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = sign(payload);
  try {
    if (!timingSafeEqual(fromB64u(sig), fromB64u(expected))) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(fromB64u(payload).toString('utf8'));
    if (typeof data.uid !== 'string' || typeof data.exp !== 'number') return null;
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const token = makeToken(userId, expiresAt.getTime());
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export type SessionUser = {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl: string | null;
};

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const data = verifyToken(token);
  if (!data) return null;
  // Lookup del user (read-only sobre seed data, OK en serverless)
  const u = await prisma.user.findUnique({ where: { id: data.uid } });
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    avatarUrl: u.avatarUrl,
  };
}

export async function requireSession() {
  const user = await getSession();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireSession();
  if (!roles.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}
