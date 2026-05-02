import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[96px] w-full rounded-xl border border-[var(--input)] bg-[var(--card)] px-3.5 py-2.5 text-sm',
      'shadow-[0_1px_2px_rgba(15,23,42,0.03)]',
      'placeholder:text-[var(--muted-foreground)]',
      'transition-all duration-200',
      'hover:border-[var(--border-strong)]',
      'focus-visible:outline-none focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/15',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'resize-y',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
