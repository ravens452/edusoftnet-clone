'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isGradingOpenFor } from '@/lib/grading-window';

/**
 * Registra o actualiza una nota final por curso/sección/periodo.
 * Verifica que el docente tenga el courseAssignment y que la ventana esté abierta.
 */
export async function saveFinalScoreAction(args: {
  studentId: string;
  courseAssignmentId: string;
  periodId: string;
  value: number;
  observation?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireSession();
  if (user.role !== 'TEACHER' && user.role !== 'ADMIN' && user.role !== 'DIRECTION') {
    return { ok: false, error: 'No tienes permiso para registrar notas.' };
  }
  const value = Number(args.value);
  if (isNaN(value) || value < 0 || value > 20) {
    return { ok: false, error: 'La nota debe ser un número entre 0 y 20.' };
  }

  const ca = await prisma.courseAssignment.findUnique({
    where: { id: args.courseAssignmentId },
    include: {
      teacher: true,
      section: { include: { grade: true } },
      course: true,
    },
  });
  if (!ca) return { ok: false, error: 'Asignación de curso no encontrada.' };

  // Si es docente, verificar que sea de su curso
  if (user.role === 'TEACHER') {
    if (ca.teacher.userId !== user.id) {
      return { ok: false, error: 'Este curso no está asignado a tu cuenta.' };
    }
  }

  // Verificar ventana de captura
  const result = await isGradingOpenFor({
    periodId: args.periodId,
    level: ca.section.grade.level,
    gradeId: ca.section.gradeId,
    sectionId: ca.sectionId,
    courseId: ca.courseId,
  });
  if (!result.open) {
    if (result.matchedWindows.length === 0) {
      return { ok: false, error: 'No hay ventana de captura programada. Comunícate con Coordinación Académica.' };
    }
    return { ok: false, error: 'La ventana de captura está cerrada en este momento.' };
  }

  const letterGrade = value >= 18 ? 'AD' : value >= 14 ? 'A' : value >= 11 ? 'B' : 'C';
  await prisma.finalScore.upsert({
    where: {
      studentId_courseAssignmentId_periodId: {
        studentId: args.studentId,
        courseAssignmentId: args.courseAssignmentId,
        periodId: args.periodId,
      },
    },
    create: {
      studentId: args.studentId,
      courseAssignmentId: args.courseAssignmentId,
      periodId: args.periodId,
      value, letterGrade,
      observation: args.observation ?? null,
    },
    update: {
      value, letterGrade,
      observation: args.observation ?? null,
    },
  });

  revalidatePath('/notas');
  return { ok: true };
}
