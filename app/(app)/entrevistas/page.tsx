import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

const STATUS: Record<string, { label: string; tone: 'warning' | 'secondary' | 'success' | 'destructive' }> = {
  REQUESTED: { label: 'Solicitada', tone: 'warning' },
  CONFIRMED: { label: 'Confirmada', tone: 'secondary' },
  COMPLETED: { label: 'Completada', tone: 'success' },
  CANCELED: { label: 'Cancelada', tone: 'destructive' },
};

export default async function EntrevistasPage() {
  const user = await requireSession();
  const where: any = {};
  if (user.role === 'TEACHER') {
    const t = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (t) where.teacherId = t.id;
  } else if (user.role === 'PARENT') {
    const p = await prisma.parent.findUnique({ where: { userId: user.id } });
    if (p) where.parentId = p.id;
  }
  const items = await prisma.interview.findMany({
    where,
    include: {
      teacher: { include: { user: true } },
      parent: { include: { user: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Entrevistas" description="Reuniones docente-familia" />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y hora</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Apoderado</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Modalidad</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => {
                const s = STATUS[i.status];
                return (
                  <TableRow key={i.id}>
                    <TableCell className="text-xs">{formatDateTime(i.scheduledAt)}</TableCell>
                    <TableCell>{i.teacher.user.firstName} {i.teacher.user.lastName}</TableCell>
                    <TableCell>{i.parent.user.firstName} {i.parent.user.lastName}</TableCell>
                    <TableCell>{i.topic}</TableCell>
                    <TableCell><Badge variant="outline">{i.mode === 'VIRTUAL' ? 'Virtual' : 'Presencial'}</Badge></TableCell>
                    <TableCell><Badge variant={s.tone}>{s.label}</Badge></TableCell>
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
