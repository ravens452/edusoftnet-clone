'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function requireAdminLike() {
  const u = await requireSession();
  if (u.role !== 'ADMIN' && u.role !== 'DIRECTION' && u.role !== 'SECRETARY') {
    throw new Error('FORBIDDEN');
  }
  return u;
}

export async function createWindowAction(formData: FormData) {
  await requireAdminLike();
  const periodId = String(formData.get('periodId') || '');
  const name = String(formData.get('name') || '').trim();
  const opensAt = new Date(String(formData.get('opensAt') || ''));
  const closesAt = new Date(String(formData.get('closesAt') || ''));
  const scope = String(formData.get('scope') || 'GLOBAL') as 'GLOBAL' | 'LEVEL' | 'GRADE' | 'SECTION' | 'COURSE';
  const level = (formData.get('level') as 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA' | null) || null;
  const sectionId = (formData.get('sectionId') as string | null) || null;
  const courseId = (formData.get('courseId') as string | null) || null;
  const notes = String(formData.get('notes') || '').trim() || null;

  if (!periodId || !name || isNaN(opensAt.getTime()) || isNaN(closesAt.getTime())) {
    return { error: 'Datos incompletos' };
  }
  if (closesAt <= opensAt) {
    return { error: 'La fecha de cierre debe ser posterior a la de apertura' };
  }

  await prisma.gradingWindow.create({
    data: {
      periodId, name, opensAt, closesAt, scope,
      level: scope === 'LEVEL' ? level : null,
      sectionId: scope === 'SECTION' ? sectionId : null,
      courseId: scope === 'COURSE' ? courseId : null,
      notes,
      state: 'AUTO',
    },
  });
  revalidatePath('/admin/captura-notas');
  return { ok: true };
}

export async function setWindowStateAction(id: string, state: 'AUTO' | 'FORCE_OPEN' | 'FORCE_CLOSED') {
  await requireAdminLike();
  await prisma.gradingWindow.update({ where: { id }, data: { state } });
  revalidatePath('/admin/captura-notas');
  revalidatePath('/notas');
}

export async function deleteWindowAction(id: string) {
  await requireAdminLike();
  await prisma.gradingWindow.delete({ where: { id } });
  revalidatePath('/admin/captura-notas');
  revalidatePath('/notas');
}
