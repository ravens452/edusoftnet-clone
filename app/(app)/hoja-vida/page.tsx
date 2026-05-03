import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { NewLifeEntryDialog } from './new-entry-dialog';

const TONE: Record<string, 'success' | 'destructive' | 'warning' | 'secondary' | 'muted'> = {
  ACHIEVEMENT: 'success',
  RECOGNITION: 'success',
  COMMENT: 'muted',
  CONDUCT: 'warning',
  INCIDENT: 'destructive',
};
const LABEL: Record<string, string> = {
  ACHIEVEMENT: 'Logro',
  RECOGNITION: 'Reconocimiento',
  COMMENT: 'Comentario',
  CONDUCT: 'Conducta',
  INCIDENT: 'Incidencia',
};

export default async function HojaVidaPage() {
  const user = await requireSession();
  let studentIds: string[] = [];
  if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id } });
    if (s) studentIds = [s.id];
  } else if (user.role === 'PARENT') {
    const p = await prisma.parent.findUnique({ where: { userId: user.id }, include: { children: true } });
    studentIds = p?.children.map((c) => c.studentId) ?? [];
  }
  const where = studentIds.length ? { studentId: { in: studentIds } } : {};
  const entries = await prisma.studentLifeEntry.findMany({
    where,
    include: { student: { include: { user: true } } },
    orderBy: { date: 'desc' },
    take: 50,
  });

  const canCreate = ['TEACHER', 'DIRECTION', 'ADMIN', 'PSYCHOLOGY'].includes(user.role);
  let students: { id: string; label: string }[] = [];
  if (canCreate) {
    const ss = await prisma.student.findMany({
      include: { user: true },
      orderBy: { user: { lastName: 'asc' } },
      take: 200,
    });
    students = ss.map((s) => ({ id: s.id, label: `${s.user.lastName}, ${s.user.firstName}` }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hoja de vida estudiantil"
        description="Logros, incidencias y reconocimientos"
        action={canCreate ? <NewLifeEntryDialog students={students} /> : undefined}
      />
      <div className="space-y-3">
        {entries.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            Sin entradas registradas.
          </CardContent></Card>
        ) : entries.map((e) => (
          <Card key={e.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1">
                    {e.student.user.firstName} {e.student.user.lastName} · {formatDate(e.date)}
                  </div>
                </div>
                <Badge variant={TONE[e.type] || 'muted'}>{LABEL[e.type] || e.type}</Badge>
              </div>
              <p className="text-sm mt-3 whitespace-pre-wrap">{e.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
