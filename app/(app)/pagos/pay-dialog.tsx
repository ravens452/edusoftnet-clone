'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MethodBadge } from '@/components/method-badge';
import { PAYMENT_METHODS, SCHOOL_INFO, getMethodBrand, type PaymentMethod } from '@/lib/payments';
import { formatCurrency, formatDate } from '@/lib/utils';
import { payInvoiceAction } from './actions';

type Props = {
  invoice: {
    id: string;
    number: string;
    concept: string;
    amount: number;
    dueDate: Date | string;
    studentName: string;
    studentCode: string;
  };
  trigger?: React.ReactNode;
};

export function PayDialog({ invoice, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'method' | 'detail'>('method');
  const [method, setMethod] = useState<PaymentMethod>('CAJA_AREQUIPA');
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function selectMethod(m: PaymentMethod) {
    setMethod(m);
    setStep('detail');
  }

  function confirm() {
    setError(null);
    start(async () => {
      const res = await payInvoiceAction(invoice.id, method, reference || null);
      if (!res.ok) { setError(res.error ?? 'No se pudo procesar el pago'); return; }
      setOpen(false);
      router.push(`/pagos/${res.paymentId}/comprobante`);
      router.refresh();
    });
  }

  function reset() { setStep('method'); setMethod('CAJA_AREQUIPA'); setReference(''); setError(null); }

  function renderMethodInstructions() {
    const brand = getMethodBrand(method);
    switch (method) {
      case 'CAJA_AREQUIPA':
        return (
          <div className="rounded-lg overflow-hidden border border-[var(--border)]">
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: brand.bg, color: brand.fg }}>
              <MethodBadge method={method} size={36} className="ring-2 ring-white/30" />
              <div>
                <div className="font-bold text-sm">Pago con Caja Arequipa</div>
                <div className="text-xs opacity-80">Tu opción local más usada</div>
              </div>
            </div>
            <div className="p-4 text-sm space-y-2 bg-white">
              <p className="font-medium">Pasos en agencia, agente Caja o Caja Móvil:</p>
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Selecciona <strong>"Pago de servicios"</strong> → <strong>"Colegios e institutos"</strong></li>
                <li>Empresa: <strong>{SCHOOL_INFO.shortName}</strong> · Código <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">{SCHOOL_INFO.cajaArequipaCode}</span></li>
                <li>Código del alumno: <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">{invoice.studentCode}</span></li>
                <li>Confirma el monto: <strong>{formatCurrency(invoice.amount)}</strong></li>
                <li>Guarda el número de operación</li>
              </ol>
              <div className="pt-2 text-xs text-[var(--muted-foreground)] border-t border-[var(--border)] mt-3">
                Después de pagar, ingresa el número de operación abajo para confirmar.
              </div>
            </div>
          </div>
        );
      case 'BCP':
        return (
          <div className="rounded-lg overflow-hidden border border-[var(--border)]">
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: brand.bg, color: brand.fg }}>
              <MethodBadge method={method} size={36} className="ring-2 ring-white/20" />
              <div>
                <div className="font-bold text-sm">Pago con BCP</div>
                <div className="text-xs opacity-80">Banca Móvil · Web · Agente</div>
              </div>
            </div>
            <div className="p-4 text-sm space-y-2 bg-white">
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Selecciona "Pagar servicio" → "Otras instituciones"</li>
                <li>Empresa: <strong>{SCHOOL_INFO.shortName}</strong> · Código <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">{SCHOOL_INFO.bcpCode}</span></li>
                <li>Código de alumno: <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">{invoice.studentCode}</span></li>
                <li>Confirma {formatCurrency(invoice.amount)}</li>
              </ol>
            </div>
          </div>
        );
      case 'INTERBANK':
        return (
          <div className="rounded-lg overflow-hidden border border-[var(--border)]">
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: brand.bg, color: brand.fg }}>
              <MethodBadge method={method} size={36} />
              <div>
                <div className="font-bold text-sm">Pago con Interbank</div>
                <div className="text-xs opacity-80">App · Web · Agente Express</div>
              </div>
            </div>
            <div className="p-4 text-sm space-y-2 bg-white">
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Pago de servicios → Buscar <strong>{SCHOOL_INFO.shortName}</strong></li>
                <li>Código institución: <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">{SCHOOL_INFO.interbankCode}</span></li>
                <li>Código alumno: <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">{invoice.studentCode}</span></li>
              </ol>
            </div>
          </div>
        );
      case 'SCOTIABANK':
        return (
          <div className="rounded-lg overflow-hidden border border-[var(--border)]">
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: brand.bg, color: brand.fg }}>
              <MethodBadge method={method} size={36} />
              <div>
                <div className="font-bold text-sm">Pago con Scotiabank</div>
                <div className="text-xs opacity-80">App · Web · Agente</div>
              </div>
            </div>
            <div className="p-4 text-sm space-y-2 bg-white">
              <p>Ingresa al portal Scotia → Pagos y servicios → Otras instituciones</p>
              <p>Buscar <strong>{SCHOOL_INFO.shortName}</strong> · ingresar código <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">{invoice.studentCode}</span></p>
            </div>
          </div>
        );
      case 'BBVA':
        return (
          <div className="rounded-lg overflow-hidden border border-[var(--border)]">
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: brand.bg, color: brand.fg }}>
              <MethodBadge method={method} size={36} />
              <div>
                <div className="font-bold text-sm">Pago con BBVA</div>
                <div className="text-xs opacity-80">App · Web · Agente</div>
              </div>
            </div>
            <div className="p-4 text-sm space-y-2 bg-white">
              <p>App BBVA → Pago de servicios → Otras instituciones</p>
              <p>Buscar <strong>{SCHOOL_INFO.shortName}</strong> · código alumno <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">{invoice.studentCode}</span></p>
            </div>
          </div>
        );
      case 'YAPE':
      case 'PLIN':
        return (
          <div className="rounded-lg overflow-hidden border border-[var(--border)]">
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: brand.bg, color: brand.fg }}>
              <MethodBadge method={method} size={36} className="ring-2 ring-white/30" />
              <div>
                <div className="font-bold text-sm">{method === 'YAPE' ? 'Pago con Yape' : 'Pago con Plin'}</div>
                <div className="text-xs opacity-80">Transferencia inmediata</div>
              </div>
            </div>
            <div className="p-4 text-sm space-y-2 bg-white">
              <p>Yapea/Plin a este número:</p>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-[var(--muted)] px-2 py-1 rounded text-base font-semibold">
                  {SCHOOL_INFO.phone.replace(/\s/g, '')}
                </span>
                <Badge variant="outline">a nombre del colegio</Badge>
              </div>
              <p>Pon en el mensaje el código del alumno: <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">{invoice.studentCode}</span></p>
              <p>Monto: <strong>{formatCurrency(invoice.amount)}</strong></p>
            </div>
          </div>
        );
      case 'TARJETA':
        return (
          <div className="rounded-lg overflow-hidden border border-[var(--border)]">
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: brand.bg, color: brand.fg }}>
              <MethodBadge method={method} size={36} />
              <div>
                <div className="font-bold text-sm">Tarjeta de crédito o débito</div>
                <div className="text-xs opacity-80">Visa · Mastercard · American Express</div>
              </div>
            </div>
            <div className="p-4 text-sm bg-white text-[var(--muted-foreground)]">
              En esta demo no se procesan tarjetas reales. En producción se integraría con Culqi,
              Niubiz o Mercado Pago. Por ahora simula la confirmación con un número de operación.
            </div>
          </div>
        );
      case 'EFECTIVO_TESORERIA':
        return (
          <div className="rounded-lg overflow-hidden border border-[var(--border)]">
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: brand.bg, color: brand.fg }}>
              <MethodBadge method={method} size={36} />
              <div>
                <div className="font-bold text-sm">Efectivo en tesorería</div>
                <div className="text-xs opacity-80">Pago presencial en el colegio</div>
              </div>
            </div>
            <div className="p-4 text-sm bg-white">
              Pago en ventanilla de tesorería (lunes a viernes 7:30 a.m. – 1:00 p.m.).
              Solo el personal de tesorería puede confirmar este pago en el sistema.
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm">Pagar</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagar boleta {invoice.number}</DialogTitle>
          <DialogDescription>
            {invoice.concept} · {invoice.studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-white p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/70">A pagar</div>
            <div className="text-3xl font-bold mt-1" style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}>
              {formatCurrency(invoice.amount)}
            </div>
          </div>
          <Badge className="bg-white/15 text-white border-white/30">Vence {formatDate(invoice.dueDate)}</Badge>
        </div>

        {step === 'method' && (
          <div className="space-y-2">
            <Label>Selecciona el método de pago</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => selectMethod(m.id)}
                  className="text-left rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 px-3 py-3 flex items-center gap-3 transition-all hover:shadow-sm group"
                >
                  <MethodBadge method={m.id} size={40} className="group-hover:scale-105 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm">{m.label}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)] truncate">{m.hint}</div>
                  </div>
                  <span className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] text-sm">›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'detail' && (
          <div className="space-y-4">
            {renderMethodInstructions()}
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="ref">
                Número de operación / referencia <span className="text-[var(--muted-foreground)] font-normal">(opcional)</span>
              </Label>
              <Input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ej. 12345678" />
              <p className="text-xs text-[var(--muted-foreground)]">
                Si lo dejas en blanco se generará uno automático.
              </p>
            </div>
            {error && (
              <p className="text-sm text-[var(--destructive)] bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-md p-2">
                {error}
              </p>
            )}
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep('method')}>← Cambiar método</Button>
              <Button onClick={confirm} disabled={pending}>
                {pending ? 'Procesando…' : 'Confirmar pago'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
