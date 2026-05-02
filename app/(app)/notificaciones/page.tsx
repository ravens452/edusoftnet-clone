import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

export default async function NotificacionesPage() {
  const user = await requireSession();
  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Notificaciones" />
      <Card>
        <CardContent className="p-0 divide-y divide-[var(--border)]">
          {items.map((n) => (
            <div key={n.id} className="px-5 py-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={n.readAt ? 'muted' : 'secondary'}>{n.type}</Badge>
                  <span className="font-medium text-sm">{n.title}</span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">{n.body}</p>
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">{formatDateTime(n.createdAt)}</span>
            </div>
          ))}
          {items.length === 0 && <div className="p-8 text-sm text-[var(--muted-foreground)] text-center">Sin notificaciones.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
