import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { NewInterviewDialog } from './new-interview-dialog';

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
    orderBy: { scheduledAt: 'desc' },
  });

  const canCreate = ['TEACHER', 'DIRECTION', 'ADMIN', 'SECRETARY'].includes(user.role);
  const isAdmin = ['DIRECTION', 'ADMIN', 'SECRETARY'].includes(user.role);

  let parents: { id: string; label: string }[] = [];
  let teachers: { id: string; label: string }[] = [];
  if (canCreate) {
    const ps = await prisma.parent.findMany({
      include: { user: true },
      orderBy: { user: { lastName: 'asc' } },
      take: 200,
    });
    parents = ps.map((p) => ({ id: p.id, label: `${p.user.lastName}, ${p.user.firstName}` }));
    if (isAdmin) {
      const ts = await prisma.teacher.findMany({
        include: { user: true },
        orderBy: { user: { lastName: 'asc' } },
        take: 100,
      });
      teachers = ts.map((t) => ({ id: t.id, label: `${t.user.lastName}, ${t.user.firstName}` }));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entrevistas"
        description="Reuniones docente-familia"
        action={canCreate ? <NewInterviewDialog parents={parents} teachers={teachers} isAdmin={isAdmin} /> : undefined}
      />
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
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-[var(--muted-foreground)] py-8">
                    Aún no hay entrevistas registradas.
                  </TableCell>
                </TableRow>
              ) : items.map((i) => {
                const s = STATUS[i.status];
                return (
                  <TableRow key={i.id}>
                    <TableCell className="text-xs whitespace-nowrap">{formatDateTime(i.scheduledAt)}</TableCell>
                    <TableCell>{i.teacher.user.firstName} {i.teacher.user.lastName}</TableCell>
                    <TableCell>{i.parent.user.firstName} {i.parent.user.lastName}</TableCell>
                    <TableCell className="max-w-xs truncate">{i.topic}</TableCell>
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
