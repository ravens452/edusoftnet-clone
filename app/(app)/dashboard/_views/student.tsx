import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, GraduationCap, BookOpen, Bell } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function StudentDashboard({ userId, firstName }: { userId: string; firstName: string }) {
  const student = await prisma.student.findUnique({ where: { userId }, include: { enrollments: { include: { section: { include: { grade: true } } } } } });
  if (!student) return <div>Sin perfil de estudiante</div>;

  const enr = student.enrollments[0];
  const [scoresAvg, attendance30, pendingTasks, unread, latestAnnouncements] = await Promise.all([
    prisma.score.aggregate({ where: { studentId: student.id }, _avg: { value: true } }),
    prisma.attendanceRecord.findMany({ where: { studentId: student.id }, orderBy: { date: 'desc' }, take: 30 }),
    prisma.submission.count({ where: { studentId: student.id, status: 'PENDING' } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.announcement.findMany({ orderBy: { publishedAt: 'desc' }, take: 5 }),
  ]);

  const present = attendance30.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const attRate = attendance30.length ? Math.round((present / attendance30.length) * 100) : 0;

  const upcoming = await prisma.assignment.findMany({
    where: { courseAssignment: { sectionId: enr?.sectionId }, dueDate: { gte: new Date() } },
    orderBy: { dueDate: 'asc' },
    take: 5,
    include: { courseAssignment: { include: { course: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${firstName} 👋`}
        description={enr ? `${enr.section.grade.name} "${enr.section.name}" — ${student.studentCode}` : 'Sin matrícula activa'}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Promedio" value={scoresAvg._avg.value?.toFixed(1) ?? '—'} icon={GraduationCap} tone="default" />
        <StatCard label="Asistencia 30 días" value={`${attRate}%`} icon={CalendarCheck} tone={attRate >= 90 ? 'success' : 'warning'} />
        <StatCard label="Tareas pendientes" value={pendingTasks} icon={BookOpen} tone={pendingTasks > 0 ? 'warning' : 'success'} />
        <StatCard label="Notificaciones" value={unread} icon={Bell} tone="secondary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Próximas tareas</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No tienes tareas próximas 🎉</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-2 text-sm">
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{a.courseAssignment.course.name}</div>
                    </div>
                    <Badge variant="outline">{formatDate(a.dueDate)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos comunicados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {latestAnnouncements.map((a) => (
                <li key={a.id} className="text-sm">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{formatDate(a.publishedAt)}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
