import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { NewWorkshopDialog, EnrollWorkshopButton } from './dialogs';

export default async function TalleresPage() {
  const user = await requireSession();
  const workshops = await prisma.workshop.findMany({
    include: {
      teacher: { include: { user: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { name: 'asc' },
  });

  const isAdmin = ['DIRECTION', 'ADMIN'].includes(user.role);
  let teachers: { id: string; label: string }[] = [];
  let myStudents: { id: string; label: string }[] = [];
  if (isAdmin) {
    const ts = await prisma.teacher.findMany({ include: { user: true }, orderBy: { user: { lastName: 'asc' } }, take: 100 });
    teachers = ts.map((t) => ({ id: t.id, label: `${t.user.lastName}, ${t.user.firstName}` }));
  }
  // Estudiantes que el usuario puede inscribir: hijos si es padre, sí mismo si es alumno, todos si admin/secretaría
  if (user.role === 'PARENT') {
    const p = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: { children: { include: { student: { include: { user: true } } } } },
    });
    myStudents = p?.children.map((c) => ({
      id: c.studentId,
      label: c.student ? `${c.student.user.firstName} ${c.student.user.lastName}` : c.studentId,
    })) ?? [];
  } else if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id }, include: { user: true } });
    if (s) myStudents = [{ id: s.id, label: `${s.user.firstName} ${s.user.lastName}` }];
  } else if (['DIRECTION', 'ADMIN', 'SECRETARY'].includes(user.role)) {
    const ss = await prisma.student.findMany({ include: { user: true }, orderBy: { user: { lastName: 'asc' } }, take: 200 });
    myStudents = ss.map((s) => ({ id: s.id, label: `${s.user.lastName}, ${s.user.firstName}` }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Talleres"
        description="Actividades extracurriculares"
        action={isAdmin ? <NewWorkshopDialog teachers={teachers} /> : undefined}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workshops.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] col-span-full">Sin talleres.</p>
        ) : workshops.map((w) => {
          const full = w._count.enrollments >= w.capacity;
          return (
            <Card key={w.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-[var(--secondary)]" /> {w.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {w.description && <p className="text-[var(--muted-foreground)]">{w.description}</p>}
                <div className="flex items-center justify-between text-xs">
                  <span>{w.schedule || '—'}</span>
                  <Badge variant={full ? 'destructive' : 'outline'}>{w._count.enrollments}/{w.capacity}</Badge>
                </div>
                {w.teacher && (
                  <div className="text-xs text-[var(--muted-foreground)]">
                    A cargo de {w.teacher.user.firstName} {w.teacher.user.lastName}
                  </div>
                )}
                {!full && myStudents.length > 0 && (
                  <div className="pt-2">
                    <EnrollWorkshopButton workshopId={w.id} workshopName={w.name} students={myStudents} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
