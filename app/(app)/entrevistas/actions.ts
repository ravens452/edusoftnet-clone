'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

const Schema = z.object({
  parentId: z.string().min(1, 'Selecciona un apoderado'),
  teacherId: z.string().optional(),
  scheduledAt: z.string().min(1, 'Fecha y hora requeridas'),
  durationMin: z.coerce.number().int().min(10).max(240).default(30),
  mode: z.enum(['IN_PERSON', 'VIRTUAL']).default('IN_PERSON'),
  topic: z.string().min(3, 'Describe el tema'),
  notes: z.string().optional(),
  meetingUrl: z.string().optional(),
});

export async function createInterviewAction(formData: FormData) {
  const user = await requireSession();
  if (!['TEACHER', 'DIRECTION', 'ADMIN', 'SECRETARY'].includes(user.role)) {
    return { error: 'No tienes permiso para crear entrevistas' };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(' · ') };
  }
  const data = parsed.data;

  // Resolver teacherId: si docente, usar el suyo; si admin/dirección, requerir el seleccionado
  let teacherId = data.teacherId;
  if (user.role === 'TEACHER') {
    const t = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (!t) return { error: 'No tienes perfil de docente' };
    teacherId = t.id;
  }
  if (!teacherId) return { error: 'Selecciona un docente' };

  try {
    await prisma.interview.create({
      data: {
        teacherId,
        parentId: data.parentId,
        scheduledAt: new Date(data.scheduledAt),
        durationMin: data.durationMin,
        mode: data.mode,
        topic: data.topic,
        notes: data.notes || null,
        meetingUrl: data.meetingUrl || null,
        status: 'CONFIRMED',
      },
    });
    revalidatePath('/entrevistas');
    return { success: true };
  } catch (err) {
    console.error('createInterview', err);
    return { error: 'Error guardando la entrevista' };
  }
}
