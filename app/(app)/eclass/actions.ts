'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

const Schema = z.object({
  courseAssignmentId: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  type: z.enum(['HOMEWORK', 'PROJECT', 'QUIZ', 'EXAM', 'PRACTICE', 'FORUM']),
  dueDate: z.string().min(1),
  maxScore: z.coerce.number().min(1).max(100).default(20),
});

export async function createAssignmentAction(formData: FormData) {
  const user = await requireSession();
  if (!['TEACHER', 'DIRECTION', 'ADMIN'].includes(user.role)) return { error: 'No tienes permiso' };

  const parsed = Schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(' · ') };

  // Validar que el courseAssignment sea del docente actual (si es docente)
  if (user.role === 'TEACHER') {
    const t = await prisma.teacher.findUnique({ where: { userId: user.id } });
    const ca = await prisma.courseAssignment.findUnique({ where: { id: parsed.data.courseAssignmentId } });
    if (!t || !ca || ca.teacherId !== t.id) return { error: 'Curso inválido' };
  }

  try {
    await prisma.assignment.create({
      data: {
        courseAssignmentId: parsed.data.courseAssignmentId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        type: parsed.data.type,
        maxScore: parsed.data.maxScore,
        dueDate: new Date(parsed.data.dueDate),
      },
    });
    revalidatePath('/eclass');
    return { success: true };
  } catch (err) {
    console.error('createAssignment', err);
    return { error: 'Error guardando la tarea' };
  }
}
