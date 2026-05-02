import Image from 'next/image';

export function BrandLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="I.E.P. El Mercedario"
      width={size}
      height={size}
      priority
      className={className}
    />
  );
}
