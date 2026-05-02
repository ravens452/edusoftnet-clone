import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { initials, formatDateTime, cn } from '@/lib/utils';
import ReplyBox from './reply-box';

export default async function EchatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  const thread = await prisma.chatThread.findUnique({
    where: { id },
    include: {
      participants: { include: { user: true } },
      messages: { include: { sender: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!thread) return notFound();
  const others = thread.participants.filter((p) => p.userId !== user.id).map((p) => p.user);
  const title = others.map((o) => `${o.firstName} ${o.lastName}`).join(', ');

  return (
    <div className="space-y-4">
      <PageHeader title={title || 'Conversación'} description="echat" />
      <Card className="flex flex-col h-[calc(100vh-220px)]">
        <CardContent className="p-4 flex-1 overflow-y-auto space-y-3">
          {thread.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={cn('flex gap-2', mine ? 'justify-end' : 'justify-start')}>
                {!mine && (
                  <Avatar className="h-7 w-7"><AvatarFallback>{initials(m.sender.firstName, m.sender.lastName)}</AvatarFallback></Avatar>
                )}
                <div className={cn(
                  'max-w-md rounded-lg px-3 py-2 text-sm',
                  mine ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)]'
                )}>
                  {!mine && <div className="text-[11px] font-semibold opacity-70 mb-0.5">{m.sender.firstName}</div>}
                  <div>{m.body}</div>
                  <div className={cn('text-[10px] mt-1', mine ? 'text-white/70' : 'text-[var(--muted-foreground)]')}>
                    {formatDateTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
        <ReplyBox threadId={thread.id} />
      </Card>
    </div>
  );
}
