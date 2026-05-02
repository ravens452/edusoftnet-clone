'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import type { PaymentMethod } from '@/lib/payments';

export async function payInvoiceAction(
  invoiceId: string,
  method: PaymentMethod,
  reference: string | null,
) {
  const user = await requireSession();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { student: { include: { parents: { include: { parent: true } } } } },
  });
  if (!invoice) return { ok: false, error: 'Boleta no encontrada' };
  if (invoice.status === 'PAID') return { ok: false, error: 'Esta boleta ya está pagada' };
  if (invoice.status === 'CANCELED') return { ok: false, error: 'Boleta anulada' };

  const allowed =
    user.role === 'ADMIN' ||
    user.role === 'TREASURY' ||
    user.role === 'DIRECTION' ||
    (user.role === 'PARENT' && invoice.student.parents.some((ps) => ps.parent.userId === user.id));
  if (!allowed) return { ok: false, error: 'No tienes permiso para pagar esta boleta' };

  const refNumber = reference?.trim() || `${method}-${Date.now().toString().slice(-8)}`;
  const sunatCode = `SUNAT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      amount: invoice.amount,
      method,
      reference: refNumber,
      paidAt: new Date(),
    },
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: 'PAID', sunatCode },
  });

  // Notificación a los padres
  for (const ps of invoice.student.parents) {
    await prisma.notification.create({
      data: {
        userId: ps.parent.userId,
        type: 'PAYMENT',
        title: 'Pago registrado',
        body: `Se registró el pago de ${invoice.concept} por S/ ${invoice.amount.toFixed(2)} (${method}).`,
        link: `/pagos/${payment.id}/comprobante`,
      },
    });
  }

  revalidatePath('/pagos');
  revalidatePath('/tesoreria');
  revalidatePath('/dashboard');
  return { ok: true, paymentId: payment.id };
}
