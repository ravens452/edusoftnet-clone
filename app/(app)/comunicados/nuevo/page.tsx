import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

async function createAnnouncement(formData: FormData) {
  'use server';
  const user = await requireSession();
  const title = String(formData.get('title') || '');
  const body = String(formData.get('body') || '');
  const audience = String(formData.get('audience') || 'ALL');
  if (!title || !body) return;
  await prisma.announcement.create({ data: { title, body, audience, authorId: user.id } });
  redirect('/comunicados');
}

export default async function NuevoComunicadoPage() {
  const user = await requireSession();
  if (!['ADMIN', 'DIRECTION', 'TEACHER', 'SECRETARY'].includes(user.role)) redirect('/comunicados');

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Nuevo comunicado" />
      <Card>
        <CardContent className="p-6">
          <form action={createAnnouncement} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Audiencia</Label>
              <select id="audience" name="audience" className="h-9 w-full rounded-md border border-[var(--input)] bg-[var(--card)] px-3 text-sm">
                <option value="ALL">Todos</option>
                <option value="PARENTS">Padres</option>
                <option value="TEACHERS">Docentes</option>
                <option value="STUDENTS">Estudiantes</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Contenido</Label>
              <Textarea id="body" name="body" rows={8} required />
            </div>
            <Button type="submit">Publicar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
