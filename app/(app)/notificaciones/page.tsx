import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { NotifList } from './notif-list';

export default async function NotificacionesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await requireSession();
  const params = await searchParams;
  const onlyUnread = params.filter === 'unread';

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id, ...(onlyUnread ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificaciones"
        description={unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
      />
      <Card>
        <CardContent className="p-0">
          <NotifList
            items={items.map((n) => ({
              id: n.id, type: n.type, title: n.title, body: n.body,
              link: n.link, readAt: n.readAt, createdAt: n.createdAt,
            }))}
            unreadCount={unreadCount}
            onlyUnread={onlyUnread}
          />
        </CardContent>
      </Card>
    </div>
  );
}
