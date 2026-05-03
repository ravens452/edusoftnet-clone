'use client';

import { useState } from 'react';
import { LetterPicker, LetterChip, type Letter } from './letter-picker';

const MONTH_LABELS = ['Mes 1', 'Mes 2', 'Mes 3'] as const;

export type AssessmentLite = {
  id: string;
  studentId: string;
  competencyId: string;
  periodId: string;
  m1: Letter; m2: Letter; m3: Letter;
  letterGrade: Letter;
};

export type StudentLite = { id: string; firstName: string; lastName: string };
export type CompetencyLite = { id: string; code: string; name: string };
export type PeriodLite = { id: string; name: string; ordinal: number };

export function CompetencyGradingTable({
  students,
  competencies,
  periods,
  assessments,
  courseAssignmentId,
  canEditByPeriod,
}: {
  students: StudentLite[];
  competencies: CompetencyLite[];
  periods: PeriodLite[];
  assessments: AssessmentLite[];
  courseAssignmentId: string;
  canEditByPeriod: Record<string, boolean>;
}) {
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? '');
  const [selectedComp, setSelectedComp] = useState<string | null>(competencies[0]?.id ?? null);
  const [view, setView] = useState<'desktop' | 'mobile-student'>('desktop');
  const [studentIdx, setStudentIdx] = useState(0);

  if (!periodId || !selectedComp) {
    return <p className="p-4 text-sm text-[var(--muted-foreground)]">Sin competencias / periodos.</p>;
  }
  const canEdit = !!canEditByPeriod[periodId];

  function getAss(studentId: string, competencyId: string) {
    return assessments.find(
      (a) => a.studentId === studentId && a.competencyId === competencyId && a.periodId === periodId,
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar: trimestre + competencia (mobile) + view toggle */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)]">Trimestre:</span>
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriodId(p.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              periodId === p.id
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-transparent border-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >{p.name}</button>
        ))}
        {!canEdit && (
          <span className="text-[10px] text-[var(--muted-foreground)] ml-auto inline-flex items-center gap-1">
            🔒 Ventana de captura cerrada
          </span>
        )}
      </div>

      {/* DESKTOP TABLE — students × competencies */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]/40">
              <tr>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] sticky left-0 bg-[var(--muted)]/40 z-10 min-w-[180px]">
                  Estudiante
                </th>
                {competencies.map((c) => (
                  <th key={c.id} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] min-w-[200px]" title={c.name}>
                    <div>{c.code}</div>
                    <div className="text-[9px] font-medium text-[var(--muted-foreground)]/70 normal-case truncate">{c.name.slice(0, 36)}…</div>
                  </th>
                ))}
                <th className="text-center px-3 py-2.5 text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)]">
                  Trim.
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                // Calcular promedio del estudiante en este trimestre (todas las competencias)
                const compLetters = competencies.map((c) => getAss(s.id, c.id)?.letterGrade ?? null);
                const studentTrimAvg = aggregateLetters(compLetters);
                return (
                  <tr key={s.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2.5 font-medium sticky left-0 bg-[var(--card)]">
                      {s.lastName}, {s.firstName}
                    </td>
                    {competencies.map((c) => {
                      const a = getAss(s.id, c.id);
                      return (
                        <td key={c.id} className="px-3 py-2">
                          <CompetencyMonthsRow
                            studentId={s.id}
                            courseAssignmentId={courseAssignmentId}
                            competencyId={c.id}
                            periodId={periodId}
                            assessment={a}
                            canEdit={canEdit}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center">
                      <LetterChip value={studentTrimAvg} size="md" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE — un estudiante a la vez */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setStudentIdx((i) => Math.max(0, i - 1))}
            disabled={studentIdx === 0}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--muted)] disabled:opacity-40"
          >← Anterior</button>
          <div className="text-xs text-[var(--muted-foreground)] font-semibold">
            {studentIdx + 1} / {students.length}
          </div>
          <button
            type="button"
            onClick={() => setStudentIdx((i) => Math.min(students.length - 1, i + 1))}
            disabled={studentIdx >= students.length - 1}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--muted)] disabled:opacity-40"
          >Siguiente →</button>
        </div>

        {students[studentIdx] && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="font-semibold">
                {students[studentIdx].lastName}, {students[studentIdx].firstName}
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                Trimestre: {periods.find((p) => p.id === periodId)?.name}
              </div>
            </div>
            <div className="p-3 space-y-3">
              {competencies.map((c) => {
                const a = getAss(students[studentIdx].id, c.id);
                return (
                  <div key={c.id} className="rounded-lg bg-[var(--muted)]/40 p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--primary-on-soft)]">{c.code}</div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-tight">{c.name}</div>
                      </div>
                      <LetterChip value={a?.letterGrade} size="md" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {(['m1', 'm2', 'm3'] as const).map((m, i) => (
                        <div key={m} className="flex flex-col items-center gap-1">
                          <span className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">{MONTH_LABELS[i]}</span>
                          <LetterPicker
                            value={a?.[m] ?? null}
                            studentId={students[studentIdx].id}
                            courseAssignmentId={courseAssignmentId}
                            competencyId={c.id}
                            periodId={periodId}
                            field={m}
                            canEdit={canEdit}
                            size="md"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Mini-fila con los 3 meses + el agregado (solo la celda, para uso en tabla desktop) */
function CompetencyMonthsRow({
  studentId, courseAssignmentId, competencyId, periodId,
  assessment, canEdit,
}: {
  studentId: string; courseAssignmentId: string; competencyId: string; periodId: string;
  assessment?: AssessmentLite;
  canEdit: boolean;
}) {
  const months: Array<'m1'|'m2'|'m3'> = ['m1', 'm2', 'm3'];
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {months.map((m) => (
          <LetterPicker
            key={m}
            value={assessment?.[m] ?? null}
            studentId={studentId}
            courseAssignmentId={courseAssignmentId}
            competencyId={competencyId}
            periodId={periodId}
            field={m}
            canEdit={canEdit}
            size="sm"
          />
        ))}
      </div>
      <span className="mx-1 text-[var(--muted-foreground)]">→</span>
      <LetterChip value={assessment?.letterGrade} size="md" />
    </div>
  );
}

// Helper aggregator (mismo que server)
function aggregateLetters(letters: (string | null | undefined)[]): Letter {
  const VAL: Record<string, number> = { AD: 4, A: 3, B: 2, C: 1 };
  const REV: Record<number, Letter> = { 4: 'AD', 3: 'A', 2: 'B', 1: 'C' };
  const valid = letters.filter((l): l is keyof typeof VAL => !!l && l in VAL);
  if (!valid.length) return null;
  const avg = valid.reduce((s, l) => s + VAL[l], 0) / valid.length;
  return REV[Math.round(avg)] ?? null;
}
