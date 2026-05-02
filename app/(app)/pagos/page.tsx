import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, AlertCircle, CheckCircle2, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PayDialog } from './pay-dialog';

export default async function PagosPage() {
  const user = await requireSession();
  let studentIds: string[] = [];
  if (user.role === 'PARENT') {
    const p = await prisma.parent.findUnique({ where: { userId: user.id }, include: { children: true } });
    studentIds = p?.children.map((c) => c.studentId) ?? [];
  } else if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id } });
    if (s) studentIds = [s.id];
  }

  const invoices = await prisma.invoice.findMany({
    where: { studentId: { in: studentIds } },
    include: { student: { include: { user: true } }, payments: true },
    orderBy: { dueDate: 'desc' },
  });

  const pending = invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE');
  const paid = invoices.filter((i) => i.status === 'PAID');
  const totalPending = pending.reduce((acc, i) => acc + i.amount, 0);
  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length;
  const totalPaidYear = paid.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Mis pagos" description="Boletas, comprobantes y estado de cuenta" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Por pagar" value={formatCurrency(totalPending)} icon={Wallet} tone={totalPending > 0 ? 'warning' : 'success'} />
        <StatCard label="Boletas pendientes" value={pending.length} icon={Receipt} tone={pending.length > 0 ? 'warning' : 'success'} />
        <StatCard label="Vencidas" value={overdueCount} icon={AlertCircle} tone={overdueCount > 0 ? 'destructive' : 'success'} />
        <StatCard label="Pagado en el año" value={formatCurrency(totalPaidYear)} icon={CheckCircle2} tone="success" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.number}</TableCell>
                  <TableCell>{i.concept}</TableCell>
                  <TableCell>{i.student.user.firstName}</TableCell>
                  <TableCell className="text-xs">{formatDate(i.dueDate)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(i.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={i.status === 'PAID' ? 'success' : i.status === 'OVERDUE' ? 'destructive' : 'warning'}>
                      {i.status === 'PAID' ? 'Pagado' : i.status === 'OVERDUE' ? 'Vencido' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {i.status === 'PAID' ? (
                      i.payments[0] && (
                        <Link href={`/pagos/${i.payments[0].id}/comprobante`}>
                          <Button size="sm" variant="outline">Ver comprobante</Button>
                        </Link>
                      )
                    ) : i.status !== 'CANCELED' ? (
                      <PayDialog
                        invoice={{
                          id: i.id, number: i.number, concept: i.concept,
                          amount: i.amount, dueDate: i.dueDate,
                          studentName: `${i.student.user.firstName} ${i.student.user.lastName}`,
                          studentCode: i.student.studentCode,
                        }}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
