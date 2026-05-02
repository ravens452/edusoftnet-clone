import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { navFor, ROLE_LABELS } from '@/lib/navigation';
import { prisma } from '@/lib/db';
import { AppShell } from '@/components/layout/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect('/login');

  const groups = navFor(user.role);
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <AppShell
      groups={groups}
      role={ROLE_LABELS[user.role]}
      firstName={user.firstName}
      lastName={user.lastName}
      unread={unread}
    >
      {children}
    </AppShell>
  );
}
