import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide',
  {
    variants: {
      variant: {
        default:     'bg-[var(--soft-blue)] text-[var(--primary-on-soft)] ring-1 ring-inset ring-[var(--brand-blue)]/15',
        secondary:   'bg-[var(--soft-orange)] text-[var(--secondary-on-soft)] ring-1 ring-inset ring-[var(--secondary-on-soft-ring)]',
        outline:     'border border-[var(--border-strong)] text-[var(--foreground)]',
        success:     'bg-[var(--soft-success)] text-[var(--success-on-soft)] ring-1 ring-inset ring-[var(--success-on-soft-ring)]',
        warning:     'bg-[var(--soft-warning)] text-[var(--warning-on-soft)] ring-1 ring-inset ring-[var(--warning-on-soft-ring)]',
        destructive: 'bg-[var(--soft-danger)] text-[var(--destructive-on-soft)] ring-1 ring-inset ring-[var(--destructive-on-soft-ring)]',
        muted:       'bg-[var(--muted)] text-[var(--muted-foreground)]',
        violet:      'bg-[var(--soft-violet)] text-[var(--violet-on-soft)] ring-1 ring-inset ring-[var(--violet-on-soft-ring)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
