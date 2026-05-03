'use client';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrintButton({ label = 'Imprimir' }: { label?: string }) {
  return (
    <Button size="sm" variant="outline" className="gap-1.5 print:hidden" onClick={() => window.print()}>
      <Printer className="h-4 w-4" /> {label}
    </Button>
  );
}
