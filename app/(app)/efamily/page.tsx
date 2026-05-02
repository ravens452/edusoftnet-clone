import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const STAGES = [
  { id: 'LEAD', label: 'Prospecto' },
  { id: 'CONTACTED', label: 'Contactado' },
  { id: 'INTERVIEW', label: 'Entrevista' },
  { id: 'EVALUATION', label: 'Evaluación' },
  { id: 'PRE_ENROLLMENT', label: 'Pre-matrícula' },
  { id: 'ENROLLED', label: 'Matriculado' },
  { id: 'REJECTED', label: 'Rechazado' },
] as const;

export default async function EfamilyPage() {
  await requireSession();
  const prospects = await prisma.prospect.findMany({ orderBy: { createdAt: 'desc' } });
  const grouped = new Map<string, typeof prospects>();
  for (const p of prospects) {
    const key = p.stage;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="efamily — Admisión" description="CRM de prospectos y matrículas" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 overflow-x-auto">
        {STAGES.map((stage) => {
          const items = grouped.get(stage.id) || [];
          return (
            <Card key={stage.id} className="min-w-[260px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{stage.label}</span>
                  <Badge variant="muted">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {items.map((p) => (
                  <div key={p.id} className="rounded-md border border-[var(--border)] p-3 text-sm">
                    <div className="font-medium">{p.childName}</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">{p.desiredGrade}</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">{p.contactPhone}</div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-[10px]">{p.source}</Badge>
                      <span className="text-[10px] text-[var(--muted-foreground)]">{formatDate(p.createdAt)}</span>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="text-xs text-[var(--muted-foreground)] py-4 text-center">Vacío</div>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
