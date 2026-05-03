'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createWorkshopAction, enrollWorkshopAction } from './actions';

export function NewWorkshopDialog({ teachers }: { teachers: { id: string; label: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState('');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (teacherId) fd.set('teacherId', teacherId);
    start(async () => {
      const res = await createWorkshopAction(fd);
      if (res?.error) setError(res.error);
      else { setOpen(false); setTeacherId(''); router.refresh(); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Nuevo taller</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Crear taller extracurricular</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required maxLength={100} placeholder="Ej: Robótica Lego" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" rows={3} placeholder="Qué se aprende, para qué nivel…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="schedule">Horario</Label>
              <Input id="schedule" name="schedule" placeholder="Mar/Jue 3-5pm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Cupos</Label>
              <Input type="number" id="capacity" name="capacity" defaultValue={20} min={1} max={200} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Docente a cargo (opcional)</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
              <SelectContent>
                {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-[var(--destructive)] bg-[var(--soft-danger)] rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Creando…' : 'Crear'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EnrollWorkshopButton({
  workshopId,
  workshopName,
  students,
}: {
  workshopId: string;
  workshopName: string;
  students: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState('');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set('workshopId', workshopId);
    fd.set('studentId', studentId);
    start(async () => {
      const res = await enrollWorkshopAction(fd);
      if (res?.error) setError(res.error);
      else { setOpen(false); setStudentId(''); router.refresh(); }
    });
  }

  if (!students.length) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 w-full"><UserPlus className="h-3.5 w-3.5" /> Inscribirse</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Inscribir en {workshopName}</DialogTitle></DialogHeader>
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
          {error && <p className="text-sm text-[var(--destructive)] bg-[var(--soft-danger)] rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="submit" disabled={pending || !studentId}>{pending ? 'Inscribiendo…' : 'Confirmar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
