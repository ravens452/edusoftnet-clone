'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

const Schema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(3).max(3000),
  category: z.string().min(1),
});

export async function createTicketAction(formData: FormData) {
  const user = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(' · ') };

  // Generar número único correlativo
  const count = await prisma.ticket.count();
  const number = `MP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  try {
    await prisma.ticket.create({
      data: {
        number,
        subject: parsed.data.subject,
        body: parsed.data.body,
        category: parsed.data.category,
        creatorId: user.id,
        status: 'OPEN',
      },
    });
    revalidatePath('/mesa-partes');
    return { success: true };
  } catch (err) {
    console.error('createTicket', err);
    return { error: 'Error guardando' };
  }
}
