'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Unlock, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setWindowStateAction, deleteWindowAction } from './actions';

export function WindowActions({ id, state }: { id: string; state: 'AUTO' | 'FORCE_OPEN' | 'FORCE_CLOSED' }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function setState(s: 'AUTO' | 'FORCE_OPEN' | 'FORCE_CLOSED') {
    start(async () => { await setWindowStateAction(id, s); router.refresh(); });
  }
  function del() {
    if (!confirm('¿Eliminar esta ventana de captura?')) return;
    start(async () => { await deleteWindowAction(id); router.refresh(); });
  }

  return (
    <div className="flex items-center gap-1.5">
      {state !== 'FORCE_OPEN' && (
        <Button size="sm" variant="outline" onClick={() => setState('FORCE_OPEN')} disabled={pending} title="Abrir manualmente">
          <Unlock className="h-3.5 w-3.5" />
        </Button>
      )}
      {state !== 'FORCE_CLOSED' && (
        <Button size="sm" variant="outline" onClick={() => setState('FORCE_CLOSED')} disabled={pending} title="Cerrar manualmente">
          <Lock className="h-3.5 w-3.5" />
        </Button>
      )}
      {state !== 'AUTO' && (
        <Button size="sm" variant="outline" onClick={() => setState('AUTO')} disabled={pending} title="Volver a automático">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={del} disabled={pending} title="Eliminar ventana"
        className="text-[var(--destructive)] hover:bg-[var(--soft-danger)]">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
