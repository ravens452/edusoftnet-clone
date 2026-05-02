'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function sendMessageAction(threadId: string, body: string) {
  const user = await requireSession();
  if (!body.trim()) return;
  await prisma.chatMessage.create({
    data: { threadId, senderId: user.id, body: body.trim() },
  });
  revalidatePath(`/echat/${threadId}`);
}
