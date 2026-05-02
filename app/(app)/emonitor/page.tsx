import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const TYPE_LABEL: Record<string, string> = {
  ANNUAL: 'Plan Anual',
  UNIT: 'Unidad de Aprendizaje',
  SESSION: 'Sesión',
};

export default async function EmonitorPage() {
  const user = await requireSession();
  let where = {};
  if (user.role === 'TEACHER') {
    const t = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (t) where = { teacherId: t.id };
  }
  const plans = await prisma.curriculumPlan.findMany({
    where, include: { teacher: { include: { user: true } } },
    orderBy: { startDate: 'desc' },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="emonitor — Currículo" description="Planificación anual, unidades y sesiones" />
      <div className="grid md:grid-cols-2 gap-4">
        {plans.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{p.title}</CardTitle>
                <Badge variant="outline">{TYPE_LABEL[p.type]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>{p.description}</p>
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>{p.teacher.user.firstName} {p.teacher.user.lastName}</span>
                <span>{formatDate(p.startDate)} → {formatDate(p.endDate)}</span>
              </div>
              <Badge variant={p.status === 'APPROVED' ? 'success' : 'warning'}>{p.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
