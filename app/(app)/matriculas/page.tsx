import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default async function MatriculasPage() {
  await requireSession();
  const enrollments = await prisma.enrollment.findMany({
    take: 100,
    orderBy: { enrolledAt: 'desc' },
    include: {
      student: { include: { user: true } },
      section: { include: { grade: true } },
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Matrículas" description="Inscripciones del año escolar" />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Estudiante</TableHead>
                <TableHead>Grado y sección</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Inscripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.student.studentCode}</TableCell>
                  <TableCell>{e.student.user.firstName} {e.student.user.lastName}</TableCell>
                  <TableCell>{e.section.grade.name} "{e.section.name}"</TableCell>
                  <TableCell><Badge variant={e.status === 'ACTIVE' ? 'success' : 'muted'}>{e.status}</Badge></TableCell>
                  <TableCell className="text-xs">{formatDate(e.enrolledAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
