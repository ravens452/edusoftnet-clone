import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide',
  {
    variants: {
      variant: {
        default:     'bg-[var(--soft-blue)] text-[var(--brand-blue)] ring-1 ring-inset ring-[var(--brand-blue)]/15',
        secondary:   'bg-[var(--soft-orange)] text-[#7A4500] ring-1 ring-inset ring-[var(--brand-orange)]/20',
        outline:     'border border-[var(--border-strong)] text-[var(--foreground)]',
        success:     'bg-[var(--soft-success)] text-[#136336] ring-1 ring-inset ring-[var(--success)]/20',
        warning:     'bg-[var(--soft-warning)] text-[#92560F] ring-1 ring-inset ring-[var(--warning)]/20',
        destructive: 'bg-[var(--soft-danger)] text-[#9B2A2A] ring-1 ring-inset ring-[var(--destructive)]/20',
        muted:       'bg-[var(--muted)] text-[var(--muted-foreground)]',
        violet:      'bg-[var(--soft-violet)] text-[#5E2A75] ring-1 ring-inset ring-[#742282]/20',
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
