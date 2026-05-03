'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

const Schema = z.object({
  studentId: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().min(3).max(3000),
});

export async function createCaseAction(formData: FormData) {
  const user = await requireSession();
  if (!['PSYCHOLOGY', 'DIRECTION', 'ADMIN'].includes(user.role)) return { error: 'No tienes permiso' };

  const parsed = Schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(' · ') };

  try {
    await prisma.psychologyCase.create({
      data: { ...parsed.data, status: 'OPEN', openedAt: new Date() },
    });
    revalidatePath('/ecare');
    return { success: true };
  } catch (err) {
    console.error('createCase', err);
    return { error: 'Error guardando' };
  }
}
