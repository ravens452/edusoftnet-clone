import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen } from 'lucide-react';

export default async function ElibraryPage() {
  const user = await requireSession();
  let studentIds: string[] = [];
  if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id } });
    if (s) studentIds = [s.id];
  } else if (user.role === 'PARENT') {
    const p = await prisma.parent.findUnique({ where: { userId: user.id }, include: { children: true } });
    studentIds = p?.children.map((c) => c.studentId) ?? [];
  }

  const books = await prisma.book.findMany();
  const myReadings = studentIds.length
    ? await prisma.readingProgress.findMany({
        where: { studentId: { in: studentIds } },
        include: { book: true, student: { include: { user: true } } },
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="elibrary" description="Plan lector institucional" />

      {myReadings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Mis lecturas</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {myReadings.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="text-base">{r.book.title}</CardTitle>
                  <p className="text-xs text-[var(--muted-foreground)]">{r.book.author}</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Progreso</span>
                      <span>{r.progress}%</span>
                    </div>
                    <Progress value={r.progress} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.state === 'COMPLETED' || r.state === 'EVALUATED' ? 'success' : 'outline'}>{r.state}</Badge>
                    <span className="text-xs text-[var(--muted-foreground)]">{r.student.user.firstName}</span>
                  </div>
                  {r.literalScore != null && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded bg-[var(--muted)] p-2">
                        <div className="text-[10px] uppercase text-[var(--muted-foreground)]">Literal</div>
                        <div className="font-semibold">{r.literalScore.toFixed(1)}</div>
                      </div>
                      <div className="rounded bg-[var(--muted)] p-2">
                        <div className="text-[10px] uppercase text-[var(--muted-foreground)]">Inferencial</div>
                        <div className="font-semibold">{r.inferentialScore?.toFixed(1)}</div>
                      </div>
                      <div className="rounded bg-[var(--muted)] p-2">
                        <div className="text-[10px] uppercase text-[var(--muted-foreground)]">Crítico</div>
                        <div className="font-semibold">{r.criticalScore?.toFixed(1)}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Catálogo</h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
          {books.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="aspect-[3/4] bg-gradient-to-br from-[var(--primary)]/40 to-[var(--secondary)]/30 rounded mb-3 grid place-items-center">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
                <div className="font-medium text-sm">{b.title}</div>
                <div className="text-xs text-[var(--muted-foreground)] mt-1">{b.author}</div>
                <Badge variant="outline" className="mt-2 text-[10px]">{b.level}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
