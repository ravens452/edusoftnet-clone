import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const TYPE_LABEL: Record<string, string> = {
  HOMEWORK: 'Tarea',
  PROJECT: 'Proyecto',
  QUIZ: 'Evaluación',
  EXAM: 'Examen',
  PRACTICE: 'Práctica',
  FORUM: 'Foro',
};

export default async function EclassPage() {
  const user = await requireSession();

  if (user.role === 'TEACHER') {
    const t = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (!t) return <div>Sin perfil</div>;
    const assignments = await prisma.assignment.findMany({
      where: { courseAssignment: { teacherId: t.id } },
      include: {
        courseAssignment: { include: { course: true, section: { include: { grade: true } } } },
        submissions: true,
      },
      orderBy: { dueDate: 'desc' },
      take: 50,
    });
    return (
      <div className="space-y-6">
        <PageHeader title="eclass" description="Tareas y entregas de tus cursos" />
        <div className="grid md:grid-cols-2 gap-4">
          {assignments.map((a) => {
            const total = a.submissions.length;
            const submitted = a.submissions.filter((s) => s.status !== 'PENDING').length;
            const graded = a.submissions.filter((s) => s.status === 'GRADED').length;
            return (
              <Link key={a.id} href={`/eclass/${a.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      <Badge variant="outline">{TYPE_LABEL[a.type]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="text-[var(--muted-foreground)]">
                      {a.courseAssignment.course.name} · {a.courseAssignment.section.grade.name} "{a.courseAssignment.section.name}"
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Badge variant="muted">Entrega: {formatDate(a.dueDate)}</Badge>
                      <span>{submitted}/{total} entregas</span>
                      <span>{graded} calificadas</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Student / Parent: lista de tareas
  const studentIds: string[] = [];
  if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id } });
    if (s) studentIds.push(s.id);
  } else if (user.role === 'PARENT') {
    const p = await prisma.parent.findUnique({ where: { userId: user.id }, include: { children: true } });
    if (p) studentIds.push(...p.children.map((c) => c.studentId));
  }

  const submissions = await prisma.submission.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      assignment: { include: { courseAssignment: { include: { course: true } } } },
      student: { include: { user: true } },
    },
    orderBy: { assignment: { dueDate: 'asc' } },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="eclass" description="Tareas y entregas" />
      <Card>
        <CardContent className="p-0 divide-y divide-[var(--border)]">
          {submissions.map((s) => (
            <div key={s.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{s.assignment.title}</div>
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {s.assignment.courseAssignment.course.name} · {s.student.user.firstName}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-[var(--muted-foreground)]">{formatDate(s.assignment.dueDate)}</span>
                <Badge
                  variant={
                    s.status === 'GRADED' ? 'success' :
                    s.status === 'SUBMITTED' ? 'secondary' :
                    s.status === 'LATE' ? 'destructive' :
                    s.status === 'PENDING' ? 'warning' : 'muted'
                  }
                >
                  {s.status === 'GRADED' ? `${s.score?.toFixed(1)} pts` :
                   s.status === 'SUBMITTED' ? 'Entregada' :
                   s.status === 'PENDING' ? 'Pendiente' :
                   s.status === 'LATE' ? 'Tardía' : s.status}
                </Badge>
              </div>
            </div>
          ))}
          {submissions.length === 0 && (
            <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Sin tareas asignadas.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
