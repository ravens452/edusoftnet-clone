import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Wallet, Users, AlertCircle, Bell } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function ParentDashboard({ userId, firstName }: { userId: string; firstName: string }) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: {
      children: {
        include: {
          student: {
            include: { user: true, enrollments: { include: { section: { include: { grade: true } } } } },
          },
        },
      },
    },
  });
  if (!parent) return <div>Sin perfil de padre</div>;

  const studentIds = parent.children.map((c) => c.studentId);
  const [pendingInvoices, recentScores, recentAttendance, unread] = await Promise.all([
    prisma.invoice.findMany({ where: { studentId: { in: studentIds }, status: { in: ['PENDING', 'OVERDUE'] } }, include: { student: { include: { user: true } } }, orderBy: { dueDate: 'asc' }, take: 5 }),
    prisma.score.findMany({ where: { studentId: { in: studentIds } }, orderBy: { evaluatedAt: 'desc' }, take: 8, include: { student: { include: { user: true } }, courseAssignment: { include: { course: true } } } }),
    prisma.attendanceRecord.findMany({ where: { studentId: { in: studentIds }, status: { in: ['ABSENT', 'LATE', 'EXCUSED'] } }, orderBy: { date: 'desc' }, take: 6, include: { student: { include: { user: true } } } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  const totalPending = pendingInvoices.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={`Hola, ${firstName} 👋`} description="Resumen de tus hijos" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Hijos activos" value={parent.children.length} icon={Users} />
        <StatCard label="Pagos pendientes" value={pendingInvoices.length} icon={Wallet} tone={pendingInvoices.length > 0 ? 'warning' : 'success'} />
        <StatCard label="Por pagar" value={formatCurrency(totalPending)} icon={Wallet} tone="default" />
        <StatCard label="Notificaciones" value={unread} icon={Bell} tone="secondary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis hijos</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {parent.children.map((c) => {
            const enr = c.student.enrollments[0];
            return (
              <Link
                key={c.studentId}
                href={`/hijos/${c.studentId}`}
                className="rounded-lg border border-[var(--border)] p-4 hover:bg-[var(--muted)]/30 transition-colors"
              >
                <div className="font-semibold">{c.student.user.firstName} {c.student.user.lastName}</div>
                <div className="text-xs text-[var(--muted-foreground)] mt-1">
                  {enr ? `${enr.section.grade.name} "${enr.section.name}"` : 'Sin matrícula'} · {c.student.studentCode}
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pagos pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingInvoices.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">Sin pagos pendientes 🎉</p>
            ) : (
              <ul className="space-y-3">
                {pendingInvoices.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-2 text-sm">
                    <div>
                      <div className="font-medium">{i.concept}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{i.student.user.firstName} {i.student.user.lastName} · vence {formatDate(i.dueDate)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(i.amount)}</div>
                      <Badge variant={i.status === 'OVERDUE' ? 'destructive' : 'warning'} className="mt-1">
                        {i.status === 'OVERDUE' ? 'Vencido' : 'Pendiente'}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[var(--warning)]" /> Asistencia reciente con incidencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAttendance.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">Sin incidencias.</p>
            ) : (
              <ul className="space-y-2">
                {recentAttendance.map((a) => (
                  <li key={a.id} className="text-sm flex items-center justify-between">
                    <span>
                      {a.student.user.firstName} {a.student.user.lastName}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant={a.status === 'ABSENT' ? 'destructive' : a.status === 'LATE' ? 'warning' : 'muted'}>
                        {a.status === 'ABSENT' ? 'Ausente' : a.status === 'LATE' ? 'Tardanza' : 'Justificada'}
                      </Badge>
                      <span className="text-xs text-[var(--muted-foreground)]">{formatDate(a.date)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas calificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recentScores.map((s) => (
              <li key={s.id} className="text-sm flex items-center justify-between">
                <div>
                  <span className="font-medium">{s.student.user.firstName}</span>
                  <span className="text-[var(--muted-foreground)]"> · {s.courseAssignment.course.name}</span>
                </div>
                <span className="font-semibold">{s.value.toFixed(1)} {s.letterGrade && <Badge variant="outline" className="ml-2">{s.letterGrade}</Badge>}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
