import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export default async function HorarioPage() {
  const user = await requireSession();

  let where: any = {};
  if (user.role === 'TEACHER') {
    const t = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (t) where = { courseAssignment: { teacherId: t.id } };
  } else if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id }, include: { enrollments: true } });
    if (s) where = { courseAssignment: { sectionId: { in: s.enrollments.map((e) => e.sectionId) } } };
  }

  const slots = await prisma.scheduleSlot.findMany({
    where,
    include: {
      courseAssignment: {
        include: { course: true, teacher: { include: { user: true } }, section: { include: { grade: true } } },
      },
    },
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
  });

  const grid = WEEKDAYS.map((label, idx) => ({
    label,
    weekday: idx + 1,
    slots: slots.filter((s) => s.weekday === idx + 1),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Horario" description="Cronograma semanal" />
      <div className="grid md:grid-cols-5 gap-3">
        {grid.map((d) => (
          <Card key={d.label}>
            <CardContent className="p-3">
              <div className="font-semibold text-sm mb-3">{d.label}</div>
              <div className="space-y-2">
                {d.slots.length === 0 && <div className="text-xs text-[var(--muted-foreground)]">Sin clases</div>}
                {d.slots.map((s) => (
                  <div key={s.id} className="rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/20 p-2 text-xs">
                    <div className="font-mono text-[var(--primary)]">{s.startTime} – {s.endTime}</div>
                    <div className="font-medium mt-1">{s.courseAssignment.course.name}</div>
                    {user.role === 'STUDENT' ? (
                      <div className="text-[var(--muted-foreground)]">
                        {s.courseAssignment.teacher.user.firstName} {s.courseAssignment.teacher.user.lastName}
                      </div>
                    ) : (
                      <div className="text-[var(--muted-foreground)]">
                        {s.courseAssignment.section.grade.name} "{s.courseAssignment.section.name}" · {s.classroom}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
