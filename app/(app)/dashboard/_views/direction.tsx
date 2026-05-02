import { prisma } from '@/lib/db';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, Wallet, UserPlus, BookOpen, Calendar, FolderOpen } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function DirectionDashboard({ firstName }: { firstName: string }) {
  const [studentCount, teacherCount, parentCount, sectionCount, paidThisMonth, prospects, openTickets, latestProspects, recentInvoices] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.parent.count(),
    prisma.section.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.prospect.count(),
    prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_REVIEW'] } } }),
    prisma.prospect.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
    prisma.invoice.findMany({ where: { status: 'PAID' }, orderBy: { issuedAt: 'desc' }, take: 8, include: { student: { include: { user: true } } } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={`Bienvenido, ${firstName}`} description="Vista general del colegio" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Estudiantes" value={studentCount} icon={GraduationCap} />
        <StatCard label="Docentes" value={teacherCount} icon={Users} tone="secondary" />
        <StatCard label="Apoderados" value={parentCount} icon={Users} />
        <StatCard label="Secciones" value={sectionCount} icon={BookOpen} tone="secondary" />
        <StatCard label="Recaudado mes" value={formatCurrency(paidThisMonth._sum.amount ?? 0)} icon={Wallet} tone="success" />
        <StatCard label="Prospectos admisión" value={prospects} icon={UserPlus} tone="default" />
        <StatCard label="Tickets abiertos" value={openTickets} icon={FolderOpen} tone={openTickets > 0 ? 'warning' : 'success'} />
        <StatCard label="Hoy" value={formatDate(new Date(), { weekday: 'long' })} icon={Calendar} tone="secondary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Últimos prospectos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {latestProspects.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.childName}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{p.desiredGrade} · {p.contactPhone}</div>
                  </div>
                  <Badge variant={p.stage === 'ENROLLED' ? 'success' : p.stage === 'REJECTED' ? 'destructive' : 'outline'}>
                    {p.stage}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {recentInvoices.map((i) => (
                <li key={i.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{i.student.user.firstName} {i.student.user.lastName}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{i.concept}</div>
                  </div>
                  <span className="font-semibold">{formatCurrency(i.amount)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
