'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setCompetencyMonthAction } from './competency-actions';

export type Letter = 'AD' | 'A' | 'B' | 'C' | null;

const COLORS: Record<string, string> = {
  AD: 'bg-[var(--success)] text-white border-[var(--success)]',
  A:  'bg-[var(--brand-blue)] text-white border-[var(--brand-blue)]',
  B:  'bg-[var(--warning)] text-white border-[var(--warning)]',
  C:  'bg-[var(--destructive)] text-white border-[var(--destructive)]',
};
const LABELS: Record<string, string> = {
  AD: 'AD · Logro destacado',
  A:  'A · Logro esperado',
  B:  'B · En proceso',
  C:  'C · En inicio',
};

export function LetterChip({ value, size = 'sm' }: { value: Letter | undefined; size?: 'xs' | 'sm' | 'md' }) {
  const sizeCls = size === 'xs' ? 'h-6 w-6 text-[10px]' : size === 'md' ? 'h-9 min-w-9 px-2 text-sm' : 'h-7 min-w-7 px-1.5 text-xs';
  const cls = value ? COLORS[value] : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]';
  return (
    <span
      title={value ? LABELS[value] : 'Sin calificar'}
      className={`inline-flex items-center justify-center rounded-md font-bold leading-none border ${sizeCls} ${cls}`}
    >
      {value ?? '—'}
    </span>
  );
}

/**
 * Picker de letra MINEDU usando un <select> nativo.
 * Súper intuitivo en mobile (toca → aparece picker del sistema).
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
  const [pending, setPending] = useState(false);

  if (!canEdit) {
    return <LetterChip value={optimistic} size={size} />;
  }

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = (e.target.value || null) as Letter;
    setOptimistic(next);
    setPending(true);
    start(async () => {
      const r = await setCompetencyMonthAction({
        studentId, courseAssignmentId, competencyId, periodId, field, value: next,
      });
      setPending(false);
      if (!('ok' in r) || !r.ok) {
        setOptimistic(value);
      } else {
        router.refresh();
      }
    });
  }

  const sizeCls = size === 'md'
    ? 'h-9 min-w-[44px] text-sm'
    : 'h-7 min-w-[36px] text-xs';
  const colorCls = optimistic
    ? COLORS[optimistic]
    : 'bg-[var(--card)] text-[var(--muted-foreground)] border-dashed border-[var(--border-strong)]';

  return (
    <div className={`relative inline-block ${pending ? 'opacity-60' : ''}`}>
      <select
        value={optimistic ?? ''}
        onChange={onChange}
        disabled={pending}
        title={optimistic ? LABELS[optimistic] : 'Calificar'}
        aria-label="Calificación MINEDU"
        className={`appearance-none rounded-md font-bold leading-none border px-2 pr-5 cursor-pointer transition active:scale-95 ${sizeCls} ${colorCls}`}
        style={{
          // Flecha del select pintada con SVG inline para que se vea consistente en color
          backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\' viewBox=\'0 0 8 8\'%3e%3cpath fill=\'currentColor\' d=\'M4 6L0 2h8z\'/%3e%3c/svg%3e")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: `right 4px center`,
          paddingRight: '14px',
        }}
      >
        <option value="">—</option>
        <option value="AD">AD</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
      </select>
    </div>
  );
}
