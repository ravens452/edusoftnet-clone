import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { navFor, ROLE_LABELS } from '@/lib/navigation';
import { prisma } from '@/lib/db';
import { AppShell } from '@/components/layout/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect('/login');

  const groups = navFor(user.role);
  const [unread, recentNotifs] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return (
    <AppShell
      groups={groups}
      role={ROLE_LABELS[user.role]}
      firstName={user.firstName}
      lastName={user.lastName}
      unread={unread}
      recentNotifs={recentNotifs.map((n) => ({
        id: n.id, type: n.type, title: n.title, body: n.body,
        link: n.link, readAt: n.readAt, createdAt: n.createdAt,
      }))}
    >
      {children}
    </AppShell>
  );
}
