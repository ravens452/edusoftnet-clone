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
import { createCaseAction } from './actions';

export function NewCaseDialog({ students }: { students: { id: string; label: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState('');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('studentId', studentId);
    start(async () => {
      const res = await createCaseAction(fd);
      if (res?.error) setError(res.error);
      else { setOpen(false); setStudentId(''); router.refresh(); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Abrir caso</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Abrir caso de psicología</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Alumno</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Título del caso</Label>
            <Input id="title" name="title" required maxLength={200} placeholder="Ej: Acompañamiento ante duelo familiar" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción inicial</Label>
            <Textarea id="description" name="description" rows={5} required maxLength={3000} placeholder="Contexto, motivo de la derivación, observaciones del docente, primeras acciones…" />
          </div>
          {error && <p className="text-sm text-[var(--destructive)] bg-[var(--soft-danger)] rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="submit" disabled={pending || !studentId}>{pending ? 'Guardando…' : 'Abrir caso'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
