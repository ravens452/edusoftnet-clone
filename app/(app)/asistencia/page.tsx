import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, AlertCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { RollCallDialog } from './mark-roll-call';

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = user.role === 'TEACHER'
      ? { courseAssignments: { some: { teacher: { userId: user.id } } } }
      : {};
    const sections = await prisma.section.findMany({
      where,
      include: {
        grade: true,
        _count: { select: { enrollments: true } },
        enrollments: { include: { student: { include: { user: true } } }, orderBy: { student: { user: { lastName: 'asc' } } } },
      },
      take: 30,
    });
    const rollCallSections = sections.map((s) => ({
      id: s.id,
      label: `${s.grade.name} "${s.name}"`,
      students: s.enrollments.map((e) => ({ id: e.studentId, label: `${e.student.user.lastName}, ${e.student.user.firstName}` })),
    }));

    // Pre-fetch attendance counts por sección
    const cards = await Promise.all(
      sections.map(async (s) => {
        const records = await prisma.attendanceRecord.findMany({ where: { sectionId: s.id, date: today } });
        return {
          id: s.id,
          gradeName: s.grade.name,
          sectionName: s.name,
          enrolled: s._count.enrollments,
          present: records.filter((r) => r.status === 'PRESENT').length,
          late: records.filter((r) => r.status === 'LATE').length,
          absent: records.filter((r) => r.status === 'ABSENT').length,
        };
      })
    );

    return (
      <div className="space-y-6">
        <PageHeader
          title="Asistencia (onTime)"
          description="Control diario por sección"
          action={rollCallSections.length ? <RollCallDialog sections={rollCallSections} /> : undefined}
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] col-span-full">Sin secciones asignadas.</p>
          ) : cards.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-base">{c.gradeName} "{c.sectionName}"</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Matriculados</span>
                  <span className="font-semibold">{c.enrolled}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Presentes hoy</span>
                  <Badge variant="success">{c.present}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Tardanzas</span>
                  <Badge variant="warning">{c.late}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Ausentes</span>
                  <Badge variant="destructive">{c.absent}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Student / Parent
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: { user: true, enrollments: { include: { section: { include: { grade: true } } } } },
  });

  // Pre-fetch últimos 60 días por alumno
  const blocks = await Promise.all(
    students.map(async (s) => {
      const records = await prisma.attendanceRecord.findMany({
        where: { studentId: s.id }, orderBy: { date: 'desc' }, take: 60,
      });
      const total = records.length;
      const present = records.filter((r) => r.status === 'PRESENT').length;
      const late = records.filter((r) => r.status === 'LATE').length;
      const absent = records.filter((r) => r.status === 'ABSENT').length;
      const rate = total ? Math.round(((present + late) / total) * 100) : 0;
      return { student: s, records, total, present, late, absent, rate };
    })
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Asistencia" description="Registro diario" />
      {blocks.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">Sin datos.</p>
      ) : blocks.map((b) => (
        <div key={b.student.id} className="space-y-4">
          {blocks.length > 1 && (
            <h2 className="text-lg font-semibold">{b.student.user.firstName} {b.student.user.lastName}</h2>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Asistencia" value={`${b.rate}%`} icon={CalendarCheck} tone={b.rate >= 90 ? 'success' : 'warning'} />
            <StatCard label="Presentes" value={b.present} icon={CalendarCheck} tone="success" />
            <StatCard label="Tardanzas" value={b.late} icon={Clock} tone="warning" />
            <StatCard label="Ausencias" value={b.absent} icon={AlertCircle} tone="destructive" />
          </div>
          <Card>
            <CardHeader><CardTitle>Últimos 60 días</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5">
                {b.records.map((r) => {
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
      ))}
    </div>
  );
}
