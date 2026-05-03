'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bulkMarkAttendanceAction } from './actions';

type Student = { id: string; label: string };
type Section = { id: string; label: string; students: Student[] };

export function RollCallDialog({ sections }: { sections: Section[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '');
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [statuses, setStatuses] = useState<Record<string, 'PRESENT'|'LATE'|'ABSENT'>>({});

  const section = sections.find((s) => s.id === sectionId);

  useEffect(() => {
    if (!section) return;
    const init: Record<string, any> = {};
    for (const s of section.students) init[s.id] = 'PRESENT';
    setStatuses(init);
  }, [sectionId]);

  function toggle(studentId: string, status: 'PRESENT'|'LATE'|'ABSENT') {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }
  function setAll(status: 'PRESENT'|'LATE'|'ABSENT') {
    if (!section) return;
    const next: Record<string, any> = {};
    for (const s of section.students) next[s.id] = status;
    setStatuses(next);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!section) return;
    const records = section.students.map((s) => ({ studentId: s.id, status: statuses[s.id] || 'PRESENT' }));
    const fd = new FormData();
    fd.set('sectionId', sectionId);
    fd.set('date', date);
    fd.set('records', JSON.stringify(records));
    start(async () => {
      const res = await bulkMarkAttendanceAction(fd);
      if (res?.error) setError(res.error);
      else { setOpen(false); router.refresh(); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><ClipboardCheck className="h-4 w-4" /> Pasar lista</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Pasar lista de asistencia</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sección</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Fecha</Label>
              <Input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          {section && (
            <>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--muted-foreground)]">Marcar todos:</span>
                <button type="button" onClick={() => setAll('PRESENT')} className="px-2 py-1 rounded bg-[var(--soft-success)] text-[var(--success)] hover:opacity-80">Presentes</button>
                <button type="button" onClick={() => setAll('LATE')}    className="px-2 py-1 rounded bg-[var(--soft-warning)] text-[var(--warning)] hover:opacity-80">Tarde</button>
                <button type="button" onClick={() => setAll('ABSENT')}  className="px-2 py-1 rounded bg-[var(--soft-danger)]  text-[var(--destructive)] hover:opacity-80">Ausentes</button>
              </div>
              <div className="border border-[var(--border)] rounded-xl divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
                {section.students.map((st) => {
                  const cur = statuses[st.id] || 'PRESENT';
                  return (
                    <div key={st.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-sm">{st.label}</span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => toggle(st.id, 'PRESENT')}
                          className={`h-8 w-8 rounded grid place-items-center text-xs font-bold transition ${cur==='PRESENT' ? 'bg-[var(--success)] text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--soft-success)]'}`}
                          title="Presente"><Check className="h-4 w-4" /></button>
                        <button type="button" onClick={() => toggle(st.id, 'LATE')}
                          className={`h-8 w-8 rounded grid place-items-center text-xs font-bold transition ${cur==='LATE' ? 'bg-[var(--warning)] text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--soft-warning)]'}`}
                          title="Tarde"><Clock className="h-4 w-4" /></button>
                        <button type="button" onClick={() => toggle(st.id, 'ABSENT')}
                          className={`h-8 w-8 rounded grid place-items-center text-xs font-bold transition ${cur==='ABSENT' ? 'bg-[var(--destructive)] text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--soft-danger)]'}`}
                          title="Ausente"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {error && <p className="text-sm text-[var(--destructive)] bg-[var(--soft-danger)] rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="submit" disabled={pending || !section}>{pending ? 'Guardando…' : `Guardar ${section?.students.length ?? 0} registros`}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
