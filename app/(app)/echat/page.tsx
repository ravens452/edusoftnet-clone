import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { initials, formatDateTime } from '@/lib/utils';

export default async function EchatPage() {
  const user = await requireSession();
  const threads = await prisma.chatThread.findMany({
    where: { participants: { some: { userId: user.id } } },
    include: {
      participants: { include: { user: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { messages: { _count: 'desc' } },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="echat" description="Mensajes con docentes y familias" />
      <Card>
        <CardContent className="p-0 divide-y divide-[var(--border)]">
          {threads.length === 0 && (
            <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Sin conversaciones todavía.</div>
          )}
          {threads.map((t) => {
            const others = t.participants.filter((p) => p.userId !== user.id).map((p) => p.user);
            const last = t.messages[0];
            return (
              <Link key={t.id} href={`/echat/${t.id}`} className="block hover:bg-[var(--muted)]/40">
                <div className="flex items-center gap-3 p-4">
                  <Avatar>
                    <AvatarFallback>
                      {others[0] ? initials(others[0].firstName, others[0].lastName) : 'CT'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {others.map((o) => `${o.firstName} ${o.lastName}`).join(', ')}
                      </span>
                      {last && (
                        <span className="text-xs text-[var(--muted-foreground)] shrink-0">
                          {formatDateTime(last.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)] truncate">
                      {last?.body ?? 'Sin mensajes aún'}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
