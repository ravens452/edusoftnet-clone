'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

const Schema = z.object({
  studentId: z.string().min(1),
  type: z.enum(['ACHIEVEMENT', 'INCIDENT', 'COMMENT', 'RECOGNITION', 'CONDUCT']),
  title: z.string().min(3).max(200),
  body: z.string().min(3).max(2000),
});

export async function createLifeEntryAction(formData: FormData) {
  const user = await requireSession();
  if (!['TEACHER', 'DIRECTION', 'ADMIN', 'PSYCHOLOGY'].includes(user.role)) {
    return { error: 'No tienes permiso' };
  }
  const parsed = Schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(' · ') };

  try {
    await prisma.studentLifeEntry.create({
      data: { ...parsed.data, authorId: user.id, date: new Date() },
    });
    revalidatePath('/hoja-vida');
    return { success: true };
  } catch (err) {
    console.error('createLifeEntry', err);
    return { error: 'Error guardando' };
  }
}
