'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAssignmentAction } from './actions';

const TYPES = [
  { v: 'HOMEWORK', l: 'Tarea' },
  { v: 'PROJECT',  l: 'Proyecto' },
  { v: 'QUIZ',     l: 'Evaluación' },
  { v: 'EXAM',     l: 'Examen' },
  { v: 'PRACTICE', l: 'Práctica' },
  { v: 'FORUM',    l: 'Foro' },
];

export function NewAssignmentDialog({ courses }: { courses: { id: string; label: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [courseAssignmentId, setCourseAssignmentId] = useState('');
  const [type, setType] = useState('HOMEWORK');

  const defaultDue = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0);
    return d.toISOString().slice(0, 16);
  })();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('courseAssignmentId', courseAssignmentId);
    fd.set('type', type);
    start(async () => {
      const res = await createAssignmentAction(fd);
      if (res?.error) setError(res.error);
      else { setOpen(false); setCourseAssignmentId(''); setType('HOMEWORK'); router.refresh(); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Nueva tarea</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Crear tarea / evaluación</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Curso · Sección</Label>
            <Select value={courseAssignmentId} onValueChange={setCourseAssignmentId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxScore">Nota máxima</Label>
              <Input type="number" id="maxScore" name="maxScore" defaultValue={20} min={1} max={100} step={0.5} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required maxLength={200} placeholder="Ej: Práctica de fracciones" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Fecha de entrega</Label>
            <Input type="datetime-local" id="dueDate" name="dueDate" defaultValue={defaultDue} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción / instrucciones</Label>
            <Textarea id="description" name="description" rows={4} maxLength={2000} placeholder="Qué deben hacer, cómo entregar, criterios…" />
          </div>
          {error && <p className="text-sm text-[var(--destructive)] bg-[var(--soft-danger)] rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="submit" disabled={pending || !courseAssignmentId}>{pending ? 'Guardando…' : 'Crear'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
