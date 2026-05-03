import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/ui/stat-card';
import { CalendarClock, Lock, Unlock, ListChecks } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { isWindowOpen, windowStatusLabel, SCOPE_LABEL, STATE_LABEL } from '@/lib/grading-window';
import { NewWindowForm } from './new-window-form';
import { WindowActions } from './window-actions';

export default async function CapturaNotasPage() {
  const user = await requireSession();
  if (!['ADMIN', 'DIRECTION', 'SECRETARY'].includes(user.role)) redirect('/dashboard');

  const [windows, periods, sections, courses] = await Promise.all([
    prisma.gradingWindow.findMany({
      include: { period: true },
      orderBy: [{ opensAt: 'desc' }],
    }),
    prisma.period.findMany({ orderBy: { ordinal: 'asc' }, include: { schoolYear: true } }),
    prisma.section.findMany({ include: { grade: true }, orderBy: [{ grade: { ordinal: 'asc' } }, { name: 'asc' }] }),
    prisma.course.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const now = new Date();
  const openCount = windows.filter((w) => isWindowOpen(w, now)).length;
  const scheduledCount = windows.filter((w) => w.state === 'AUTO' && now < w.opensAt).length;
  const closedCount = windows.length - openCount - scheduledCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Captura de notas"
        description="Controla cuándo los docentes pueden registrar y editar calificaciones"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ventanas abiertas" value={openCount} icon={Unlock} tone="success" />
        <StatCard label="Programadas" value={scheduledCount} icon={CalendarClock} tone="default" />
        <StatCard label="Cerradas" value={closedCount} icon={Lock} tone="muted" />
        <StatCard label="Total ventanas" value={windows.length} icon={ListChecks} tone="secondary" />
      </div>

      <NewWindowForm periods={periods.map((p) => ({ id: p.id, name: `${p.name} (${p.schoolYear.name})` }))}
                     sections={sections.map((s) => ({ id: s.id, label: `${s.grade.name} ${s.name}` }))}
                     courses={courses.map((c) => ({ id: c.id, label: c.name }))} />

      <Card>
        <CardHeader>
          <CardTitle>Ventanas configuradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ventana</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Apertura</TableHead>
                <TableHead>Cierre</TableHead>
                <TableHead>Alcance</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {windows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-[var(--muted-foreground)] py-8">
                    Aún no hay ventanas. Crea una con el formulario de arriba.
                  </TableCell>
                </TableRow>
              ) : windows.map((w) => {
                const status = windowStatusLabel(w, now);
                return (
                  <TableRow key={w.id}>
                    <TableCell>
                      <div className="font-medium">{w.name}</div>
                      {w.notes && <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{w.notes}</div>}
                    </TableCell>
                    <TableCell className="text-xs">{w.period.name}</TableCell>
                    <TableCell className="text-xs">{formatDate(w.opensAt)}</TableCell>
                    <TableCell className="text-xs">{formatDateTime(w.closesAt)}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="muted">{SCOPE_LABEL[w.scope]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        status.open ? 'success'
                        : status.reason === 'auto-closed-future' ? 'default'
                        : status.reason === 'forced-closed' ? 'destructive'
                        : 'muted'
                      }>
                        {status.label}
                      </Badge>
                      {w.state !== 'AUTO' && (
                        <div className="text-[10px] text-[var(--muted-foreground)] mt-1">{STATE_LABEL[w.state]}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <WindowActions id={w.id} state={w.state} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
