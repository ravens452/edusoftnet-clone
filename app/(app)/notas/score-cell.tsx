'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveFinalScoreAction } from './actions';

type Props = {
  value: number | null;
  studentId: string;
  studentName: string;
  courseAssignmentId: string;
  periodId: string;
  periodName: string;
  courseName: string;
  canEdit: boolean;
};

export function ScoreCell(props: Props) {
  const { value, canEdit } = props;
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(value?.toString() ?? '');
  const [obs, setObs] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function display() {
    if (value == null) return <span className="text-[var(--muted-foreground)]">—</span>;
    const tone = value >= 18 ? 'success' : value >= 14 ? 'default' : value >= 11 ? 'warning' : 'destructive';
    const letter = value >= 18 ? 'AD' : value >= 14 ? 'A' : value >= 11 ? 'B' : 'C';
    return (
      <span className="inline-flex items-center gap-2">
        <span className="font-semibold">{value.toFixed(1)}</span>
        <Badge variant={tone} className="text-[10px]">{letter}</Badge>
      </span>
    );
  }

  if (!canEdit) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {display()}
      </span>
    );
  }

  function save() {
    setError(null);
    const num = parseFloat(val);
    if (isNaN(num) || num < 0 || num > 20) {
      setError('Ingresa un valor entre 0 y 20.');
      return;
    }
    start(async () => {
      const res = await saveFinalScoreAction({
        studentId: props.studentId,
        courseAssignmentId: props.courseAssignmentId,
        periodId: props.periodId,
        value: num,
        observation: obs || null,
      });
      if (!res.ok) { setError(res.error); return; }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md hover:bg-[var(--muted)] px-1 py-0.5 transition-colors group"
      >
        {display()}
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 text-[var(--muted-foreground)]" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar nota</DialogTitle>
            <DialogDescription>
              {props.studentName} · {props.courseName} · {props.periodName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="value">Nota (0 a 20)</Label>
              <Input
                id="value" inputMode="decimal" autoFocus
                value={val} onChange={(e) => setVal(e.target.value)}
                placeholder="Ej. 16.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs">Observación (opcional)</Label>
              <Textarea id="obs" value={obs} onChange={(e) => setObs(e.target.value)}
                rows={2} placeholder="Comentario formativo para la familia" />
            </div>
            {error && (
              <p className="text-sm text-[var(--destructive)] bg-[var(--soft-danger)] rounded-xl px-3 py-2 flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
