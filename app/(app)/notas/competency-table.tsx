'use client';

import { useState } from 'react';
import { LetterPicker, LetterChip, type Letter } from './letter-picker';

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

// Meses por trimestre (sistema escolar peruano)
const MONTHS_BY_TRIMESTER: Record<number, [string, string, string]> = {
  1: ['Marzo', 'Abril', 'Mayo'],
  2: ['Junio', 'Julio', 'Agosto'],
  3: ['Setiembre', 'Octubre', 'Noviembre'],
};

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
  const [competencyId, setCompetencyId] = useState(competencies[0]?.id ?? '');

  if (!periodId || !competencyId) {
    return <p className="p-4 text-sm text-[var(--muted-foreground)]">Sin competencias / periodos.</p>;
  }
  const canEdit = !!canEditByPeriod[periodId];
  const period = periods.find((p) => p.id === periodId);
  const competency = competencies.find((c) => c.id === competencyId);
  const months = period ? MONTHS_BY_TRIMESTER[period.ordinal] || ['Mes 1', 'Mes 2', 'Mes 3'] : ['Mes 1','Mes 2','Mes 3'];

  function getAss(studentId: string, compId: string) {
    return assessments.find(
      (a) => a.studentId === studentId && a.competencyId === compId && a.periodId === periodId,
    );
  }

  return (
    <div className="space-y-4">
      {/* SELECTOR 1: Trimestre */}
      <div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] mb-1.5">Trimestre</div>
        <div className="flex flex-wrap gap-1.5">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodId(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                periodId === p.id
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}
            >{p.name}</button>
          ))}
          {!canEdit && (
            <span className="text-[10px] text-[var(--muted-foreground)] inline-flex items-center gap-1 ml-auto">
              🔒 Ventana cerrada — solo lectura
            </span>
          )}
        </div>
      </div>

      {/* SELECTOR 2: Competencia */}
      <div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] mb-1.5">Competencia a evaluar</div>
        <div className="flex flex-wrap gap-1.5">
          {competencies.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCompetencyId(c.id)}
              title={c.name}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                competencyId === c.id
                  ? 'bg-[var(--secondary)] text-white border-[var(--secondary)]'
                  : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}
            >{c.code}</button>
          ))}
        </div>
        {competency && (
          <p className="mt-2 text-xs text-[var(--muted-foreground)] leading-snug">
            <strong className="text-[var(--foreground)]">{competency.code}</strong> — {competency.name}
          </p>
        )}
      </div>

      {/* TABLA: estudiantes × meses × trimestre auto */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {/* DESKTOP */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]/40">
              <tr>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] sticky left-0 bg-[var(--muted)]/40 z-10 min-w-[180px]">Estudiante</th>
                {months.map((m) => (
                  <th key={m} className="text-center px-3 py-2.5 text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] min-w-[90px]">{m}</th>
                ))}
                <th className="text-center px-3 py-2.5 text-[10px] uppercase tracking-wider font-bold text-[var(--primary)] min-w-[90px] bg-[var(--soft-blue)]/40">
                  Trimestre
                  <div className="text-[8px] text-[var(--muted-foreground)] normal-case font-normal mt-0.5">(automático)</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const a = getAss(s.id, competencyId);
                return (
                  <tr key={s.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/20">
                    <td className="px-4 py-2.5 font-medium sticky left-0 bg-[var(--card)]">{s.lastName}, {s.firstName}</td>
                    {(['m1','m2','m3'] as const).map((m) => (
                      <td key={m} className="px-3 py-2 text-center">
                        <LetterPicker
                          value={a?.[m] ?? null}
                          studentId={s.id}
                          courseAssignmentId={courseAssignmentId}
                          competencyId={competencyId}
                          periodId={periodId}
                          field={m}
                          canEdit={canEdit}
                          size="md"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center bg-[var(--soft-blue)]/20">
                      <LetterChip value={a?.letterGrade} size="md" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE */}
        <div className="md:hidden divide-y divide-[var(--border)]">
          {students.map((s) => {
            const a = getAss(s.id, competencyId);
            return (
              <div key={s.id} className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-sm min-w-0 truncate">{s.lastName}, {s.firstName}</div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">Trim:</span>
                    <LetterChip value={a?.letterGrade} size="md" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['m1','m2','m3'] as const).map((m, i) => (
                    <div key={m} className="flex flex-col items-center gap-1 bg-[var(--muted)]/40 rounded-lg p-2">
                      <span className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-semibold">{months[i]}</span>
                      <LetterPicker
                        value={a?.[m] ?? null}
                        studentId={s.id}
                        courseAssignmentId={courseAssignmentId}
                        competencyId={competencyId}
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

      {/* RESUMEN: promedio del trimestre por estudiante (todas las competencias) */}
      {competencies.length > 1 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3 sm:p-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] mb-2">
            Promedio del trimestre por estudiante (todas las competencias)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {students.map((s) => {
              const lettersAll = competencies.map((c) => getAss(s.id, c.id)?.letterGrade ?? null);
              const trimAvg = aggregateLetters(lettersAll);
              return (
                <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                  <span className="text-xs truncate">{s.lastName}, {s.firstName}</span>
                  <LetterChip value={trimAvg} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function aggregateLetters(letters: (string | null | undefined)[]): Letter {
  const VAL: Record<string, number> = { AD: 4, A: 3, B: 2, C: 1 };
  const REV: Record<number, Letter> = { 4: 'AD', 3: 'A', 2: 'B', 1: 'C' };
  const valid = letters.filter((l): l is keyof typeof VAL => !!l && l in VAL);
  if (!valid.length) return null;
  const avg = valid.reduce((s, l) => s + VAL[l], 0) / valid.length;
  return REV[Math.round(avg)] ?? null;
}
