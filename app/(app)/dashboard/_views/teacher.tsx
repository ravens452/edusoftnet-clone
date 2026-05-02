import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Users, BookOpen, ClipboardList, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default async function TeacherDashboard({ userId, firstName }: { userId: string; firstName: string }) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) return <div>Sin perfil docente</div>;

  const [assignments, pendingSubs, todaySchedule, recentLessons] = await Promise.all([
    prisma.courseAssignment.findMany({
      where: { teacherId: teacher.id },
      include: { course: true, section: { include: { grade: true } } },
    }),
    prisma.submission.count({ where: { status: 'SUBMITTED', assignment: { courseAssignment: { teacherId: teacher.id } } } }),
    prisma.scheduleSlot.findMany({
      where: { courseAssignment: { teacherId: teacher.id }, weekday: new Date().getDay() },
      include: { courseAssignment: { include: { course: true, section: { include: { grade: true } } } } },
      orderBy: { startTime: 'asc' },
    }),
    prisma.lessonSession.findMany({
      where: { courseAssignment: { teacherId: teacher.id } },
      orderBy: { date: 'desc' },
      take: 5,
      include: { courseAssignment: { include: { course: true, section: { include: { grade: true } } } } },
    }),
  ]);

  const sectionIds = [...new Set(assignments.map((a) => a.sectionId))];
  const studentCount = await prisma.enrollment.count({ where: { sectionId: { in: sectionIds } } });

  return (
    <div className="space-y-6">
      <PageHeader title={`Hola, ${firstName} 👋`} description="Tu jornada de hoy" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cursos asignados" value={assignments.length} icon={BookOpen} />
        <StatCard label="Estudiantes" value={studentCount} icon={Users} />
        <StatCard label="Entregas por revisar" value={pendingSubs} icon={ClipboardList} tone={pendingSubs > 0 ? 'warning' : 'success'} />
        <StatCard label="Clases hoy" value={todaySchedule.length} icon={Calendar} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Horario de hoy ({WEEKDAYS[new Date().getDay()]})</CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No tienes clases hoy.</p>
            ) : (
              <ul className="space-y-2">
                {todaySchedule.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{s.startTime} – {s.endTime}</Badge>
                      <span className="font-medium">{s.courseAssignment.course.name}</span>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {s.courseAssignment.section.grade.name} "{s.courseAssignment.section.name}" · {s.classroom}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {assignments.map((a) => (
                <li key={a.id} className="flex justify-between border-b last:border-0 border-[var(--border)] py-1.5">
                  <span className="font-medium">{a.course.name}</span>
                  <span className="text-[var(--muted-foreground)]">{a.section.grade.name} "{a.section.name}"</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lecciones recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {recentLessons.map((l) => (
              <li key={l.id} className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{l.topic}</span>
                  <span className="text-[var(--muted-foreground)]"> · {l.courseAssignment.course.name}</span>
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">{formatDate(l.date)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
