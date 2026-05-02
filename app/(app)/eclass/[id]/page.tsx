import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, formatDateTime } from '@/lib/utils';

export default async function AssignmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSession();
  const a = await prisma.assignment.findUnique({
    where: { id },
    include: {
      courseAssignment: { include: { course: true, section: { include: { grade: true } } } },
      submissions: { include: { student: { include: { user: true } } }, orderBy: { student: { user: { lastName: 'asc' } } } },
    },
  });
  if (!a) return notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={a.title}
        description={`${a.courseAssignment.course.name} · ${a.courseAssignment.section.grade.name} "${a.courseAssignment.section.name}"`}
      />
      <Card>
        <CardHeader>
          <CardTitle>Detalles</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div><span className="text-[var(--muted-foreground)]">Tipo: </span><Badge variant="outline">{a.type}</Badge></div>
          <div><span className="text-[var(--muted-foreground)]">Puntaje máximo: </span>{a.maxScore}</div>
          <div><span className="text-[var(--muted-foreground)]">Entrega: </span>{formatDate(a.dueDate)}</div>
          {a.description && <div className="pt-2 whitespace-pre-wrap">{a.description}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Entregas ({a.submissions.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Entregado</TableHead>
                <TableHead>Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.submissions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.student.user.lastName}, {s.student.user.firstName}</TableCell>
                  <TableCell>
                    <Badge variant={
                      s.status === 'GRADED' ? 'success' :
                      s.status === 'SUBMITTED' ? 'secondary' :
                      s.status === 'PENDING' ? 'warning' : 'muted'
                    }>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{s.submittedAt ? formatDateTime(s.submittedAt) : '—'}</TableCell>
                  <TableCell className="font-semibold">{s.score?.toFixed(1) ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
