'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

const Schema = z.object({
  studentId: z.string().min(1),
  symptoms: z.string().min(3).max(500),
  treatment: z.string().optional(),
});

export async function createHealthRecordAction(formData: FormData) {
  const user = await requireSession();
  if (!['NURSE', 'DIRECTION', 'ADMIN', 'TEACHER'].includes(user.role)) {
    return { error: 'No tienes permiso' };
  }
  const parsed = Schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(' · ') };

  try {
    await prisma.healthRecord.create({
      data: {
        studentId: parsed.data.studentId,
        symptoms: parsed.data.symptoms,
        treatment: parsed.data.treatment || null,
        attendedBy: `${user.firstName} ${user.lastName}`,
        date: new Date(),
      },
    });
    revalidatePath('/salud');
    return { success: true };
  } catch (err) {
    console.error('createHealth', err);
    return { error: 'Error guardando' };
  }
}
