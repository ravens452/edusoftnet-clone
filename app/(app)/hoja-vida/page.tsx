import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

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

  return (
    <div className="space-y-6">
      <PageHeader title="Hoja de vida estudiantil" description="Logros, incidencias y reconocimientos" />
      <div className="space-y-3">
        {entries.map((e) => (
          <Card key={e.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1">
                    {e.student.user.firstName} {e.student.user.lastName} · {formatDate(e.date)}
                  </div>
                </div>
                <Badge variant="outline">{e.type}</Badge>
              </div>
              <p className="text-sm mt-3">{e.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
