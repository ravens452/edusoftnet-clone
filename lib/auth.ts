import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { prisma } from './db';
import type { Role } from './generated/prisma/enums';

const COOKIE_NAME = 'edusoftnet_session';
const SESSION_DAYS = 30;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { userId, token, expiresAt } });
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
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    jar.delete(COOKIE_NAME);
  }
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
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
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
