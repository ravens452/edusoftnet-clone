import type { PaymentMethod } from '@/lib/payments';
import { getMethodBrand } from '@/lib/payments';

export function MethodBadge({
  method,
  size = 40,
  className = '',
}: {
  method: PaymentMethod;
  size?: number;
  className?: string;
}) {
  const b = getMethodBrand(method);
  return (
    <div
      className={`rounded-md grid place-items-center font-bold text-xs shrink-0 shadow-sm ${className}`}
      style={{
        width: size,
        height: size,
        background: b.bg,
        color: b.fg,
        fontSize: size * 0.32,
        letterSpacing: '-0.02em',
      }}
      aria-label={b.label}
    >
      {b.mark}
    </div>
  );
}
