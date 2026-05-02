import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PayDialog } from '../pagos/pay-dialog';

export default async function TesoreriaPage() {
  await requireSession();
  const [pending, paid, overdue, paidThisMonth, recent] = await Promise.all([
    prisma.invoice.count({ where: { status: 'PENDING' } }),
    prisma.invoice.count({ where: { status: 'PAID' } }),
    prisma.invoice.count({ where: { status: 'OVERDUE' } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.invoice.findMany({
      take: 50, orderBy: { issuedAt: 'desc' },
      include: { student: { include: { user: true } }, payments: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Tesorería" description="Boletas, facturas y pagos" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Recaudado mes" value={formatCurrency(paidThisMonth._sum.amount ?? 0)} icon={Wallet} tone="success" />
        <StatCard label="Pagadas" value={paid} icon={CheckCircle2} tone="success" />
        <StatCard label="Pendientes" value={pending} icon={FileText} tone="warning" />
        <StatCard label="Vencidas" value={overdue} icon={AlertCircle} tone="destructive" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° comprobante</TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.number}</TableCell>
                  <TableCell>{i.student.user.firstName} {i.student.user.lastName}</TableCell>
                  <TableCell>{i.concept}</TableCell>
                  <TableCell className="text-xs">{formatDate(i.dueDate)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(i.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={i.status === 'PAID' ? 'success' : i.status === 'OVERDUE' ? 'destructive' : 'warning'}>
                      {i.status === 'PAID' ? 'Pagada' : i.status === 'OVERDUE' ? 'Vencida' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {i.status === 'PAID' ? (
                      i.payments[0] && (
                        <Link href={`/pagos/${i.payments[0].id}/comprobante`}>
                          <Button size="sm" variant="outline">Ver</Button>
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
                        trigger={<Button size="sm">Registrar pago</Button>}
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
