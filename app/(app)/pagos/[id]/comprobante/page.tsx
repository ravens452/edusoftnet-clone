import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Download, ArrowLeft } from 'lucide-react';
import { PAYMENT_METHODS, SCHOOL_INFO, type PaymentMethod } from '@/lib/payments';
import { MethodBadge } from '@/components/method-badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default async function ComprobantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSession();
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      invoice: true,
      student: { include: { user: true, enrollments: { include: { section: { include: { grade: true } } } } } },
    },
  });
  if (!payment) return notFound();
  const methodLabel = PAYMENT_METHODS.find((m) => m.id === payment.method)?.label ?? payment.method;
  const enr = payment.student.enrollments[0];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/pagos">
          <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" /> Volver</Button>
        </Link>
        <a href={`/pagos/${id}/comprobante`} target="_blank" rel="noopener">
          <Button size="sm" variant="outline" className="gap-2"><Download className="h-4 w-4" /> Imprimir / PDF</Button>
        </a>
      </div>

      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-start justify-between border-b border-[var(--border)] pb-6">
            <div>
              <div className="flex items-center gap-2 text-[var(--success)] font-semibold">
                <CheckCircle2 className="h-5 w-5" /> Pago confirmado
              </div>
              <h1 className="text-2xl font-bold mt-2">Comprobante de pago</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                {SCHOOL_INFO.name} · RUC {SCHOOL_INFO.ruc}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">{SCHOOL_INFO.address}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Boleta electrónica</div>
              <div className="font-mono font-bold text-lg">{payment.invoice.number}</div>
              {payment.invoice.sunatCode && (
                <Badge variant="outline" className="mt-1 text-[10px]">SUNAT: {payment.invoice.sunatCode}</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-[var(--muted-foreground)] uppercase">Estudiante</div>
              <div className="font-semibold">{payment.student.user.firstName} {payment.student.user.lastName}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                Código: {payment.student.studentCode}
              </div>
              {enr && (
                <div className="text-xs text-[var(--muted-foreground)]">
                  {enr.section.grade.name} "{enr.section.name}"
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-[var(--muted-foreground)] uppercase">Pagado</div>
              <div className="font-semibold">{formatDateTime(payment.paidAt)}</div>
              <div className="flex items-center gap-2 mt-2">
                <MethodBadge method={payment.method as PaymentMethod} size={28} />
                <div>
                  <div className="text-xs font-semibold">{methodLabel}</div>
                  <div className="text-[10px] text-[var(--muted-foreground)] font-mono">Op: {payment.reference}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-b border-[var(--border)] py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--muted-foreground)] uppercase">Concepto</div>
                <div className="font-medium">{payment.invoice.concept}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--muted-foreground)] uppercase">Importe</div>
                <div className="text-3xl font-bold">{formatCurrency(payment.amount)}</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-[var(--muted-foreground)] text-center">
            Documento electrónico generado el {formatDateTime(payment.paidAt)}.
            <br />
            En la plataforma real este comprobante se enviaría a SUNAT y al correo del apoderado.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
