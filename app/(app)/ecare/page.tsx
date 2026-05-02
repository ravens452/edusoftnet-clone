import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function EcarePage() {
  await requireSession();
  const cases = await prisma.psychologyCase.findMany({
    orderBy: { openedAt: 'desc' },
    include: { student: { include: { user: true } } },
    take: 50,
  });
  const tests = await prisma.psychologicalTest.findMany({
    orderBy: { takenAt: 'desc' },
    include: { },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="ecare — Psicología" description="Casos socio-emocionales y tests" />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4" /> Casos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {cases.map((c) => (
              <div key={c.id} className="rounded-md border border-[var(--border)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{c.title}</div>
                  <Badge variant={c.status === 'OPEN' ? 'warning' : c.status === 'IN_FOLLOWUP' ? 'secondary' : 'success'}>
                    {c.status}
                  </Badge>
                </div>
                <div className="text-xs text-[var(--muted-foreground)] mt-1">
                  {c.student.user.firstName} {c.student.user.lastName} · abierto el {formatDate(c.openedAt)}
                </div>
                <p className="text-sm mt-2">{c.description}</p>
              </div>
            ))}
            {cases.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">Sin casos abiertos.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Tests aplicados</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {tests.map((t) => (
                <li key={t.id} className="flex items-center justify-between border-b last:border-0 border-[var(--border)] py-1.5">
                  <span>{t.testType}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{formatDate(t.takenAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
