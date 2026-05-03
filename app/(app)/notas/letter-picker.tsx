'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setCompetencyMonthAction } from './competency-actions';

export type Letter = 'AD' | 'A' | 'B' | 'C' | null;

const COLORS: Record<string, string> = {
  AD: 'bg-[var(--success)] text-white',
  A:  'bg-[var(--brand-blue)] text-white',
  B:  'bg-[var(--warning)] text-white',
  C:  'bg-[var(--destructive)] text-white',
  '': 'bg-[var(--muted)] text-[var(--muted-foreground)]',
};
const HOVER: Record<string, string> = {
  AD: 'hover:bg-[var(--success)]/15 hover:text-[var(--success-on-soft)]',
  A:  'hover:bg-[var(--soft-blue)] hover:text-[var(--primary-on-soft)]',
  B:  'hover:bg-[var(--soft-warning)] hover:text-[var(--warning-on-soft)]',
  C:  'hover:bg-[var(--soft-danger)] hover:text-[var(--destructive-on-soft)]',
};
const LABELS: Record<string, string> = {
  AD: 'Logro destacado',
  A: 'Logro esperado',
  B: 'En proceso',
  C: 'En inicio',
};

export function LetterChip({ value, size = 'sm' }: { value: Letter | undefined; size?: 'xs' | 'sm' | 'md' }) {
  const cls = value ? COLORS[value] : COLORS[''];
  const sizeCls = size === 'xs' ? 'h-6 w-6 text-[10px]' : size === 'md' ? 'h-9 min-w-9 px-2 text-sm' : 'h-7 min-w-7 px-1.5 text-xs';
  return (
    <span
      title={value ? `${value} — ${LABELS[value]}` : 'Sin calificar'}
      className={`inline-flex items-center justify-center rounded-md font-bold leading-none ${sizeCls} ${cls}`}
    >
      {value ?? '—'}
    </span>
  );
}

/**
 * Picker de letra MINEDU con 4 botones.
 * Si haces clic en la letra ya seleccionada, la quita (toggle).
 * Optimistic UI + server action.
 */
export function LetterPicker({
  value,
  studentId,
  courseAssignmentId,
  competencyId,
  periodId,
  field,
  canEdit,
  size = 'sm',
}: {
  value: Letter;
  studentId: string;
  courseAssignmentId: string;
  competencyId: string;
  periodId: string;
  field: 'm1' | 'm2' | 'm3' | 'letterGrade';
  canEdit: boolean;
  size?: 'sm' | 'md';
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [optimistic, setOptimistic] = useState<Letter>(value);
  const [open, setOpen] = useState(false);

  if (!canEdit) {
    return <LetterChip value={optimistic} size={size} />;
  }

  function pick(letter: Letter) {
    const newVal = optimistic === letter ? null : letter;
    setOptimistic(newVal);
    setOpen(false);
    start(async () => {
      const r = await setCompetencyMonthAction({
        studentId, courseAssignmentId, competencyId, periodId,
        field, value: newVal,
      });
      if (!('ok' in r) || !r.ok) {
        // Revert
        setOptimistic(value);
      } else {
        router.refresh();
      }
    });
  }

  const triggerSize = size === 'md' ? 'h-9 min-w-9 px-2 text-sm' : 'h-7 min-w-7 px-1.5 text-xs';
  const valColor = optimistic ? COLORS[optimistic] : `${COLORS['']} border border-dashed border-[var(--border-strong)]`;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`inline-flex items-center justify-center rounded-md font-bold leading-none transition active:scale-95 ${triggerSize} ${valColor}`}
        title={optimistic ? `${optimistic} — ${LABELS[optimistic]}` : 'Calificar'}
      >
        {optimistic ?? '+'}
      </button>
      {open && (
        <div className="absolute z-30 top-full left-0 mt-1 flex gap-0.5 p-1 rounded-lg bg-[var(--card)] border border-[var(--border-strong)] shadow-md">
          {(['AD','A','B','C'] as const).map((L) => (
            <button
              key={L}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); pick(L); }}
              className={`h-7 min-w-8 px-1.5 rounded-md text-xs font-bold leading-none transition ${optimistic === L ? COLORS[L] : `bg-transparent ${HOVER[L]} text-[var(--foreground)]`}`}
              title={`${L} — ${LABELS[L]}`}
            >
              {L}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
