import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { initials, formatDate } from '@/lib/utils';

export default async function HijosPage() {
  const user = await requireSession();
  const p = await prisma.parent.findUnique({
    where: { userId: user.id },
    include: { children: { include: { student: { include: { user: true, enrollments: { include: { section: { include: { grade: true } } } } } } } } },
  });
  if (!p) return <div>Sin perfil de padre</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Mis hijos" description="Información académica" />
      <div className="grid md:grid-cols-2 gap-4">
        {p.children.map((c) => {
          const st = c.student;
          const enr = st.enrollments[0];
          return (
            <Link key={c.studentId} href={`/hijos/${c.studentId}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback>{initials(st.user.firstName, st.user.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{st.user.firstName} {st.user.lastName}</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">
                      {enr ? `${enr.section.grade.name} "${enr.section.name}"` : 'Sin matrícula'} · {st.studentCode}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">
                      Nacimiento: {formatDate(st.birthDate)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
