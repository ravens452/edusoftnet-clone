'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

export async function markAsRead(notificationId: string) {
  const user = await requireSession();
  try {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath('/notificaciones');
    return { success: true };
  } catch (err) {
    console.error('markAsRead', err);
    return { error: 'Error' };
  }
}

export async function markAllAsRead() {
  const user = await requireSession();
  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath('/notificaciones');
    return { success: true };
  } catch (err) {
    console.error('markAllAsRead', err);
    return { error: 'Error' };
  }
}

export async function getRecentNotifications(limit = 10) {
  const user = await requireSession();
  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
