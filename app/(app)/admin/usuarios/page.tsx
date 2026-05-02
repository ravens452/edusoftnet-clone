import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/navigation';
import { formatDate } from '@/lib/utils';

export default async function UsuariosPage() {
  await requireRole('ADMIN');
  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
    take: 200,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Usuarios del sistema" description="Administración de cuentas" />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.username}</TableCell>
                  <TableCell>{u.firstName} {u.lastName}</TableCell>
                  <TableCell><Badge variant="outline">{ROLE_LABELS[u.role]}</Badge></TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell><Badge variant={u.isActive ? 'success' : 'destructive'}>{u.isActive ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                  <TableCell className="text-xs">{formatDate(u.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
