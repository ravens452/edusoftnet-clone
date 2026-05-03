import { Lock, Unlock, CalendarClock } from 'lucide-react';
import { prisma } from '@/lib/db';
import { isWindowOpen, windowStatusLabel } from '@/lib/grading-window';
import { formatDateTime } from '@/lib/utils';

/**
 * Banner mostrado a docentes en /notas con el estado actual de las ventanas
 * de captura. Si hay alguna abierta, lo muestra en verde con la fecha de cierre.
 */
export async function GradingWindowBanner() {
  const now = new Date();
  const windows = await prisma.gradingWindow.findMany({
    include: { period: true },
    orderBy: [{ opensAt: 'desc' }],
  });
  const open = windows.filter((w) => isWindowOpen(w, now));
  const upcoming = windows.filter((w) => w.state === 'AUTO' && now < w.opensAt).slice(0, 1);

  if (open.length > 0) {
    const w = open[0];
    const status = windowStatusLabel(w, now);
    return (
      <div className="rounded-2xl border border-[var(--success)]/20 bg-[var(--soft-success)] px-5 py-4 flex items-start gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[var(--success)]/15 grid place-items-center shrink-0">
          <Unlock className="h-5 w-5 text-[var(--success)]" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#136336]">
            Captura de notas abierta
          </div>
          <div className="text-sm text-[#136336]/85 mt-0.5">
            <span className="font-medium">{w.name}</span>
            {' · '}
            cierra el <strong>{formatDateTime(w.closesAt)}</strong>
            {status.reason === 'forced-open' && ' (mantenida abierta por administración)'}
          </div>
          {open.length > 1 && (
            <div className="text-xs text-[#136336]/70 mt-1">
              + {open.length - 1} ventana{open.length > 2 ? 's' : ''} más abiertas
            </div>
          )}
          {w.notes && <div className="text-xs text-[#136336]/70 mt-1 italic">{w.notes}</div>}
        </div>
      </div>
    );
  }

  // Cerrada — muestra próxima si la hay
  if (upcoming.length > 0) {
    const w = upcoming[0];
    return (
      <div className="rounded-2xl border border-[var(--brand-blue)]/20 bg-[var(--soft-blue)] px-5 py-4 flex items-start gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[var(--brand-blue)]/12 grid place-items-center shrink-0">
          <CalendarClock className="h-5 w-5 text-[var(--brand-blue)]" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[var(--brand-blue)]">
            Captura de notas cerrada
          </div>
          <div className="text-sm text-[var(--brand-blue)]/85 mt-0.5">
            Próxima apertura: <strong>{w.name}</strong> — <strong>{formatDateTime(w.opensAt)}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--muted)] px-5 py-4 flex items-start gap-3 mb-6">
      <div className="h-10 w-10 rounded-xl bg-[var(--muted-foreground)]/10 grid place-items-center shrink-0">
        <Lock className="h-5 w-5 text-[var(--muted-foreground)]" strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[var(--foreground)]">
          Captura de notas cerrada
        </div>
        <div className="text-sm text-[var(--muted-foreground)] mt-0.5">
          La administración no ha programado una próxima ventana. Comunícate con Coordinación Académica.
        </div>
      </div>
    </div>
  );
}
