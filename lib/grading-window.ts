/**
 * Ventanas de captura de notas — controladas por administración.
 *
 * Una ventana define un rango de fechas (opensAt → closesAt) durante el cual
 * los docentes pueden registrar/editar notas. Puede aplicar a:
 *   - GLOBAL: todos los docentes/cursos
 *   - LEVEL: solo un nivel (Inicial / Primaria / Secundaria)
 *   - GRADE / SECTION / COURSE: alcance más específico
 *
 * El estado AUTO sigue las fechas. FORCE_OPEN / FORCE_CLOSED las override.
 */

import { prisma } from './db';
import type { EducationLevel, GradingWindow } from './generated/prisma/client';

export type WindowContext = {
  periodId: string;
  level?: EducationLevel;
  gradeId?: string;
  sectionId?: string;
  courseId?: string;
};

/** Devuelve true si la ventana está abierta ahora considerando state + fechas */
export function isWindowOpen(w: GradingWindow, now = new Date()): boolean {
  if (w.state === 'FORCE_CLOSED') return false;
  if (w.state === 'FORCE_OPEN') return true;
  // AUTO
  return now >= w.opensAt && now <= w.closesAt;
}

/** Etiqueta legible del estado para mostrar a usuarios */
export function windowStatusLabel(w: GradingWindow, now = new Date()): {
  open: boolean;
  label: string;
  reason: 'auto-open' | 'auto-closed-future' | 'auto-closed-past' | 'forced-open' | 'forced-closed';
} {
  if (w.state === 'FORCE_OPEN') return { open: true, label: 'Abierta (forzada por admin)', reason: 'forced-open' };
  if (w.state === 'FORCE_CLOSED') return { open: false, label: 'Cerrada (por admin)', reason: 'forced-closed' };
  if (now < w.opensAt) return { open: false, label: 'Programada — aún no abre', reason: 'auto-closed-future' };
  if (now > w.closesAt) return { open: false, label: 'Cerrada — fecha vencida', reason: 'auto-closed-past' };
  return { open: true, label: 'Abierta', reason: 'auto-open' };
}

/** ¿Esta ventana aplica al contexto dado? */
export function windowAppliesTo(w: GradingWindow, ctx: WindowContext): boolean {
  if (w.periodId !== ctx.periodId) return false;
  switch (w.scope) {
    case 'GLOBAL':
      return true;
    case 'LEVEL':
      return !!ctx.level && w.level === ctx.level;
    case 'GRADE':
      return !!ctx.gradeId && w.gradeId === ctx.gradeId;
    case 'SECTION':
      return !!ctx.sectionId && w.sectionId === ctx.sectionId;
    case 'COURSE':
      return !!ctx.courseId && w.courseId === ctx.courseId;
    default:
      return false;
  }
}

/**
 * Determina si la captura está abierta para un contexto específico.
 * Si CUALQUIER ventana aplicable está abierta, retorna true.
 * Si hay ventanas aplicables pero ninguna está abierta, retorna false.
 * Si NO hay ventanas aplicables, retorna false (por seguridad).
 */
export async function isGradingOpenFor(ctx: WindowContext): Promise<{ open: boolean; matchedWindows: GradingWindow[]; openWindows: GradingWindow[] }> {
  const candidates = await prisma.gradingWindow.findMany({
    where: { periodId: ctx.periodId },
  });
  const matched = candidates.filter((w) => windowAppliesTo(w, ctx));
  const open = matched.filter((w) => isWindowOpen(w));
  return { open: open.length > 0, matchedWindows: matched, openWindows: open };
}

export const SCOPE_LABEL: Record<string, string> = {
  GLOBAL: 'Toda la institución',
  LEVEL: 'Por nivel',
  GRADE: 'Por grado',
  SECTION: 'Por sección',
  COURSE: 'Por curso',
};

export const STATE_LABEL: Record<string, string> = {
  AUTO: 'Automático (por fechas)',
  FORCE_OPEN: 'Forzada abierta',
  FORCE_CLOSED: 'Forzada cerrada',
};
