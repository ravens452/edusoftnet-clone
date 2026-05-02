import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

function GradeCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-[var(--muted-foreground)]">—</span>;
  const tone = value >= 18 ? 'success' : value >= 14 ? 'default' : value >= 11 ? 'warning' : 'destructive';
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-semibold">{value.toFixed(1)}</span>
      <Badge variant={tone} className="text-[10px]">{value >= 18 ? 'AD' : value >= 14 ? 'A' : value >= 11 ? 'B' : 'C'}</Badge>
    </span>
  );
}

export default async function NotasPage() {
  const user = await requireSession();
  const periods = await prisma.period.findMany({ orderBy: { ordinal: 'asc' } });
  const periodIds = periods.map((p) => p.id);

  const studentIds: string[] = [];
  let pageTitle = 'Calificaciones';
  let description = '';
  let isTeacher = false;
  let teacherAssignments: { id: string; courseId: string; sectionId: string; courseName: string; sectionName: string; gradeName: string }[] = [];

  if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id } });
    if (s) studentIds.push(s.id);
    description = 'Tu boleta de notas';
  } else if (user.role === 'PARENT') {
    const p = await prisma.parent.findUnique({ where: { userId: user.id }, include: { children: true } });
    if (p) studentIds.push(...p.children.map((c) => c.studentId));
    description = 'Notas de tus hijos';
  } else if (user.role === 'TEACHER') {
    const t = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (t) {
      const cas = await prisma.courseAssignment.findMany({
        where: { teacherId: t.id },
        include: { course: true, section: { include: { grade: true } } },
      });
      teacherAssignments = cas.map((c) => ({
        id: c.id, courseId: c.courseId, sectionId: c.sectionId,
        courseName: c.course.name, sectionName: c.section.name, gradeName: c.section.grade.name,
      }));
    }
    isTeacher = true;
    description = 'Promedios por curso y sección';
  } else {
    // direction/admin: muestra todo
    description = 'Promedios consolidados';
  }

  if (isTeacher) {
    return (
      <div>
        <PageHeader title={pageTitle} description={description} />
        <Tabs defaultValue={teacherAssignments[0]?.id || 'none'}>
          <TabsList className="flex-wrap h-auto">
            {teacherAssignments.map((a) => (
              <TabsTrigger key={a.id} value={a.id}>
                {a.gradeName} {a.sectionName} · {a.courseName}
              </TabsTrigger>
            ))}
          </TabsList>
          {teacherAssignments.map(async (a) => {
            const enrollments = await prisma.enrollment.findMany({
              where: { sectionId: a.sectionId },
              include: { student: { include: { user: true } } },
              orderBy: { student: { user: { lastName: 'asc' } } },
            });
            const finalScores = await prisma.finalScore.findMany({
              where: { courseAssignmentId: a.id, studentId: { in: enrollments.map((e) => e.studentId) } },
            });
            const lookup = new Map<string, Record<string, number>>();
            for (const fs of finalScores) {
              if (!lookup.has(fs.studentId)) lookup.set(fs.studentId, {});
              lookup.get(fs.studentId)![fs.periodId] = fs.value;
            }
            const avg = (m: Record<string, number>) => {
              const vals = Object.values(m);
              return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
            };
            return (
              <TabsContent key={a.id} value={a.id}>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estudiante</TableHead>
                          {periods.map((p) => <TableHead key={p.id}>{p.name}</TableHead>)}
                          <TableHead>Promedio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollments.map((e) => {
                          const m = lookup.get(e.studentId) || {};
                          return (
                            <TableRow key={e.studentId}>
                              <TableCell className="font-medium">{e.student.user.lastName}, {e.student.user.firstName}</TableCell>
                              {periods.map((p) => (
                                <TableCell key={p.id}><GradeCell value={m[p.id] ?? null} /></TableCell>
                              ))}
                              <TableCell><GradeCell value={avg(m)} /></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    );
  }

  // Student / parent / direction view: agrupa por estudiante, una tabla por hijo
  const students = studentIds.length
    ? await prisma.student.findMany({
        where: { id: { in: studentIds } },
        include: { user: true, enrollments: { include: { section: { include: { grade: true } } } } },
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title={pageTitle} description={description} />
      {students.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">Sin datos.</p>
      ) : (
        students.map(async (s) => {
          const enr = s.enrollments[0];
          const finals = await prisma.finalScore.findMany({
            where: { studentId: s.id, periodId: { in: periodIds } },
            include: { courseAssignment: { include: { course: true } } },
          });
          const map = new Map<string, { course: string; perPeriod: Record<string, number> }>();
          for (const fs of finals) {
            const cId = fs.courseAssignment.courseId;
            if (!map.has(cId)) map.set(cId, { course: fs.courseAssignment.course.name, perPeriod: {} });
            map.get(cId)!.perPeriod[fs.periodId] = fs.value;
          }
          const courseRows = [...map.values()].sort((a, b) => a.course.localeCompare(b.course));
          return (
            <Card key={s.id}>
              <CardContent className="p-0">
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{s.user.firstName} {s.user.lastName}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {enr ? `${enr.section.grade.name} "${enr.section.name}"` : 'Sin matrícula'} · {s.studentCode}
                    </div>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      {periods.map((p) => <TableHead key={p.id}>{p.name}</TableHead>)}
                      <TableHead>Promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseRows.map((r) => {
                      const vals = Object.values(r.perPeriod);
                      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                      return (
                        <TableRow key={r.course}>
                          <TableCell className="font-medium">{r.course}</TableCell>
                          {periods.map((p) => <TableCell key={p.id}><GradeCell value={r.perPeriod[p.id] ?? null} /></TableCell>)}
                          <TableCell><GradeCell value={avg} /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
