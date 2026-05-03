import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Heart, Syringe } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { NewAttentionDialog } from './new-attention-dialog';

export default async function SaludPage() {
  const user = await requireSession();
  const canCreate = ['NURSE', 'DIRECTION', 'ADMIN', 'TEACHER'].includes(user.role);
  let students: { id: string; label: string }[] = [];
  if (canCreate) {
    const ss = await prisma.student.findMany({ include: { user: true }, orderBy: { user: { lastName: 'asc' } }, take: 200 });
    students = ss.map((s) => ({ id: s.id, label: `${s.user.lastName}, ${s.user.firstName}` }));
  }
  const [records, vaccinations] = await Promise.all([
    prisma.healthRecord.findMany({
      orderBy: { date: 'desc' }, take: 50,
      include: { student: { include: { user: true } } },
    }),
    prisma.vaccination.findMany({
      orderBy: { appliedAt: 'desc' }, take: 50,
      include: { student: { include: { user: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salud / Enfermería"
        description="Atenciones, síntomas y vacunación"
        action={canCreate ? <NewAttentionDialog students={students} /> : undefined}
      />

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-4 w-4" /> Atenciones recientes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Síntomas</TableHead>
                <TableHead>Tratamiento</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.student.user.firstName} {r.student.user.lastName}</TableCell>
                  <TableCell>{r.symptoms}</TableCell>
                  <TableCell className="text-xs">{r.treatment ?? '—'}</TableCell>
                  <TableCell className="text-xs">{formatDate(r.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Syringe className="h-4 w-4" /> Vacunación</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Vacuna</TableHead>
                <TableHead>Dosis</TableHead>
                <TableHead>Aplicada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vaccinations.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.student.user.firstName} {v.student.user.lastName}</TableCell>
                  <TableCell>{v.vaccineName}</TableCell>
                  <TableCell>{v.dose}</TableCell>
                  <TableCell className="text-xs">{formatDate(v.appliedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
