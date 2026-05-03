import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GradingWindowBanner } from '@/components/grading-window-banner';
import { ScoreCell } from './score-cell';
import { isGradingOpenFor } from '@/lib/grading-window';

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

  let pageTitle = 'Calificaciones';
  let description = '';

  // ── TEACHER VIEW ──
  if (user.role === 'TEACHER') {
    description = 'Registra y consulta las notas de tus cursos';
    const t = await prisma.teacher.findUnique({ where: { userId: user.id } });
    const cas = t
      ? await prisma.courseAssignment.findMany({
          where: { teacherId: t.id },
          include: { course: true, section: { include: { grade: true } } },
        })
      : [];

    // Pre-fetch todo antes de renderizar (server components no soportan map async en JSX)
    const tabsData = await Promise.all(
      cas.map(async (a) => {
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
        // Verificar ventana por periodo para este courseAssignment
        const canEditByPeriod: Record<string, boolean> = {};
        for (const p of periods) {
          const r = await isGradingOpenFor({
            periodId: p.id,
            level: a.section.grade.level,
            gradeId: a.section.gradeId,
            sectionId: a.sectionId,
            courseId: a.courseId,
          });
          canEditByPeriod[p.id] = r.open;
        }
        return {
          id: a.id,
          courseAssignmentId: a.id,
          courseName: a.course.name,
          gradeName: a.section.grade.name,
          sectionName: a.section.name,
          enrollments,
          lookup,
          canEditByPeriod,
        };
      })
    );

    const avg = (m: Record<string, number>) => {
      const vals = Object.values(m);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    if (!tabsData.length) {
      return (
        <div>
          <PageHeader title={pageTitle} description={description} />
          <GradingWindowBanner />
          <Card><CardContent className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            Aún no tienes cursos asignados.
          </CardContent></Card>
        </div>
      );
    }

    return (
      <div>
        <PageHeader title={pageTitle} description={description} />
        <GradingWindowBanner />
        <Tabs defaultValue={tabsData[0].id}>
          <TabsList className="flex-wrap h-auto">
            {tabsData.map((a) => (
              <TabsTrigger key={a.id} value={a.id}>
                {a.gradeName} {a.sectionName} · {a.courseName}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabsData.map((a) => (
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
                      {a.enrollments.map((e) => {
                        const m = a.lookup.get(e.studentId) || {};
                        const studentName = `${e.student.user.firstName} ${e.student.user.lastName}`;
                        return (
                          <TableRow key={e.studentId}>
                            <TableCell className="font-medium">{e.student.user.lastName}, {e.student.user.firstName}</TableCell>
                            {periods.map((p) => (
                              <TableCell key={p.id}>
                                <ScoreCell
                                  value={m[p.id] ?? null}
                                  studentId={e.studentId}
                                  studentName={studentName}
                                  courseAssignmentId={a.courseAssignmentId}
                                  periodId={p.id}
                                  periodName={p.name}
                                  courseName={a.courseName}
                                  canEdit={!!a.canEditByPeriod[p.id]}
                                />
                              </TableCell>
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
          ))}
        </Tabs>
      </div>
    );
  }

  // ── STUDENT / PARENT / DIRECTION ──
  const studentIds: string[] = [];
  if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id } });
    if (s) studentIds.push(s.id);
    description = 'Tu boleta de notas';
  } else if (user.role === 'PARENT') {
    const p = await prisma.parent.findUnique({ where: { userId: user.id }, include: { children: true } });
    if (p) studentIds.push(...p.children.map((c) => c.studentId));
    description = 'Notas de tus hijos';
  } else {
    // DIRECTION / ADMIN: consolidado por sección con promedios
    description = 'Promedios consolidados por sección';
    const sections = await prisma.section.findMany({
      include: {
        grade: true,
        enrollments: { include: { student: { include: { user: true } } }, take: 30 },
      },
      orderBy: [{ grade: { ordinal: 'asc' } }, { name: 'asc' }],
    });

    const sectionBlocks = await Promise.all(
      sections.map(async (sec) => {
        const studentIdsInSec = sec.enrollments.map((e) => e.studentId);
        if (!studentIdsInSec.length) return { section: sec, rows: [] };
        const finals = await prisma.finalScore.findMany({
          where: { studentId: { in: studentIdsInSec }, periodId: { in: periodIds } },
          include: { courseAssignment: { include: { course: true } } },
        });
        const byStudent = new Map<string, number[]>();
        for (const fs of finals) {
          if (!byStudent.has(fs.studentId)) byStudent.set(fs.studentId, []);
          byStudent.get(fs.studentId)!.push(fs.value);
        }
        const rows = sec.enrollments.map((e) => {
          const vals = byStudent.get(e.studentId) || [];
          const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
          return { student: e.student, avg, courseCount: new Set(finals.filter((f) => f.studentId === e.studentId).map((f) => f.courseAssignment.courseId)).size };
        }).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
        return { section: sec, rows };
      })
    );

    return (
      <div className="space-y-6">
        <PageHeader title={pageTitle} description={description} />
        {sectionBlocks.filter((b) => b.rows.length).length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Sin datos.</p>
        ) : sectionBlocks.filter((b) => b.rows.length).map((b) => (
          <Card key={b.section.id}>
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <div className="font-semibold">{b.section.grade.name} "{b.section.name}"</div>
                <div className="text-xs text-[var(--muted-foreground)]">{b.rows.length} alumnos</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Cursos con nota</TableHead>
                    <TableHead>Promedio general</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {b.rows.map((r) => (
                    <TableRow key={r.student.id}>
                      <TableCell className="font-medium">{r.student.user.lastName}, {r.student.user.firstName}</TableCell>
                      <TableCell className="text-sm text-[var(--muted-foreground)]">{r.courseCount}</TableCell>
                      <TableCell><GradeCell value={r.avg} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const students = studentIds.length
    ? await prisma.student.findMany({
        where: { id: { in: studentIds } },
        include: { user: true, enrollments: { include: { section: { include: { grade: true } } } } },
      })
    : [];

  // Pre-fetch finals + agrupa por curso para cada alumno
  const rows = await Promise.all(
    students.map(async (s) => {
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
      const enr = s.enrollments[0];
      return { student: s, enrollment: enr, courseRows };
    })
  );

  return (
    <div className="space-y-6">
      <PageHeader title={pageTitle} description={description} />
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">Sin datos.</p>
      ) : (
        rows.map((r) => (
          <Card key={r.student.id}>
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <div className="font-semibold">{r.student.user.firstName} {r.student.user.lastName}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {r.enrollment ? `${r.enrollment.section.grade.name} "${r.enrollment.section.name}"` : 'Sin matrícula'} · {r.student.studentCode}
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
                  {r.courseRows.map((cr) => {
                    const vals = Object.values(cr.perPeriod);
                    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                    return (
                      <TableRow key={cr.course}>
                        <TableCell className="font-medium">{cr.course}</TableCell>
                        {periods.map((p) => <TableCell key={p.id}><GradeCell value={cr.perPeriod[p.id] ?? null} /></TableCell>)}
                        <TableCell><GradeCell value={avg} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
