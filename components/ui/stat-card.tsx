import { Card, CardContent } from './card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary';
}) {
  const toneClass = {
    default:     'bg-[var(--soft-blue)] text-[var(--brand-blue)]',
    success:     'bg-[var(--soft-success)] text-[var(--success)]',
    warning:     'bg-[var(--soft-warning)] text-[var(--warning)]',
    destructive: 'bg-[var(--soft-danger)] text-[var(--destructive)]',
    secondary:   'bg-[var(--soft-orange)] text-[var(--brand-orange)]',
  }[tone];

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          {Icon && (
            <div className={cn('h-9 w-9 sm:h-11 sm:w-11 rounded-xl grid place-items-center shrink-0', toneClass)}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--muted-foreground)] font-semibold truncate">
              {label}
            </div>
            <div
              className="text-xl sm:text-2xl font-bold mt-1 sm:mt-1.5 tracking-tight truncate"
              style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
            >
              {value}
            </div>
            {hint && <div className="text-[11px] sm:text-xs text-[var(--muted-foreground)] mt-1 sm:mt-1.5 leading-relaxed">{hint}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
