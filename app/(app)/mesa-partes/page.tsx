import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const STATUS: Record<string, { label: string; tone: 'warning' | 'secondary' | 'success' | 'destructive' | 'muted' }> = {
  OPEN: { label: 'Abierto', tone: 'warning' },
  IN_REVIEW: { label: 'En revisión', tone: 'secondary' },
  ANSWERED: { label: 'Respondido', tone: 'success' },
  CLOSED: { label: 'Cerrado', tone: 'muted' },
  REJECTED: { label: 'Rechazado', tone: 'destructive' },
};

export default async function MesaPartesPage() {
  const user = await requireSession();
  const where = user.role === 'PARENT' || user.role === 'STUDENT' ? { creatorId: user.id } : {};
  const tickets = await prisma.ticket.findMany({
    where,
    include: { creator: true, assignee: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Mesa de partes" description="Solicitudes y trámites" />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Asignado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => {
                const s = STATUS[t.status];
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.number}</TableCell>
                    <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                    <TableCell>{t.creator.firstName} {t.creator.lastName}</TableCell>
                    <TableCell className="text-xs">{t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : '—'}</TableCell>
                    <TableCell><Badge variant={s.tone}>{s.label}</Badge></TableCell>
                    <TableCell className="text-xs">{formatDate(t.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
