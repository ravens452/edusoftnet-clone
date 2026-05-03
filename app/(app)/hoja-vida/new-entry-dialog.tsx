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
import { createLifeEntryAction } from './actions';

const TYPES = [
  { v: 'ACHIEVEMENT', l: '🏆 Logro' },
  { v: 'RECOGNITION', l: '⭐ Reconocimiento' },
  { v: 'COMMENT',     l: '💬 Comentario' },
  { v: 'CONDUCT',     l: '⚠️ Conducta' },
  { v: 'INCIDENT',    l: '🚨 Incidencia' },
];

export function NewLifeEntryDialog({ students }: { students: { id: string; label: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState('');
  const [type, setType] = useState('ACHIEVEMENT');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('studentId', studentId);
    fd.set('type', type);
    start(async () => {
      const res = await createLifeEntryAction(fd);
      if (res?.error) setError(res.error);
      else { setOpen(false); setStudentId(''); router.refresh(); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Nueva entrada</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Registrar entrada en hoja de vida</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Alumno</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar alumno" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required maxLength={200} placeholder="Ej: Primer puesto en concurso de oratoria" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Detalle</Label>
            <Textarea id="body" name="body" rows={4} required maxLength={2000} placeholder="Contexto, evidencia, próximos pasos…" />
          </div>
          {error && <p className="text-sm text-[var(--destructive)] bg-[var(--soft-danger)] rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="submit" disabled={pending || !studentId}>{pending ? 'Guardando…' : 'Registrar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
