import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Pin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function ComunicadosPage() {
  await requireSession();
  const items = await prisma.announcement.findMany({
    include: { author: true },
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunicados"
        description="Mensajes oficiales de la institución"
        action={
          <a href="/comunicados/nuevo" className="text-sm text-[var(--primary)] hover:underline">
            Nuevo comunicado
          </a>
        }
      />
      <div className="space-y-4">
        {items.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {a.pinned && <Pin className="h-4 w-4 text-[var(--warning)]" />}
                  <Megaphone className="h-4 w-4 text-[var(--primary)]" />
                  <CardTitle className="text-base">{a.title}</CardTitle>
                </div>
                <Badge variant="outline">{a.audience}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="whitespace-pre-wrap">{a.body}</p>
              <div className="text-xs text-[var(--muted-foreground)]">
                {a.author.firstName} {a.author.lastName} · {formatDate(a.publishedAt)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
