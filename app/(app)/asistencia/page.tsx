import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, AlertCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const STATUS_LABEL: Record<string, { label: string; tone: 'success' | 'destructive' | 'warning' | 'muted' }> = {
  PRESENT: { label: 'Presente', tone: 'success' },
  ABSENT: { label: 'Ausente', tone: 'destructive' },
  LATE: { label: 'Tardanza', tone: 'warning' },
  EXCUSED: { label: 'Justificada', tone: 'muted' },
  EARLY_LEAVE: { label: 'Salida anticipada', tone: 'muted' },
};

export default async function AsistenciaPage() {
  const user = await requireSession();
  const studentIds: string[] = [];

  if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id } });
    if (s) studentIds.push(s.id);
  } else if (user.role === 'PARENT') {
    const p = await prisma.parent.findUnique({ where: { userId: user.id }, include: { children: true } });
    if (p) studentIds.push(...p.children.map((c) => c.studentId));
  }

  if (user.role === 'TEACHER' || user.role === 'DIRECTION' || user.role === 'ADMIN') {
    // Vista por sección
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = user.role === 'TEACHER'
      ? { courseAssignments: { some: { teacher: { userId: user.id } } } }
      : {};
    const sections = await prisma.section.findMany({
      where, include: { grade: true, _count: { select: { enrollments: true } } }, take: 30,
    });

    return (
      <div className="space-y-6">
        <PageHeader title="Asistencia (onTime)" description="Control diario por sección" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(async (s) => {
            const records = await prisma.attendanceRecord.findMany({
              where: { sectionId: s.id, date: today },
            });
            const present = records.filter((r) => r.status === 'PRESENT').length;
            const late = records.filter((r) => r.status === 'LATE').length;
            const absent = records.filter((r) => r.status === 'ABSENT').length;
            return (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle className="text-base">{s.grade.name} "{s.name}"</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Matriculados</span>
                    <span className="font-semibold">{s._count.enrollments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Presentes hoy</span>
                    <Badge variant="success">{present}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Tardanzas</span>
                    <Badge variant="warning">{late}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Ausentes</span>
                    <Badge variant="destructive">{absent}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Student / Parent
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: { user: true, enrollments: { include: { section: { include: { grade: true } } } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Asistencia" description="Registro diario" />

      {students.map(async (s) => {
        const records = await prisma.attendanceRecord.findMany({
          where: { studentId: s.id }, orderBy: { date: 'desc' }, take: 60,
        });
        const total = records.length;
        const present = records.filter((r) => r.status === 'PRESENT').length;
        const late = records.filter((r) => r.status === 'LATE').length;
        const absent = records.filter((r) => r.status === 'ABSENT').length;
        const rate = total ? Math.round(((present + late) / total) * 100) : 0;

        return (
          <div key={s.id} className="space-y-4">
            {students.length > 1 && (
              <h2 className="text-lg font-semibold">{s.user.firstName} {s.user.lastName}</h2>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Asistencia" value={`${rate}%`} icon={CalendarCheck} tone={rate >= 90 ? 'success' : 'warning'} />
              <StatCard label="Presentes" value={present} icon={CalendarCheck} tone="success" />
              <StatCard label="Tardanzas" value={late} icon={Clock} tone="warning" />
              <StatCard label="Ausencias" value={absent} icon={AlertCircle} tone="destructive" />
            </div>
            <Card>
              <CardHeader><CardTitle>Últimos 60 días</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1.5">
                  {records.map((r) => {
                    const tone = STATUS_LABEL[r.status]?.tone || 'muted';
                    const bg = tone === 'success' ? 'bg-[var(--success)]/30' :
                               tone === 'destructive' ? 'bg-[var(--destructive)]/40' :
                               tone === 'warning' ? 'bg-[var(--warning)]/40' : 'bg-[var(--muted)]';
                    return (
                      <div
                        key={r.id}
                        className={`h-8 rounded ${bg} text-[10px] grid place-items-center font-medium`}
                        title={`${formatDate(r.date)} — ${STATUS_LABEL[r.status]?.label}`}
                      >
                        {new Date(r.date).getDate()}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
