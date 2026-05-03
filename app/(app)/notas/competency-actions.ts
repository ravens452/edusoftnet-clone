'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const VALID_LETTERS = ['AD', 'A', 'B', 'C'] as const;
type Letter = typeof VALID_LETTERS[number];
const VAL: Record<Letter, number> = { AD: 4, A: 3, B: 2, C: 1 };
const REV: Record<number, Letter> = { 4: 'AD', 3: 'A', 2: 'B', 1: 'C' };

export function aggregateLetters(letters: (string | null | undefined)[]): Letter | null {
  const valid = letters.filter((l): l is Letter => !!l && VALID_LETTERS.includes(l as Letter));
  if (!valid.length) return null;
  const avg = valid.reduce((sum, l) => sum + VAL[l], 0) / valid.length;
  const rounded = Math.round(avg);
  return REV[rounded] ?? null;
}

/**
 * Guarda/actualiza una calificación mensual o final del trimestre
 * para una competencia × estudiante × periodo.
 */
export async function setCompetencyMonthAction(args: {
  studentId: string;
  courseAssignmentId: string;
  competencyId: string;
  periodId: string;
  field: 'm1' | 'm2' | 'm3' | 'letterGrade';
  value: string | null; // 'AD' | 'A' | 'B' | 'C' | null
}): Promise<{ ok: true; aggregate: string | null } | { ok: false; error: string }> {
  const user = await requireSession();
  if (!['TEACHER', 'ADMIN', 'DIRECTION'].includes(user.role)) {
    return { ok: false, error: 'No tienes permiso' };
  }
  if (args.value !== null && !VALID_LETTERS.includes(args.value as Letter)) {
    return { ok: false, error: 'Valor inválido' };
  }

  const ca = await prisma.courseAssignment.findUnique({
    where: { id: args.courseAssignmentId },
    include: { teacher: true },
  });
  if (!ca) return { ok: false, error: 'Curso no encontrado' };
  if (user.role === 'TEACHER' && ca.teacher.userId !== user.id) {
    return { ok: false, error: 'No es tu curso' };
  }

  // Upsert por (studentId, competencyId, periodId)
  const existing = await prisma.competencyAssessment.findUnique({
    where: {
      studentId_competencyId_periodId: {
        studentId: args.studentId,
        competencyId: args.competencyId,
        periodId: args.periodId,
      },
    },
  });

  const updates: any = { [args.field]: args.value };

  // Si actualizamos un mes, recalcular letterGrade automáticamente
  // (a menos que el docente haya editado letterGrade manualmente, lo respetamos)
  let row;
  if (existing) {
    const m1 = args.field === 'm1' ? args.value : existing.m1;
    const m2 = args.field === 'm2' ? args.value : existing.m2;
    const m3 = args.field === 'm3' ? args.value : existing.m3;
    if (args.field !== 'letterGrade') {
      updates.letterGrade = aggregateLetters([m1, m2, m3]);
    }
    row = await prisma.competencyAssessment.update({
      where: { id: existing.id },
      data: updates,
    });
  } else {
    const m1 = args.field === 'm1' ? args.value : null;
    const m2 = args.field === 'm2' ? args.value : null;
    const m3 = args.field === 'm3' ? args.value : null;
    const letter = args.field === 'letterGrade' ? args.value : aggregateLetters([m1, m2, m3]);
    row = await prisma.competencyAssessment.create({
      data: {
        studentId: args.studentId,
        courseAssignmentId: args.courseAssignmentId,
        competencyId: args.competencyId,
        periodId: args.periodId,
        m1, m2, m3,
        letterGrade: letter,
      },
    });
  }

  revalidatePath('/notas');
  return { ok: true, aggregate: row.letterGrade };
}
