import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function EdocumentsPage() {
  await requireSession();
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: 'desc' },
    include: { owner: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="edocuments" description="Repositorio institucional con versiones y firma" />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Versión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[var(--primary)]" /> {d.title}
                  </TableCell>
                  <TableCell><Badge variant="outline">{d.category}</Badge></TableCell>
                  <TableCell>v{d.version}</TableCell>
                  <TableCell>
                    {d.signedAt ? (
                      <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Firmado</Badge>
                    ) : (
                      <Badge variant="warning">Borrador</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(d.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
