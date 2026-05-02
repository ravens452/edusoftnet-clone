import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

export default async function TalleresPage() {
  await requireSession();
  const workshops = await prisma.workshop.findMany({
    include: {
      teacher: { include: { user: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Talleres" description="Actividades extracurriculares" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workshops.map((w) => (
          <Card key={w.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-[var(--secondary)]" /> {w.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-[var(--muted-foreground)]">{w.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span>{w.schedule}</span>
                <Badge variant="outline">{w._count.enrollments}/{w.capacity}</Badge>
              </div>
              {w.teacher && (
                <div className="text-xs text-[var(--muted-foreground)]">
                  A cargo de {w.teacher.user.firstName} {w.teacher.user.lastName}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
