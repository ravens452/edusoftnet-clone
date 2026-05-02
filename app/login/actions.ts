'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createSession, destroySession, verifyPassword } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const username = String(formData.get('username') || '').trim();
  const pw = String(formData.get('password') || '');
  if (!username || !pw) return { error: 'Faltan datos' };

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) return { error: 'Usuario o contraseña inválidos' };
  const ok = await verifyPassword(pw, user.passwordHash);
  if (!ok) return { error: 'Usuario o contraseña inválidos' };

  await createSession(user.id);
  redirect('/dashboard');
}

export async function logoutAction() {
  await destroySession();
}
