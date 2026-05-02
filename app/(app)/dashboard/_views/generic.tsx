import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_LABELS } from '@/lib/navigation';
import type { Role } from '@/lib/generated/prisma/enums';

export default function GenericDashboard({ firstName, role }: { firstName: string; role: Role }) {
  return (
    <div className="space-y-6">
      <PageHeader title={`Hola, ${firstName}`} description={`Vista de ${ROLE_LABELS[role]}`} />
      <Card>
        <CardHeader>
          <CardTitle>Bienvenida</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--muted-foreground)]">
            Usa el menú lateral para acceder a los módulos disponibles para tu rol.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
