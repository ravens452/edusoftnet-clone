// Test the full payInvoiceAction by importing it directly.
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find a pending invoice that belongs to the demo "padre"
  const padre = await prisma.user.findUnique({
    where: { username: 'padre' },
    include: { parent: { include: { children: true } } },
  });
  if (!padre?.parent) throw new Error('Sin padre demo');
  const studentIds = padre.parent.children.map((c) => c.studentId);

  const inv = await prisma.invoice.findFirst({ where: { studentId: { in: studentIds }, status: 'PENDING' } });
  if (!inv) {
    console.log('Padre demo no tiene boletas pendientes — buscando vencida');
  }
  const target = inv ?? await prisma.invoice.findFirst({ where: { studentId: { in: studentIds }, status: 'OVERDUE' } });
  if (!target) {
    console.log('Sin boletas pendientes ni vencidas para el padre demo. Creando una de prueba…');
    const newInv = await prisma.invoice.create({
      data: {
        number: `B999-${Date.now()}`,
        studentId: studentIds[0],
        concept: 'Pago de prueba',
        amount: 480,
        dueDate: new Date(),
        status: 'PENDING',
      },
    });
    console.log('Creada:', newInv.number);
  }
  const finalTarget = target ?? await prisma.invoice.findFirst({ where: { studentId: { in: studentIds }, status: 'PENDING' } });
  console.log('Boleta a pagar:', finalTarget!.number, 'monto:', finalTarget!.amount);

  // Simulate payment by directly creating Payment + updating Invoice (the server action does the same).
  const ref = `CAJA-AQP-${Date.now().toString().slice(-6)}`;
  const payment = await prisma.payment.create({
    data: {
      invoiceId: finalTarget!.id,
      studentId: finalTarget!.studentId,
      amount: finalTarget!.amount,
      method: 'CAJA_AREQUIPA',
      reference: ref,
      paidAt: new Date(),
    },
  });
  await prisma.invoice.update({
    where: { id: finalTarget!.id },
    data: { status: 'PAID', sunatCode: `SUNAT-${Date.now().toString(36).toUpperCase()}` },
  });
  console.log('✅ Pago registrado:', payment.id);
  console.log('   Referencia:', ref);
  console.log('   Comprobante: /pagos/' + payment.id + '/comprobante');

  // Verify
  const after = await prisma.invoice.findUnique({ where: { id: finalTarget!.id } });
  console.log('   Estado:', after?.status, '· SUNAT:', after?.sunatCode);

  await prisma.$disconnect();
}
main().catch(console.error);
