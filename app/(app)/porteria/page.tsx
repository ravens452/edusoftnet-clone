import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default async function PorteriaPage() {
  await requireSession();
  const logs = await prisma.gateLog.findMany({
    orderBy: { occurredAt: 'desc' }, take: 100,
    include: { user: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Portería" description="Registro de entradas y salidas" />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Movimiento</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Fecha y hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.user.firstName} {l.user.lastName} <span className="text-[var(--muted-foreground)] text-xs">({l.user.role})</span></TableCell>
                  <TableCell>
                    {l.direction === 'IN' ? (
                      <Badge variant="success" className="gap-1"><ArrowDownToLine className="h-3 w-3" /> Ingreso</Badge>
                    ) : (
                      <Badge variant="warning" className="gap-1"><ArrowUpFromLine className="h-3 w-3" /> Salida</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{l.reason ?? '—'}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(l.occurredAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
