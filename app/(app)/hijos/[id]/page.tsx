import { notFound, redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, CalendarCheck, Wallet, BookOpen } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function HijoDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  if (user.role === 'PARENT') {
    const p = await prisma.parent.findUnique({ where: { userId: user.id }, include: { children: true } });
    if (!p?.children.some((c) => c.studentId === id)) redirect('/hijos');
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: true, enrollments: { include: { section: { include: { grade: true } } } } },
  });
  if (!student) return notFound();
  const enr = student.enrollments[0];

  const [scoresAvg, attendance, recentScores, invoices, lifeEntries] = await Promise.all([
    prisma.score.aggregate({ _avg: { value: true }, where: { studentId: id } }),
    prisma.attendanceRecord.findMany({ where: { studentId: id }, take: 60, orderBy: { date: 'desc' } }),
    prisma.score.findMany({ where: { studentId: id }, take: 8, orderBy: { evaluatedAt: 'desc' }, include: { courseAssignment: { include: { course: true } } } }),
    prisma.invoice.findMany({ where: { studentId: id }, orderBy: { dueDate: 'desc' }, take: 10 }),
    prisma.studentLifeEntry.findMany({ where: { studentId: id }, orderBy: { date: 'desc' }, take: 10 }),
  ]);

  const present = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const rate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  const pendingInv = invoices.filter((i) => i.status !== 'PAID').reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${student.user.firstName} ${student.user.lastName}`}
        description={`${enr ? `${enr.section.grade.name} "${enr.section.name}"` : 'Sin matrícula'} · ${student.studentCode}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Promedio" value={scoresAvg._avg.value?.toFixed(1) ?? '—'} icon={GraduationCap} />
        <StatCard label="Asistencia" value={`${rate}%`} icon={CalendarCheck} tone={rate >= 90 ? 'success' : 'warning'} />
        <StatCard label="Saldo pendiente" value={formatCurrency(pendingInv)} icon={Wallet} tone={pendingInv > 0 ? 'warning' : 'success'} />
        <StatCard label="Edad" value={new Date().getFullYear() - new Date(student.birthDate).getFullYear()} icon={BookOpen} tone="secondary" />
      </div>

      <Tabs defaultValue="notas">
        <TabsList>
          <TabsTrigger value="notas">Notas recientes</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="hoja">Hoja de vida</TabsTrigger>
        </TabsList>
        <TabsContent value="notas">
          <Card>
            <CardContent className="p-0 divide-y divide-[var(--border)]">
              {recentScores.map((s) => (
                <div key={s.id} className="px-5 py-3 flex justify-between text-sm">
                  <span>{s.courseAssignment.course.name}</span>
                  <span className="font-semibold">{s.value.toFixed(1)} <Badge variant="outline" className="ml-2 text-[10px]">{s.letterGrade}</Badge></span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pagos">
          <Card>
            <CardContent className="p-0 divide-y divide-[var(--border)]">
              {invoices.map((i) => (
                <div key={i.id} className="px-5 py-3 flex justify-between text-sm">
                  <div>
                    <div className="font-medium">{i.concept}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">vence {formatDate(i.dueDate)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(i.amount)}</div>
                    <Badge variant={i.status === 'PAID' ? 'success' : i.status === 'OVERDUE' ? 'destructive' : 'warning'}>{i.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="hoja">
          <Card>
            <CardContent className="p-0 divide-y divide-[var(--border)]">
              {lifeEntries.map((l) => (
                <div key={l.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{l.title}</div>
                    <Badge variant="outline">{l.type}</Badge>
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1">{formatDate(l.date)}</div>
                  <p className="text-sm mt-2">{l.body}</p>
                </div>
              ))}
              {lifeEntries.length === 0 && <div className="p-6 text-sm text-[var(--muted-foreground)]">Sin entradas en hoja de vida.</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
