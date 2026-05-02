import { requireSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Users, GraduationCap, CalendarCheck, ExternalLink, Building2 } from 'lucide-react';

export default async function SiagiePage() {
  const user = await requireSession();
  if (!['ADMIN', 'DIRECTION', 'SECRETARY'].includes(user.role)) redirect('/dashboard');

  const [students, finals, attendance, year] = await Promise.all([
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.finalScore.count(),
    prisma.attendanceRecord.count(),
    prisma.schoolYear.findFirst({ where: { isActive: true } }),
  ]);

  const exports = [
    {
      title: 'Nómina de matrícula',
      desc: 'Estudiantes matriculados por nivel, grado y sección con datos del apoderado',
      url: '/api/siagie/matricula',
      icon: Users,
      count: `${students} alumnos`,
    },
    {
      title: 'Acta consolidada de notas',
      desc: 'Promedios finales por curso y bimestre — formato compatible con SIAGIE',
      url: '/api/siagie/notas',
      icon: GraduationCap,
      count: `${finals} registros`,
    },
    {
      title: 'Reporte de asistencia',
      desc: 'Asistencia diaria por estudiante con estados (presente / tardanza / ausente / justificado)',
      url: '/api/siagie/asistencia',
      icon: CalendarCheck,
      count: `${attendance} marcas`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="SIAGIE / UGEL"
        description="Reportes oficiales para el MINEDU vía SIAGIE"
      />

      <Card className="border-[var(--secondary)]/30 bg-[var(--secondary)]/5">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-[var(--secondary)]/15 grid place-items-center text-[var(--secondary)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex-1 text-sm">
            <div className="font-semibold">¿Cómo funciona la conexión con UGEL?</div>
            <p className="text-[var(--muted-foreground)] mt-1">
              Los colegios privados en Perú reportan a la UGEL local a través de
              <strong> SIAGIE</strong> (Sistema de Información de Apoyo a la Gestión de la Institución
              Educativa). Esta plataforma <em>no se conecta directamente</em> al portal de SIAGIE — eso
              requiere acceso oficial del director con sus credenciales — pero genera los archivos
              en el formato que SIAGIE acepta para que se carguen ahí.
            </p>
            <div className="mt-2">
              <a
                href="https://siagie.minedu.gob.pe"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] hover:underline inline-flex items-center gap-1 text-xs"
              >
                Ir al portal SIAGIE <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Año escolar activo" value={year?.year ?? '—'} icon={Building2} />
        <StatCard label="Última sincronización" value="Manual" icon={Download} hint="Sube el CSV a SIAGIE" tone="warning" />
        <StatCard label="Estado UGEL" value="OK" icon={CalendarCheck} tone="success" hint="Sin reportes vencidos" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {exports.map((e) => {
          const Icon = e.icon;
          return (
            <Card key={e.url}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-[var(--primary)]/10 grid place-items-center text-[var(--primary)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base">{e.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[var(--muted-foreground)]">{e.desc}</p>
                <Badge variant="outline">{e.count}</Badge>
                <a href={e.url} download>
                  <Button size="sm" className="w-full gap-2">
                    <Download className="h-4 w-4" /> Descargar CSV
                  </Button>
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Otros reportes oficiales</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--muted-foreground)] space-y-2">
          <p>Estos reportes están en el modelo de datos pero todavía no en la UI:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Acta de evaluación final (formato Resolución MINEDU)</li>
            <li>Cuadro estadístico anual</li>
            <li>Nómina de docentes</li>
            <li>Plan Anual de Trabajo (PAT) → emonitor</li>
            <li>Constancias de matrícula y de notas</li>
          </ul>
          <p className="pt-2 text-xs">
            En la plataforma real edusoftnet, esto se sincroniza directo con la API de SIAGIE para
            que dirección no tenga que subir archivos a mano.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
