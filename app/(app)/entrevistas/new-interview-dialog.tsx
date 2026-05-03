'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { createInterviewAction } from './actions';

export type ParentOption = { id: string; label: string };
export type TeacherOption = { id: string; label: string };

export function NewInterviewDialog({
  parents,
  teachers,
  isAdmin,
}: {
  parents: ParentOption[];
  teachers: TeacherOption[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [parentId, setParentId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [mode, setMode] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON');

  // Default: hoy + 1 día a las 15:00 — formato datetime-local
  const defaultWhen = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(15, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  })();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('parentId', parentId);
    if (isAdmin && teacherId) fd.set('teacherId', teacherId);
    fd.set('mode', mode);
    start(async () => {
      const res = await createInterviewAction(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
        setParentId('');
        setTeacherId('');
        setMode('IN_PERSON');
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Nueva entrevista
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar entrevista con apoderado</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {isAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="teacherId">Docente</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar docente" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="parentId">Apoderado</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar apoderado" /></SelectTrigger>
              <SelectContent>
                {parents.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="scheduledAt">Fecha y hora</Label>
              <Input type="datetime-local" id="scheduledAt" name="scheduledAt" defaultValue={defaultWhen} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="durationMin">Duración (min)</Label>
              <Input type="number" id="durationMin" name="durationMin" defaultValue={30} min={10} max={240} step={5} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Modalidad</Label>
            <div className="flex gap-2">
              <button type="button"
                onClick={() => setMode('IN_PERSON')}
                className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  mode === 'IN_PERSON'
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}>Presencial</button>
              <button type="button"
                onClick={() => setMode('VIRTUAL')}
                className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  mode === 'VIRTUAL'
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}>Virtual</button>
            </div>
          </div>
          {mode === 'VIRTUAL' && (
            <div className="space-y-1.5">
              <Label htmlFor="meetingUrl">Link de la reunión (opcional)</Label>
              <Input type="url" id="meetingUrl" name="meetingUrl" placeholder="https://meet.google.com/…" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="topic">Tema de la entrevista</Label>
            <Input id="topic" name="topic" placeholder="Avance académico, comportamiento…" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Acuerdos, contexto previo…" />
          </div>
          {error && (
            <p className="text-sm text-[var(--destructive)] bg-[var(--soft-danger)] rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="submit" disabled={pending || !parentId || (isAdmin && !teacherId)}>
              {pending ? 'Guardando…' : 'Agendar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
