'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.97]',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--primary)] text-[var(--primary-foreground)]',
          'shadow-[0_1px_2px_rgba(0,51,102,0.10),_0_4px_12px_-4px_rgba(0,51,102,0.30)]',
          'hover:shadow-[0_2px_4px_rgba(0,51,102,0.10),_0_8px_20px_-4px_rgba(0,51,102,0.35)]',
          'hover:bg-[var(--primary-hover)]',
        ].join(' '),
        secondary: [
          'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
          'shadow-[0_1px_2px_rgba(255,140,0,0.10),_0_4px_12px_-4px_rgba(255,140,0,0.30)]',
          'hover:shadow-[0_2px_4px_rgba(255,140,0,0.10),_0_8px_20px_-4px_rgba(255,140,0,0.35)]',
          'hover:brightness-105',
        ].join(' '),
        destructive: [
          'bg-[var(--destructive)] text-[var(--destructive-foreground)]',
          'shadow-[0_1px_2px_rgba(197,48,48,0.10),_0_4px_12px_-4px_rgba(197,48,48,0.30)]',
          'hover:brightness-105',
        ].join(' '),
        outline: [
          'border border-[var(--border-strong)] bg-[var(--card)] text-[var(--foreground)]',
          'hover:bg-[var(--muted)] hover:border-[var(--input)]',
        ].join(' '),
        ghost: 'text-[var(--foreground)] hover:bg-[var(--muted)]',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  }
);
Button.displayName = 'Button';
export { buttonVariants };
