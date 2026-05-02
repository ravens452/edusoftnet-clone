import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Database, Server, Settings, Activity } from 'lucide-react';

export default async function ConfiguracionPage() {
  await requireRole('ADMIN');

  const [users, students, courses, sections, payments] = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.course.count(),
    prisma.section.count(),
    prisma.payment.count(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Estado del sistema" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Usuarios totales" value={users} icon={Server} />
        <StatCard label="Estudiantes" value={students} icon={Database} tone="secondary" />
        <StatCard label="Cursos" value={courses} icon={Settings} />
        <StatCard label="Pagos registrados" value={payments} icon={Activity} tone="success" />
      </div>

      <Card>
        <CardHeader><CardTitle>Información del sistema</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between border-b border-[var(--border)] pb-2">
            <span className="text-[var(--muted-foreground)]">Versión</span>
            <Badge variant="outline">1.0.0-clone</Badge>
          </div>
          <div className="flex justify-between border-b border-[var(--border)] pb-2">
            <span className="text-[var(--muted-foreground)]">Base de datos</span>
            <span>SQLite (Prisma 7)</span>
          </div>
          <div className="flex justify-between border-b border-[var(--border)] pb-2">
            <span className="text-[var(--muted-foreground)]">Framework</span>
            <span>Next.js 16 + React 19</span>
          </div>
          <div className="flex justify-between border-b border-[var(--border)] pb-2">
            <span className="text-[var(--muted-foreground)]">Secciones activas</span>
            <span>{sections}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Módulos del sistema</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['eclass', 'echat', 'efamily', 'onTime', 'elibrary', 'ecare', 'edrive', 'edocuments', 'emonitor', 'tesoreria', 'admision', 'porteria'].map((m) => (
              <div key={m} className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 p-3 text-center text-sm font-medium">
                {m}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
