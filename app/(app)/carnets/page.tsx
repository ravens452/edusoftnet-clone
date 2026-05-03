import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { CarnetCard, type CarnetData } from './carnet-card';
import { PrintButton } from './print-button';
import './carnet.css';

const LEVEL_LABEL: Record<string, string> = {
  PRESCHOOL: 'Inicial',
  PRIMARY:   'Primaria',
  SECONDARY: 'Secundaria',
};

async function loadCarnets(studentIds?: string[]): Promise<CarnetData[]> {
  const where: any = studentIds ? { id: { in: studentIds } } : {};
  const students = await prisma.student.findMany({
    where,
    include: {
      user: true,
      enrollments: { include: { section: { include: { grade: true } } }, take: 1, orderBy: { id: 'desc' } },
    },
    orderBy: { user: { lastName: 'asc' } },
    take: 200,
  });

  return students.map((s) => {
    const enr = s.enrollments[0];
    const level = enr ? LEVEL_LABEL[enr.section.grade.level] || enr.section.grade.level : '—';
    return {
      id: s.id,
      firstName: s.user.firstName,
      lastName: s.user.lastName,
      studentCode: s.studentCode,
      level,
      grade: enr ? enr.section.grade.name : '—',
      section: enr ? enr.section.name : '—',
      birthDate: s.birthDate.toISOString(),
      bloodType: s.bloodType,
      emergencyContact: s.emergencyContact,
      photoUrl: s.user.avatarUrl,
    };
  });
}

export default async function CarnetsPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const user = await requireSession();
  const params = await searchParams;
  const isStaff = ['ADMIN', 'DIRECTION', 'SECRETARY'].includes(user.role);

  // ─── PARENT: solo carnets de hijos ───
  if (user.role === 'PARENT') {
    const p = await prisma.parent.findUnique({
      where: { userId: user.id }, include: { children: true },
    });
    const ids = p?.children.map((c) => c.studentId) ?? [];
    const carnets = await loadCarnets(ids);
    return (
      <div className="space-y-6">
        <PageHeader
          title="Carnets escolares"
          description="Carnet vigente del año en curso"
          action={<PrintButton />}
        />
        <div className="grid sm:grid-cols-2 gap-4 carnet-print-grid">
          {carnets.length === 0 ? <p className="text-sm text-[var(--muted-foreground)]">Sin hijos registrados.</p>
            : carnets.map((c) => <CarnetCard key={c.id} s={c} />)}
        </div>
      </div>
    );
  }

  // ─── STUDENT: solo el suyo ───
  if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id } });
    const carnets = s ? await loadCarnets([s.id]) : [];
    return (
      <div className="space-y-6">
        <PageHeader title="Mi carnet" description="Tu carnet escolar vigente" action={<PrintButton />} />
        <div className="max-w-md">
          {carnets[0] ? <CarnetCard s={carnets[0]} /> : <p className="text-sm text-[var(--muted-foreground)]">Sin perfil.</p>}
        </div>
      </div>
    );
  }

  // ─── STAFF (ADMIN/DIRECTION/SECRETARY): todos, con filtro por sección ───
  if (!isStaff) {
    return <p className="text-sm text-[var(--muted-foreground)]">No disponible para tu rol.</p>;
  }

  const sections = await prisma.section.findMany({
    include: { grade: true, _count: { select: { enrollments: true } } },
    orderBy: [{ grade: { ordinal: 'asc' } }, { name: 'asc' }],
  });
  const filterSec = params.section || '';
  let studentIds: string[] | undefined;
  if (filterSec) {
    const enr = await prisma.enrollment.findMany({ where: { sectionId: filterSec }, select: { studentId: true } });
    studentIds = enr.map((e) => e.studentId);
  }
  const carnets = await loadCarnets(studentIds);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carnets escolares"
        description={`${carnets.length} carnets disponibles`}
        action={<PrintButton label={`Imprimir ${carnets.length}`} />}
      />

      {/* Filtro por sección */}
      <Card className="print:hidden">
        <CardContent className="p-3 flex flex-wrap gap-1.5">
          <a
            href="/carnets"
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              !filterSec ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >Todas las secciones</a>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`/carnets?section=${s.id}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                filterSec === s.id ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}
            >{s.grade.name} "{s.name}" <span className="opacity-60">· {s._count.enrollments}</span></a>
          ))}
        </CardContent>
      </Card>

      {/* Grid de carnets */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 carnet-print-grid">
        {carnets.length === 0
          ? <p className="text-sm text-[var(--muted-foreground)] col-span-full">Sin carnets para esta sección.</p>
          : carnets.map((c) => <CarnetCard key={c.id} s={c} />)}
      </div>
    </div>
  );
}
