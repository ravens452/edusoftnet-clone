'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { createWindowAction } from './actions';

export function NewWindowForm({
  periods,
  sections,
  courses,
}: {
  periods: { id: string; name: string }[];
  sections: { id: string; label: string }[];
  courses: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<'GLOBAL' | 'LEVEL' | 'GRADE' | 'SECTION' | 'COURSE'>('GLOBAL');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createWindowAction(fd);
      if ('error' in res && res.error) { setError(res.error); return; }
      (e.target as HTMLFormElement).reset();
      setOpen(false);
      setScope('GLOBAL');
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="default" className="gap-2">
        <Plus className="h-4 w-4" /> Nueva ventana de captura
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Nueva ventana de captura</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Ej. Captura Mayo — I Bimestre" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodId">Bimestre</Label>
              <select
                id="periodId" name="periodId" required
                className="h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] px-3 text-sm"
              >
                <option value="">— seleccionar —</option>
                {periods.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opensAt">Abre el</Label>
              <Input id="opensAt" name="opensAt" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closesAt">Cierra el</Label>
              <Input id="closesAt" name="closesAt" type="datetime-local" required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scope">Alcance</Label>
              <select
                id="scope" name="scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as typeof scope)}
                className="h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] px-3 text-sm"
              >
                <option value="GLOBAL">Toda la institución</option>
                <option value="LEVEL">Por nivel</option>
                <option value="SECTION">Por sección</option>
                <option value="COURSE">Por curso</option>
              </select>
            </div>
            {scope === 'LEVEL' && (
              <div className="space-y-2">
                <Label htmlFor="level">Nivel</Label>
                <select id="level" name="level" required className="h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] px-3 text-sm">
                  <option value="INICIAL">Inicial</option>
                  <option value="PRIMARIA">Primaria</option>
                  <option value="SECUNDARIA">Secundaria</option>
                </select>
              </div>
            )}
            {scope === 'SECTION' && (
              <div className="space-y-2">
                <Label htmlFor="sectionId">Sección</Label>
                <select id="sectionId" name="sectionId" required className="h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] px-3 text-sm">
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            )}
            {scope === 'COURSE' && (
              <div className="space-y-2">
                <Label htmlFor="courseId">Curso</Label>
                <select id="courseId" name="courseId" required className="h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] px-3 text-sm">
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Aviso o instrucción adicional para los docentes" />
          </div>

          {error && <p className="text-sm text-[var(--destructive)] bg-[var(--soft-danger)] rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>{pending ? 'Creando…' : 'Crear ventana'}</Button>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); setScope('GLOBAL'); }}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
