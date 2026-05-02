import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { File, Image, FileVideo, Music, FileSpreadsheet } from 'lucide-react';
import { formatDate } from '@/lib/utils';

function iconFor(mime: string) {
  if (mime.startsWith('image')) return Image;
  if (mime.startsWith('video')) return FileVideo;
  if (mime.startsWith('audio')) return Music;
  if (mime.includes('spreadsheet') || mime.includes('excel')) return FileSpreadsheet;
  return File;
}

function bytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default async function EdrivePage() {
  await requireSession();
  const files = await prisma.driveFile.findMany({
    orderBy: { uploadedAt: 'desc' }, take: 100,
    include: { uploader: true },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="edrive" description="Almacenamiento institucional" />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Archivo</TableHead>
                <TableHead>Carpeta</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Compartido</TableHead>
                <TableHead>Subido</TableHead>
                <TableHead>Por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((f) => {
                const Icon = iconFor(f.mimeType);
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[var(--primary)]" /> {f.filename}
                    </TableCell>
                    <TableCell><Badge variant="muted">{f.folder ?? '/'}</Badge></TableCell>
                    <TableCell className="text-xs">{bytes(f.sizeBytes)}</TableCell>
                    <TableCell>{f.isShared ? <Badge variant="secondary">Compartido</Badge> : <Badge variant="muted">Privado</Badge>}</TableCell>
                    <TableCell className="text-xs">{formatDate(f.uploadedAt)}</TableCell>
                    <TableCell className="text-xs">{f.uploader.firstName} {f.uploader.lastName}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
